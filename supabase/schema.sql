-- ─────────────────────────────────────────────────────────────────────────────
-- SkillForge AI — Supabase Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Profiles ─────────────────────────────────────────────────────────────────

CREATE TABLE profiles (
  id                   UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name            TEXT NOT NULL DEFAULT '',
  learning_goal        TEXT CHECK (learning_goal IN ('frontend', 'backend', 'mobile', 'cybersecurity', 'data_analyst', 'python')),
  skill_level          TEXT CHECK (skill_level IN ('beginner', 'intermediate')),
  daily_time_minutes   INTEGER CHECK (daily_time_minutes IN (15, 30, 60, 90)),
  avatar_url           TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Learning Paths ───────────────────────────────────────────────────────────

CREATE TABLE learning_paths (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  goal             TEXT NOT NULL UNIQUE CHECK (goal IN ('frontend', 'backend', 'mobile', 'cybersecurity', 'data_analyst', 'python')),
  title            TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  icon             TEXT NOT NULL DEFAULT '📚',
  color            TEXT NOT NULL DEFAULT '#6366F1',
  total_modules    INTEGER NOT NULL DEFAULT 0,
  estimated_hours  INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Modules ─────────────────────────────────────────────────────────────────

CREATE TABLE modules (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  learning_path_id  UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  order_index       INTEGER NOT NULL,
  difficulty        TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_hours   INTEGER NOT NULL DEFAULT 0,
  icon              TEXT NOT NULL DEFAULT '📚',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (learning_path_id, order_index)
);

-- ─── Lessons ─────────────────────────────────────────────────────────────────

CREATE TABLE lessons (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  module_id           UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  content             TEXT NOT NULL DEFAULT '',
  order_index         INTEGER NOT NULL,
  estimated_minutes   INTEGER NOT NULL DEFAULT 20,
  type                TEXT NOT NULL DEFAULT 'reading' CHECK (type IN ('reading', 'video', 'exercise', 'project')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (module_id, order_index)
);

-- ─── Tasks ───────────────────────────────────────────────────────────────────

CREATE TABLE tasks (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  module_id     UUID REFERENCES modules(id) ON DELETE SET NULL,
  module_title  TEXT,
  status        TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date      DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Projects ────────────────────────────────────────────────────────────────

CREATE TABLE projects (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  goal          TEXT CHECK (goal IN ('frontend', 'backend', 'mobile', 'cybersecurity', 'data_analyst', 'python')),
  status        TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'building', 'completed')),
  github_url    TEXT,
  is_suggested  BOOLEAN NOT NULL DEFAULT FALSE,
  tech_stack    TEXT[] NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Quiz Questions ───────────────────────────────────────────────────────────

CREATE TABLE quiz_questions (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  module_id       UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  question        TEXT NOT NULL,
  options         TEXT[] NOT NULL,
  correct_index   INTEGER NOT NULL,
  explanation     TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Quiz Results ─────────────────────────────────────────────────────────────

CREATE TABLE quiz_results (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id        UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  score            INTEGER NOT NULL,
  total_questions  INTEGER NOT NULL,
  passed           BOOLEAN NOT NULL,
  taken_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── User Progress ────────────────────────────────────────────────────────────

CREATE TABLE user_progress (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  completed_lessons   TEXT[] NOT NULL DEFAULT '{}',
  completed_modules   TEXT[] NOT NULL DEFAULT '{}',
  xp                  INTEGER NOT NULL DEFAULT 0,
  streak_days         INTEGER NOT NULL DEFAULT 0,
  last_activity_date  DATE,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security (RLS) Policies
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths  ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules         ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress   ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/write their own profile
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Learning paths, modules, lessons: readable by all authenticated users
CREATE POLICY "learning_paths_select_auth" ON learning_paths FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "modules_select_auth"        ON modules        FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "lessons_select_auth"        ON lessons        FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "quiz_questions_select_auth" ON quiz_questions FOR SELECT USING (auth.role() = 'authenticated');

-- Tasks: users can only access their own tasks
CREATE POLICY "tasks_select_own" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tasks_insert_own" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update_own" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tasks_delete_own" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- Projects: users can only access their own projects
CREATE POLICY "projects_select_own" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "projects_insert_own" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects_update_own" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "projects_delete_own" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Quiz results: users can only access their own results
CREATE POLICY "quiz_results_select_own" ON quiz_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "quiz_results_insert_own" ON quiz_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User progress: users can only access their own progress
CREATE POLICY "user_progress_select_own" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_progress_insert_own" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_progress_update_own" ON user_progress FOR UPDATE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Triggers: auto-create profile on user signup
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_progress (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Trigger: auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at  BEFORE UPDATE ON profiles  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tasks_updated_at     BEFORE UPDATE ON tasks     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER projects_updated_at  BEFORE UPDATE ON projects  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER progress_updated_at  BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at();
