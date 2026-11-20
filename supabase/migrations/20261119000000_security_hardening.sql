-- ─────────────────────────────────────────────────────────────────────────────
-- Security hardening (SF-02, SF-03) — uruchom po supabase/schema.sql.
--
-- SF-02: wynik quizu i XP były liczone i zapisywane przez klienta, a poprawne odpowiedzi
-- (quiz_questions.correct_index) były czytelne dla każdego zalogowanego. Użytkownik mógł
-- wstawić dowolny wynik albo podnieść sobie XP jednym zapytaniem REST.
-- Teraz:
--   * correct_index i explanation nie są czytelne bezpośrednio — klient dostaje je
--     dopiero po zapisaniu odpowiedzi (answer_quiz_question; liczy się pierwsza odpowiedź),
--   * wynik liczy serwer (finish_quiz) z zapisanych odpowiedzi,
--   * XP, ukończone lekcje/moduły i seria dni zmienia wyłącznie serwer (complete_lesson,
--     finish_quiz); klient nie ma uprawnień UPDATE do user_progress ani INSERT do quiz_results.
-- SF-03: funkcje SECURITY DEFINER mają przypięty search_path.
--
-- Migracja jest idempotentna (można ją uruchomić ponownie).
-- ─────────────────────────────────────────────────────────────────────────────

-- SF-03 ─ funkcja z istniejącego schematu
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;

-- ─── Ukrycie odpowiedzi ──────────────────────────────────────────────────────
REVOKE SELECT ON public.quiz_questions FROM anon, authenticated;
GRANT SELECT (id, module_id, question, options, created_at) ON public.quiz_questions TO authenticated;

-- ─── Odpowiedzi w ramach podejścia (zapis tylko przez RPC) ───────────────────
CREATE TABLE IF NOT EXISTS public.quiz_answers (
  attempt_id    UUID        NOT NULL,
  question_id   UUID        NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id     UUID        NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  chosen_index  INTEGER     NOT NULL,
  correct       BOOLEAN     NOT NULL,
  answered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (attempt_id, question_id)
);
CREATE INDEX IF NOT EXISTS quiz_answers_user_attempt_idx ON public.quiz_answers (user_id, attempt_id);
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quiz_answers_select_own" ON public.quiz_answers;
CREATE POLICY "quiz_answers_select_own" ON public.quiz_answers FOR SELECT USING (auth.uid() = user_id);

-- Jedno podejście = jeden zapisany wynik.
ALTER TABLE public.quiz_results ADD COLUMN IF NOT EXISTS attempt_id UUID UNIQUE;

-- ─── Odebranie klientowi zapisu wyników i postępu ───────────────────────────
DROP POLICY IF EXISTS "quiz_results_insert_own" ON public.quiz_results;
DROP POLICY IF EXISTS "user_progress_update_own" ON public.user_progress;
DROP POLICY IF EXISTS "user_progress_insert_own" ON public.user_progress;
-- Wiersz postępu tworzy trigger handle_new_user; klient może go utworzyć tylko „pusty"
-- (awaryjnie, gdy trigger nie zadziałał) — nigdy z własnym XP.
CREATE POLICY "user_progress_insert_own" ON public.user_progress FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND xp = 0 AND streak_days = 0
  AND completed_lessons = '{}' AND completed_modules = '{}'
  AND last_activity_date IS NULL
);
REVOKE UPDATE, DELETE ON public.user_progress FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.quiz_results FROM anon, authenticated;

-- ─── RPC: odpowiedź na pytanie ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.answer_quiz_question(
  p_attempt_id UUID, p_question_id UUID, p_chosen_index INTEGER
) RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user UUID := auth.uid();
  v_question public.quiz_questions%ROWTYPE;
  v_answer public.quiz_answers%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000'; END IF;
  IF EXISTS (SELECT 1 FROM public.quiz_answers WHERE attempt_id = p_attempt_id AND user_id <> v_user) THEN
    RAISE EXCEPTION 'attempt belongs to another user' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (SELECT 1 FROM public.quiz_results WHERE attempt_id = p_attempt_id) THEN
    RAISE EXCEPTION 'attempt already finished' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_question FROM public.quiz_questions WHERE id = p_question_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'unknown question' USING ERRCODE = '22023'; END IF;
  IF p_chosen_index < 0 OR p_chosen_index >= cardinality(v_question.options) THEN
    RAISE EXCEPTION 'invalid option' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM public.quiz_answers WHERE attempt_id = p_attempt_id AND module_id <> v_question.module_id) THEN
    RAISE EXCEPTION 'attempt covers another module' USING ERRCODE = '22023';
  END IF;

  -- Pierwsza odpowiedź jest ostateczna: kolejne wywołania nie zmieniają zapisanego wyniku.
  INSERT INTO public.quiz_answers (attempt_id, question_id, user_id, module_id, chosen_index, correct)
  VALUES (p_attempt_id, p_question_id, v_user, v_question.module_id, p_chosen_index,
          p_chosen_index = v_question.correct_index)
  ON CONFLICT (attempt_id, question_id) DO NOTHING;
  SELECT * INTO v_answer FROM public.quiz_answers WHERE attempt_id = p_attempt_id AND question_id = p_question_id;

  RETURN json_build_object(
    'correct', v_answer.correct,
    'chosen_index', v_answer.chosen_index,
    'correct_index', v_question.correct_index,
    'explanation', v_question.explanation
  );
