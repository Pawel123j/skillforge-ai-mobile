-- Testy regresyjne SF-02/SF-03. Uruchom po schema.sql, seed.sql i migracji 20261119000000
-- na bazie z rolami Supabase (anon/authenticated) i schematem auth. Każdy blok rzuca
-- wyjątek, gdy zabezpieczenie nie działa; na końcu wypisuje "ALL SECURITY TESTS PASSED".
\set ON_ERROR_STOP 1

-- Dwóch użytkowników testowych (trigger handle_new_user tworzy profile i postęp).
INSERT INTO auth.users (id) VALUES
  ('00000000-0000-4000-8000-0000000000a1'), ('00000000-0000-4000-8000-0000000000b2')
ON CONFLICT DO NOTHING;

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.role', 'authenticated', false);
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);

DO $$
DECLARE v_module UUID; v_q RECORD; v_attempt UUID := gen_random_uuid(); v_res JSON;
        v_first BOOLEAN := TRUE; v_xp_before INT; v_xp_after INT; v_lesson UUID; v_score INT; v_total INT;
BEGIN
  -- 1. Poprawne odpowiedzi nie są czytelne bezpośrednio.
  BEGIN
    PERFORM correct_index FROM public.quiz_questions LIMIT 1;
    RAISE EXCEPTION 'FAIL: correct_index readable';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  PERFORM id, question, options FROM public.quiz_questions LIMIT 1;  -- treść pytań nadal dostępna

  -- 2. Klient nie wstawi wyniku ani nie zmieni XP.
  SELECT module_id INTO v_module FROM public.quiz_questions LIMIT 1;
  BEGIN
    INSERT INTO public.quiz_results (user_id, module_id, score, total_questions, passed)
    VALUES (auth.uid(), v_module, 99, 1, true);
    RAISE EXCEPTION 'FAIL: client inserted quiz result';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    UPDATE public.user_progress SET xp = 999999 WHERE user_id = auth.uid();
    RAISE EXCEPTION 'FAIL: client updated xp';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  -- 3. Pierwsza odpowiedź jest ostateczna; wynik liczy serwer.
  SELECT xp INTO v_xp_before FROM public.user_progress WHERE user_id = auth.uid();
  FOR v_q IN SELECT id, options FROM public.quiz_questions WHERE module_id = v_module LOOP
    v_res := public.answer_quiz_question(v_attempt, v_q.id, 0);
    IF v_first THEN
      -- ponowna próba z poprawną odpowiedzią nie zmienia zapisanej
      v_res := public.answer_quiz_question(v_attempt, v_q.id, (v_res->>'correct_index')::INT);
      IF (v_res->>'chosen_index')::INT <> 0 THEN RAISE EXCEPTION 'FAIL: answer was overwritten'; END IF;
      v_first := FALSE;
    END IF;
  END LOOP;
  BEGIN
    PERFORM public.finish_quiz(gen_random_uuid(), v_module);
    RAISE EXCEPTION 'FAIL: finished an attempt without answers';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  v_res := public.finish_quiz(v_attempt, v_module);
  SELECT count(*), count(*) FILTER (WHERE correct) INTO v_total, v_score
    FROM public.quiz_answers WHERE attempt_id = v_attempt;
  IF (v_res->'result'->>'score')::INT <> v_score THEN RAISE EXCEPTION 'FAIL: score not computed server-side'; END IF;
  BEGIN
    PERFORM public.finish_quiz(v_attempt, v_module);
    RAISE EXCEPTION 'FAIL: attempt finished twice';
  EXCEPTION WHEN unique_violation THEN NULL; END;

  -- 4. Lekcja daje XP tylko raz.
  SELECT id INTO v_lesson FROM public.lessons LIMIT 1;
  SELECT xp INTO v_xp_before FROM public.user_progress WHERE user_id = auth.uid();
  PERFORM public.complete_lesson(v_lesson);
  PERFORM public.complete_lesson(v_lesson);
  SELECT xp INTO v_xp_after FROM public.user_progress WHERE user_id = auth.uid();
  IF v_xp_after - v_xp_before <> 60 THEN
    RAISE EXCEPTION 'FAIL: lesson xp delta %, expected 60 (50 + streak bonus once)', v_xp_after - v_xp_before;
  END IF;

  -- 5. Cudze podejście jest niedostępne.
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000b2', false);
  BEGIN
    PERFORM public.answer_quiz_question(v_attempt, v_q.id, 0);
    RAISE EXCEPTION 'FAIL: used another user''s attempt';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  IF EXISTS (SELECT 1 FROM public.quiz_answers WHERE attempt_id = v_attempt) THEN
    RAISE EXCEPTION 'FAIL: other user can read answers';
  END IF;

  -- 6. Klient nie usunie (i nie zresetuje) postępu.
  BEGIN
    DELETE FROM public.user_progress WHERE user_id = auth.uid();
    RAISE EXCEPTION 'FAIL: client deleted progress';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000b2', false);
RESET ROLE;
DELETE FROM public.user_progress WHERE user_id = '00000000-0000-4000-8000-0000000000b2';
SET ROLE authenticated;
DO $$ BEGIN
  INSERT INTO public.user_progress (user_id, xp) VALUES (auth.uid(), 5000);
  RAISE EXCEPTION 'FAIL: inserted progress with arbitrary xp';
EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;
INSERT INTO public.user_progress (user_id) VALUES (auth.uid());  -- pusty wiersz dozwolony

-- 7. Anonim nie wywoła RPC.
RESET ROLE;
SET ROLE anon;
DO $$ BEGIN
  PERFORM public.complete_lesson(gen_random_uuid());
  RAISE EXCEPTION 'FAIL: anon executed RPC';
EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;
RESET ROLE;

-- 8. SF-03: search_path przypięty dla wszystkich SECURITY DEFINER w public.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE n.nspname = 'public' AND p.prosecdef
               AND NOT EXISTS (SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) c WHERE c LIKE 'search_path=%')) THEN
    RAISE EXCEPTION 'FAIL: SECURITY DEFINER function without search_path';
  END IF;
END $$;

SELECT 'ALL SECURITY TESTS PASSED' AS status;
