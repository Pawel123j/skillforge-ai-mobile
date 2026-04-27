-- ─────────────────────────────────────────────────────────────────────────────
-- SkillForge AI — Seed Data
-- Run AFTER schema.sql in your Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Learning Paths ───────────────────────────────────────────────────────────

INSERT INTO learning_paths (goal, title, description, icon, color, total_modules, estimated_hours) VALUES
  ('frontend',      'Frontend Developer',  'Master HTML, CSS, JavaScript, React, and modern web development tools.', '🎨', '#6366F1', 8, 120),
  ('backend',       'Backend Developer',   'Learn Node.js, databases, REST APIs, authentication, and cloud deployment.', '⚙️', '#10B981', 8, 140),
  ('mobile',        'Mobile Developer',    'Build iOS and Android apps with React Native and Expo.', '📱', '#F59E0B', 7, 100),
  ('cybersecurity', 'Cybersecurity',       'Understand networking, ethical hacking, OWASP, and security best practices.', '🔒', '#EF4444', 9, 160),
  ('data_analyst',  'Data Analyst',        'Master Python, pandas, SQL, visualization, and data storytelling.', '📊', '#8B5CF6', 7, 110),
  ('python',        'Python Developer',    'Learn Python fundamentals, OOP, automation, APIs, and Django/FastAPI.', '🐍', '#3B82F6', 8, 130)
ON CONFLICT (goal) DO NOTHING;

-- ─── Frontend Modules ─────────────────────────────────────────────────────────

WITH fe_path AS (SELECT id FROM learning_paths WHERE goal = 'frontend')
INSERT INTO modules (learning_path_id, title, description, order_index, difficulty, estimated_hours, icon)
SELECT
  fe_path.id,
  m.title, m.description, m.order_index, m.difficulty, m.estimated_hours, m.icon
FROM fe_path, (VALUES
  ('HTML Fundamentals',      'Learn semantic HTML, document structure, forms, and accessibility basics.', 1, 'beginner',     8,  '📝'),
  ('CSS Mastery',            'Master Flexbox, Grid, animations, responsive design, and CSS variables.',   2, 'beginner',     12, '🎨'),
  ('JavaScript Essentials',  'Understand variables, functions, DOM manipulation, events, and async JS.',  3, 'intermediate', 20, '⚡'),
  ('React Fundamentals',     'Learn components, props, state, hooks, and the React ecosystem.',           4, 'intermediate', 25, '⚛️'),
  ('State Management',       'Master Context API, Redux Toolkit, and Zustand for global state.',         5, 'intermediate', 15, '🗄️'),
  ('TypeScript for Frontend','Add type safety to your React apps with TypeScript.',                       6, 'intermediate', 12, '🔷'),
  ('Testing & Quality',      'Write unit and integration tests with Jest and React Testing Library.',     7, 'advanced',     10, '✅'),
  ('Deployment & DevOps',    'Deploy to Vercel, Netlify, set up CI/CD, and optimize performance.',       8, 'advanced',     8,  '🚀')
) AS m(title, description, order_index, difficulty, estimated_hours, icon)
ON CONFLICT (learning_path_id, order_index) DO NOTHING;

-- ─── Frontend Lessons (Module 1 — HTML Fundamentals) ─────────────────────────

WITH html_module AS (
  SELECT m.id FROM modules m
  JOIN learning_paths lp ON m.learning_path_id = lp.id
  WHERE lp.goal = 'frontend' AND m.order_index = 1
)
INSERT INTO lessons (module_id, title, content, order_index, estimated_minutes, type)
SELECT
  html_module.id, l.title, l.content, l.order_index, l.estimated_minutes, l.type
FROM html_module, (VALUES
  ('Introduction to HTML',        '# Introduction to HTML\n\nHTML (HyperText Markup Language) is the standard language for creating web pages.\n\n## Core Concepts\n\n- DOCTYPE declaration tells the browser this is HTML5\n- The html element is the root element\n- head contains metadata\n- body contains visible content\n\n## Practice\n\nCreate a simple HTML page with a heading and paragraph.',     1, 20, 'reading'),
  ('HTML Forms and Inputs',       '# HTML Forms\n\nForms collect user data and send it to servers.\n\n## Key Elements\n\n- form: wraps form elements\n- input: collects various data types\n- label: provides accessible descriptions\n- button: submits the form\n\n## Input Types\n\n- text, email, password, number, checkbox, radio, file',              2, 25, 'exercise'),
  ('Semantic HTML & Accessibility','# Semantic HTML\n\nSemantic elements describe their meaning to both browsers and developers.\n\n## Key Elements\n\n- header, nav, main, article, section, aside, footer\n- Use these instead of generic div elements\n\n## Why It Matters\n\n- Improves SEO rankings\n- Helps screen readers\n- Makes code more maintainable', 3, 20, 'reading'),
  ('HTML Tables and Media',       '# Tables and Media\n\nUse tables for tabular data, never for layout.\n\n## Images\n\nAlways include alt text for accessibility.\nUse width and height attributes to prevent layout shift.\n\n## Video\n\nUse the video element with controls attribute for playback controls.', 4, 15, 'reading')
) AS l(title, content, order_index, estimated_minutes, type)
ON CONFLICT (module_id, order_index) DO NOTHING;

-- ─── Quiz Questions (HTML Fundamentals) ──────────────────────────────────────

WITH html_module AS (
  SELECT m.id FROM modules m
  JOIN learning_paths lp ON m.learning_path_id = lp.id
  WHERE lp.goal = 'frontend' AND m.order_index = 1
)
INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT
  html_module.id, q.question, q.options, q.correct_index, q.explanation
FROM html_module, (VALUES
  (
    'What does HTML stand for?',
    ARRAY['HyperText Markup Language', 'High-Tech Modern Language', 'HyperTransfer Markup Logic', 'Home Tool Markup Language'],
    0,
    'HTML stands for HyperText Markup Language — the standard for creating web pages.'
  ),
  (
    'Which tag creates the largest heading?',
    ARRAY['<h6>', '<heading>', '<h1>', '<header>'],
    2,
    '<h1> creates the largest heading. Headings range from h1 (largest) to h6 (smallest).'
  ),
  (
    'What attribute makes an input required?',
    ARRAY['mandatory', 'required', 'validate', 'must-fill'],
    1,
    'The required attribute prevents form submission if the input is empty.'
  ),
  (
    'What is the purpose of the alt attribute on images?',
    ARRAY['Set image dimensions', 'Provide alternative text for accessibility', 'Link to another page', 'Add a tooltip'],
    1,
    'The alt attribute provides text for screen readers and displays when images fail to load.'
  ),
  (
    'Which element represents the main navigation links?',
    ARRAY['<menu>', '<links>', '<nav>', '<navigation>'],
    2,
    '<nav> is a semantic element that wraps the main navigation links of a page.'
  )
) AS q(question, options, correct_index, explanation)
ON CONFLICT DO NOTHING;

-- ─── Suggested Projects ───────────────────────────────────────────────────────
-- Note: Suggested projects are seeded per user via the app's mock data.
-- In production, you can insert them here for specific user IDs.
-- Example:
-- INSERT INTO projects (user_id, title, description, goal, status, is_suggested, tech_stack) VALUES
--   ('USER_UUID', 'Portfolio Website', 'A personal portfolio site...', 'frontend', 'idea', true, ARRAY['HTML', 'CSS', 'JavaScript']);