END;
$$;

-- ─── RPC: zakończenie quizu (wynik i XP liczone na serwerze) ────────────────
CREATE OR REPLACE FUNCTION public.finish_quiz(p_attempt_id UUID, p_module_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user UUID := auth.uid();
  v_total INTEGER;
  v_answered INTEGER;
  v_correct INTEGER;
  v_passed BOOLEAN;
  v_result public.quiz_results%ROWTYPE;
  v_progress public.user_progress%ROWTYPE;
  c_pass_threshold CONSTANT NUMERIC := 0.7;  -- QUIZ_PASS_THRESHOLD
  c_quiz_xp CONSTANT INTEGER := 100;         -- XP_VALUES.QUIZ_PASS
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000'; END IF;
  SELECT count(*) INTO v_total FROM public.quiz_questions WHERE module_id = p_module_id;
  SELECT count(*), count(*) FILTER (WHERE correct) INTO v_answered, v_correct
    FROM public.quiz_answers
   WHERE attempt_id = p_attempt_id AND user_id = v_user AND module_id = p_module_id;
  IF v_total = 0 OR v_answered < v_total THEN
    RAISE EXCEPTION 'answer every question before finishing' USING ERRCODE = '22023';
  END IF;

  v_passed := v_correct::NUMERIC / v_total >= c_pass_threshold;
  INSERT INTO public.quiz_results (user_id, module_id, score, total_questions, passed, attempt_id)
  VALUES (v_user, p_module_id, v_correct, v_total, v_passed, p_attempt_id)
  RETURNING * INTO v_result;  -- UNIQUE(attempt_id): podejście kończy się tylko raz

  SELECT * INTO v_progress FROM public.user_progress WHERE user_id = v_user FOR UPDATE;
  IF v_passed AND FOUND AND NOT (p_module_id::TEXT = ANY (v_progress.completed_modules)) THEN
    UPDATE public.user_progress
       SET completed_modules = array_append(completed_modules, p_module_id::TEXT),
           xp = xp + c_quiz_xp,
           updated_at = NOW()
     WHERE user_id = v_user
    RETURNING * INTO v_progress;
  END IF;

  RETURN json_build_object('result', row_to_json(v_result), 'progress', row_to_json(v_progress));
END;
$$;

-- ─── RPC: ukończenie lekcji (XP i seria dni liczone na serwerze) ────────────
CREATE OR REPLACE FUNCTION public.complete_lesson(p_lesson_id UUID)
RETURNS public.user_progress
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user UUID := auth.uid();
  v_progress public.user_progress%ROWTYPE;
  v_today DATE := (NOW() AT TIME ZONE 'UTC')::DATE;
  v_new_day BOOLEAN;
  c_lesson_xp CONSTANT INTEGER := 50;   -- XP_VALUES.LESSON_COMPLETE
  c_streak_xp CONSTANT INTEGER := 10;   -- XP_VALUES.STREAK_BONUS
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE id = p_lesson_id) THEN
    RAISE EXCEPTION 'unknown lesson' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_progress FROM public.user_progress WHERE user_id = v_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'progress row missing' USING ERRCODE = '22023'; END IF;
  IF p_lesson_id::TEXT = ANY (v_progress.completed_lessons) THEN RETURN v_progress; END IF;

  v_new_day := v_progress.last_activity_date IS DISTINCT FROM v_today;
  UPDATE public.user_progress
     SET completed_lessons = array_append(completed_lessons, p_lesson_id::TEXT),
         xp = xp + c_lesson_xp + CASE WHEN v_new_day THEN c_streak_xp ELSE 0 END,
         streak_days = CASE
           WHEN NOT v_new_day THEN streak_days
           WHEN last_activity_date = v_today - 1 THEN streak_days + 1
           ELSE 1 END,
         last_activity_date = v_today,
         updated_at = NOW()
   WHERE user_id = v_user
  RETURNING * INTO v_progress;
  RETURN v_progress;
END;
$$;

REVOKE ALL ON FUNCTION public.answer_quiz_question(UUID, UUID, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.finish_quiz(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.complete_lesson(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.answer_quiz_question(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finish_quiz(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_lesson(UUID) TO authenticated;
