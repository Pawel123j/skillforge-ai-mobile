import {
  Profile,
  LearningPath,
  Module,
  Lesson,
  Task,
  Project,
  QuizQuestion,
  UserProgress,
  LearningGoal,
} from '@/types';

// ─── Mock User ────────────────────────────────────────────────────────────────

export const MOCK_USER_ID = 'mock-user-001';

export const MOCK_PROFILE: Profile = {
  id: 'mock-profile-001',
  user_id: MOCK_USER_ID,
  full_name: 'Alex Chen',
  learning_goal: 'frontend',
  skill_level: 'beginner',
  daily_time_minutes: 30,
  avatar_url: null,
  onboarding_completed: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
};

// ─── Mock Progress ────────────────────────────────────────────────────────────

export const MOCK_PROGRESS: UserProgress = {
  id: 'mock-progress-001',
  user_id: MOCK_USER_ID,
  completed_lessons: ['lesson-1', 'lesson-2', 'lesson-3', 'lesson-4'],
  completed_modules: ['module-1'],
  xp: 450,
  streak_days: 7,
  last_activity_date: new Date().toISOString().split('T')[0],
  updated_at: new Date().toISOString(),
};

// ─── Mock Learning Paths ──────────────────────────────────────────────────────

export const MOCK_LEARNING_PATHS: LearningPath[] = [
  {
    id: 'path-frontend',
    goal: 'frontend',
    title: 'Frontend Developer',
    description: 'Master HTML, CSS, JavaScript, React, and modern web development tools.',
    icon: '🎨',
    color: '#6366F1',
    total_modules: 8,
    estimated_hours: 120,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'path-backend',
    goal: 'backend',
    title: 'Backend Developer',
    description: 'Learn Node.js, databases, REST APIs, authentication, and cloud deployment.',
    icon: '⚙️',
    color: '#10B981',
    total_modules: 8,
    estimated_hours: 140,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'path-mobile',
    goal: 'mobile',
    title: 'Mobile Developer',
    description: 'Build iOS and Android apps with React Native and Expo.',
    icon: '📱',
    color: '#F59E0B',
    total_modules: 7,
    estimated_hours: 100,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'path-cybersecurity',
    goal: 'cybersecurity',
    title: 'Cybersecurity',
    description: 'Understand networking, ethical hacking, OWASP, and security best practices.',
    icon: '🔒',
    color: '#EF4444',
    total_modules: 9,
    estimated_hours: 160,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'path-data',
    goal: 'data_analyst',
    title: 'Data Analyst',
    description: 'Master Python, pandas, SQL, visualization, and data storytelling.',
    icon: '📊',
    color: '#8B5CF6',
    total_modules: 7,
    estimated_hours: 110,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'path-python',
    goal: 'python',
    title: 'Python Developer',
    description: 'Learn Python fundamentals, OOP, automation, APIs, and Django/FastAPI.',
    icon: '🐍',
    color: '#3B82F6',
    total_modules: 8,
    estimated_hours: 130,
    created_at: '2024-01-01T00:00:00Z',
  },
];

// ─── Mock Modules ─────────────────────────────────────────────────────────────

export const MOCK_MODULES: Record<LearningGoal, Module[]> = {
  frontend: [
    {
      id: 'module-1',
      learning_path_id: 'path-frontend',
      title: 'HTML Fundamentals',
      description: 'Learn semantic HTML, document structure, forms, and accessibility basics.',
      order_index: 1,
      difficulty: 'beginner',
      estimated_hours: 8,
      icon: '📝',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'module-2',
      learning_path_id: 'path-frontend',
      title: 'CSS Mastery',
      description: 'Master Flexbox, Grid, animations, responsive design, and CSS variables.',
      order_index: 2,
      difficulty: 'beginner',
      estimated_hours: 12,
      icon: '🎨',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'module-3',
      learning_path_id: 'path-frontend',
      title: 'JavaScript Essentials',
      description: 'Understand variables, functions, DOM manipulation, events, and async JS.',
      order_index: 3,
      difficulty: 'intermediate',
      estimated_hours: 20,
      icon: '⚡',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'module-4',
      learning_path_id: 'path-frontend',
      title: 'React Fundamentals',
      description: 'Learn components, props, state, hooks, and the React ecosystem.',
      order_index: 4,
      difficulty: 'intermediate',
      estimated_hours: 25,
      icon: '⚛️',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'module-5',
      learning_path_id: 'path-frontend',
      title: 'State Management',
      description: 'Master Context API, Redux Toolkit, and Zustand for global state.',
      order_index: 5,
      difficulty: 'intermediate',
      estimated_hours: 15,
      icon: '🗄️',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'module-6',
      learning_path_id: 'path-frontend',
      title: 'TypeScript for Frontend',
      description: 'Add type safety to your React apps with TypeScript.',
      order_index: 6,
      difficulty: 'intermediate',
      estimated_hours: 12,
      icon: '🔷',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'module-7',
      learning_path_id: 'path-frontend',
      title: 'Testing & Quality',
      description: 'Write unit and integration tests with Jest and React Testing Library.',
      order_index: 7,
      difficulty: 'advanced',
      estimated_hours: 10,
      icon: '✅',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'module-8',
      learning_path_id: 'path-frontend',
      title: 'Deployment & DevOps',
      description: 'Deploy to Vercel, Netlify, set up CI/CD, and optimize performance.',
      order_index: 8,
      difficulty: 'advanced',
      estimated_hours: 8,
      icon: '🚀',
      created_at: '2024-01-01T00:00:00Z',
    },
  ],
  backend: [
    {
      id: 'be-module-1',
      learning_path_id: 'path-backend',
      title: 'Node.js Basics',
      description: 'Understand the Node.js runtime, modules, npm, and the event loop.',
      order_index: 1,
      difficulty: 'beginner',
      estimated_hours: 10,
      icon: '🟢',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'be-module-2',
      learning_path_id: 'path-backend',
      title: 'REST API Design',
      description: 'Build RESTful APIs with Express.js, middleware, and error handling.',
      order_index: 2,
      difficulty: 'beginner',
      estimated_hours: 15,
      icon: '🔗',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'be-module-3',
      learning_path_id: 'path-backend',
      title: 'Databases & SQL',
      description: 'Learn PostgreSQL, schema design, queries, and ORMs like Prisma.',
      order_index: 3,
      difficulty: 'intermediate',
      estimated_hours: 20,
      icon: '🗃️',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'be-module-4',
      learning_path_id: 'path-backend',
      title: 'Authentication & Security',
      description: 'Implement JWT, OAuth 2.0, bcrypt hashing, and security headers.',
      order_index: 4,
      difficulty: 'intermediate',
      estimated_hours: 15,
      icon: '🔐',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'be-module-5',
      learning_path_id: 'path-backend',
      title: 'Cloud & Deployment',
      description: 'Deploy to AWS, Docker, CI/CD pipelines, and environment management.',
      order_index: 5,
      difficulty: 'advanced',
      estimated_hours: 20,
      icon: '☁️',
      created_at: '2024-01-01T00:00:00Z',
    },
  ],
  mobile: [
    {
      id: 'mob-module-1',
      learning_path_id: 'path-mobile',
      title: 'React Native Basics',
      description: 'Learn components, StyleSheet, Flexbox layout, and the RN ecosystem.',
      order_index: 1,
      difficulty: 'beginner',
      estimated_hours: 12,
      icon: '📱',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'mob-module-2',
      learning_path_id: 'path-mobile',
      title: 'Expo & Navigation',
      description: 'Master Expo SDK, Expo Router, and native device APIs.',
      order_index: 2,
      difficulty: 'beginner',
      estimated_hours: 15,
      icon: '🗺️',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'mob-module-3',
      learning_path_id: 'path-mobile',
      title: 'State & Data Fetching',
      description: 'Use Zustand, React Query, and AsyncStorage for mobile state.',
      order_index: 3,
      difficulty: 'intermediate',
      estimated_hours: 15,
      icon: '🔄',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'mob-module-4',
      learning_path_id: 'path-mobile',
      title: 'Publishing & Deployment',
      description: 'Build and publish to App Store and Google Play with EAS Build.',
      order_index: 4,
      difficulty: 'advanced',
      estimated_hours: 10,
      icon: '🚀',
      created_at: '2024-01-01T00:00:00Z',
    },
  ],
  cybersecurity: [
    {
      id: 'sec-module-1',
      learning_path_id: 'path-cybersecurity',
      title: 'Networking Fundamentals',
      description: 'TCP/IP, DNS, HTTP, firewalls, VPNs, and network security basics.',
      order_index: 1,
      difficulty: 'beginner',
      estimated_hours: 15,
      icon: '🌐',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'sec-module-2',
      learning_path_id: 'path-cybersecurity',
      title: 'Linux & Command Line',
      description: 'Master Linux for security: file permissions, bash scripting, tools.',
      order_index: 2,
      difficulty: 'beginner',
      estimated_hours: 12,
      icon: '🐧',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'sec-module-3',
      learning_path_id: 'path-cybersecurity',
      title: 'Ethical Hacking',
      description: 'Penetration testing methodology, recon, exploitation, and reporting.',
      order_index: 3,
      difficulty: 'intermediate',
      estimated_hours: 25,
      icon: '🔓',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'sec-module-4',
      learning_path_id: 'path-cybersecurity',
      title: 'Web Security & OWASP',
      description: 'Understand SQL injection, XSS, CSRF, and the OWASP Top 10.',
      order_index: 4,
      difficulty: 'intermediate',
      estimated_hours: 20,
      icon: '🕸️',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'sec-module-5',
      learning_path_id: 'path-cybersecurity',
      title: 'Incident Response & Forensics',
      description: 'Learn SIEM, log analysis, digital forensics, and incident handling.',
      order_index: 5,
      difficulty: 'advanced',
      estimated_hours: 20,
      icon: '🔍',
      created_at: '2024-01-01T00:00:00Z',
    },
  ],
  data_analyst: [
    {
      id: 'da-module-1',
      learning_path_id: 'path-data',
      title: 'Python for Data',
      description: 'Python basics, NumPy, pandas, and data manipulation.',
      order_index: 1,
      difficulty: 'beginner',
      estimated_hours: 18,
      icon: '🐍',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'da-module-2',
      learning_path_id: 'path-data',
      title: 'SQL & Databases',
      description: 'Write advanced SQL queries, joins, aggregations, and window functions.',
      order_index: 2,
      difficulty: 'beginner',
      estimated_hours: 15,
      icon: '🗃️',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'da-module-3',
      learning_path_id: 'path-data',
      title: 'Data Visualization',
      description: 'Build charts with Matplotlib, Seaborn, and interactive dashboards.',
      order_index: 3,
      difficulty: 'intermediate',
      estimated_hours: 15,
      icon: '📈',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'da-module-4',
      learning_path_id: 'path-data',
      title: 'Statistics & Machine Learning',
      description: 'Statistical analysis, hypothesis testing, and intro to ML with scikit-learn.',
      order_index: 4,
      difficulty: 'intermediate',
      estimated_hours: 25,
      icon: '🤖',
      created_at: '2024-01-01T00:00:00Z',
    },
  ],
  python: [
    {
      id: 'py-module-1',
      learning_path_id: 'path-python',
      title: 'Python Fundamentals',
      description: 'Variables, data types, control flow, functions, and modules.',
      order_index: 1,
      difficulty: 'beginner',
      estimated_hours: 15,
      icon: '🐍',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'py-module-2',
      learning_path_id: 'path-python',
      title: 'Object-Oriented Python',
      description: 'Classes, inheritance, magic methods, and design patterns.',
      order_index: 2,
      difficulty: 'intermediate',
      estimated_hours: 18,
      icon: '🏗️',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'py-module-3',
      learning_path_id: 'path-python',
      title: 'APIs & Web Scraping',
      description: 'Build and consume REST APIs, requests library, BeautifulSoup.',
      order_index: 3,
      difficulty: 'intermediate',
      estimated_hours: 15,
      icon: '🔗',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'py-module-4',
      learning_path_id: 'path-python',
      title: 'Django & FastAPI',
      description: 'Build production web applications with Django and FastAPI.',
      order_index: 4,
      difficulty: 'advanced',
      estimated_hours: 25,
      icon: '⚡',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'py-module-5',
      learning_path_id: 'path-python',
      title: 'Automation & Scripting',
      description: 'Automate tasks, work with files, emails, and scheduled jobs.',
      order_index: 5,
      difficulty: 'intermediate',
      estimated_hours: 12,
      icon: '🤖',
      created_at: '2024-01-01T00:00:00Z',
    },
  ],
};

// ─── Mock Lessons ─────────────────────────────────────────────────────────────

export const MOCK_LESSONS: Lesson[] = [
  {
    id: 'lesson-1',
    module_id: 'module-1',
    title: 'Introduction to HTML',
    content: `# Introduction to HTML

HTML (HyperText Markup Language) is the standard language for creating web pages. It describes the structure of a web page using elements represented by tags.

## What You'll Learn
- What HTML is and how browsers interpret it
- Basic document structure with DOCTYPE, html, head, and body
- Essential tags: headings, paragraphs, links, images, lists

## Core Concepts

### Document Structure
Every HTML document follows this basic structure:
\`\`\`html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>My Page</title>
  </head>
  <body>
    <h1>Hello World</h1>
  </body>
</html>
\`\`\`

### Semantic HTML
Use elements that convey meaning:
- \`<header>\` - page or section header
- \`<nav>\` - navigation links
- \`<main>\` - main content
- \`<article>\` - self-contained content
- \`<footer>\` - page or section footer

## Practice Exercise
Create a simple webpage about yourself with a heading, a paragraph, and a list of your skills.`,
    order_index: 1,
    estimated_minutes: 20,
    type: 'reading',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'lesson-2',
    module_id: 'module-1',
    title: 'HTML Forms and Inputs',
    content: `# HTML Forms and Inputs

Forms are how users interact with your web page. They collect data and send it to a server.

## Form Elements

### The \`<form>\` Tag
\`\`\`html
<form action="/submit" method="post">
  <label for="name">Name:</label>
  <input type="text" id="name" name="name" required>

  <label for="email">Email:</label>
  <input type="email" id="email" name="email">

  <button type="submit">Submit</button>
</form>
\`\`\`

## Input Types
- \`text\` - single line text
- \`email\` - email validation built-in
- \`password\` - masked input
- \`number\` - numeric input
- \`checkbox\` - toggle option
- \`radio\` - single selection from group
- \`file\` - file upload

## Accessibility
Always pair \`<label>\` with inputs using the \`for\` attribute matching the input's \`id\`. This improves screen reader support.`,
    order_index: 2,
    estimated_minutes: 25,
    type: 'reading',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'lesson-3',
    module_id: 'module-1',
    title: 'Semantic HTML & Accessibility',
    content: `# Semantic HTML & Accessibility

Semantic HTML uses elements that have meaning beyond just visual presentation. It helps search engines understand your content and makes your site accessible to everyone.

## Why It Matters
- **SEO**: Search engines rank semantic pages higher
- **Accessibility**: Screen readers navigate by semantic structure
- **Maintainability**: Code is easier to read and maintain

## Key Semantic Elements

### Content Structure
\`\`\`html
<header>
  <nav>...</nav>
</header>
<main>
  <article>
    <h1>Article Title</h1>
    <section>
      <h2>Section</h2>
      <p>Content...</p>
    </section>
  </article>
  <aside>Related content</aside>
</main>
<footer>...</footer>
\`\`\`

## ARIA Labels
When HTML semantics aren't enough:
\`\`\`html
<button aria-label="Close dialog">✕</button>
<div role="alert" aria-live="polite">Error message</div>
\`\`\``,
    order_index: 3,
    estimated_minutes: 20,
    type: 'reading',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'lesson-4',
    module_id: 'module-1',
    title: 'HTML Tables and Media',
    content: `# HTML Tables and Media

## Tables
Use tables for tabular data — not for layout!

\`\`\`html
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Role</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Alex</td>
      <td>Developer</td>
    </tr>
  </tbody>
</table>
\`\`\`

## Images
\`\`\`html
<!-- Always include alt text -->
<img src="photo.jpg" alt="A sunset over the mountains" width="800" height="600">

<!-- Responsive images -->
<picture>
  <source media="(min-width: 800px)" srcset="large.jpg">
  <img src="small.jpg" alt="Description">
</picture>
\`\`\`

## Audio & Video
\`\`\`html
<video controls width="640">
  <source src="video.mp4" type="video/mp4">
  Your browser doesn't support video.
</video>
\`\`\``,
    order_index: 4,
    estimated_minutes: 15,
    type: 'reading',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'lesson-5',
    module_id: 'module-2',
    title: 'CSS Flexbox Layout',
    content: `# CSS Flexbox Layout

Flexbox is a one-dimensional layout system that handles either rows or columns.

## Core Concepts

### Container Properties
\`\`\`css
.container {
  display: flex;
  flex-direction: row;        /* row | column */
  justify-content: center;   /* main axis alignment */
  align-items: center;       /* cross axis alignment */
  flex-wrap: wrap;           /* allow wrapping */
  gap: 16px;                 /* spacing between items */
}
\`\`\`

### Item Properties
\`\`\`css
.item {
  flex: 1;           /* grow and shrink equally */
  flex-grow: 1;      /* how much it grows */
  flex-shrink: 0;    /* prevent shrinking */
  flex-basis: 200px; /* starting size */
  align-self: flex-start; /* override container alignment */
}
\`\`\`

## Common Patterns
- Center anything: \`display: flex; justify-content: center; align-items: center;\`
- Equal columns: \`flex: 1\` on each child
- Space between: \`justify-content: space-between\``,
    order_index: 1,
    estimated_minutes: 30,
    type: 'reading',
    created_at: '2024-01-01T00:00:00Z',
  },
  // ── Backend lessons ──
  {
    id: 'be-lesson-1',
    module_id: 'be-module-1',
    title: 'Node.js Runtime & Event Loop',
    content: `# Node.js Runtime & Event Loop

Node.js is a JavaScript runtime built on Chrome's V8 engine. Unlike browsers, Node.js runs on the server and has access to the filesystem, network, and OS.

## The Event Loop

Node.js is single-threaded but handles concurrency through its event loop:
\`\`\`
   ┌───────────────────────────┐
┌─>│           timers          │  ← setTimeout, setInterval
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       poll (I/O)          │  ← file reads, network
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           check           │  ← setImmediate
└──┤  close callbacks          │
   └───────────────────────────┘
\`\`\`

## CommonJS Modules
\`\`\`js
// math.js
module.exports = { add: (a, b) => a + b };

// app.js
const { add } = require('./math');
console.log(add(2, 3)); // 5
\`\`\`

## ES Modules (modern)
\`\`\`js
// math.mjs
export const add = (a, b) => a + b;

// app.mjs
import { add } from './math.mjs';
\`\`\`

## Key Built-in Modules
- \`fs\` — read/write files
- \`path\` — file path utilities
- \`http\` — create HTTP servers
- \`os\` — operating system info
- \`process\` — process info and env vars`,
    order_index: 1,
    estimated_minutes: 25,
    type: 'reading',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'be-lesson-2',
    module_id: 'be-module-2',
    title: 'Building REST APIs with Express',
    content: `# Building REST APIs with Express

Express.js is the most popular Node.js web framework. It provides routing, middleware, and a simple API for building web servers.

## Quick Start
\`\`\`js
const express = require('express');
const app = express();

app.use(express.json()); // parse JSON bodies

app.get('/users', (req, res) => {
  res.json({ users: [] });
});

app.post('/users', (req, res) => {
  const { name, email } = req.body;
  // create user...
  res.status(201).json({ id: 1, name, email });
});

app.listen(3000, () => console.log('Server running on port 3000'));
\`\`\`

## REST Conventions
- \`GET /resources\` — list all
- \`GET /resources/:id\` — get one
- \`POST /resources\` — create
- \`PUT /resources/:id\` — replace
- \`PATCH /resources/:id\` — partial update
- \`DELETE /resources/:id\` — delete

## Middleware Pattern
\`\`\`js
// Logger middleware
app.use((req, res, next) => {
  console.log(\`\${req.method} \${req.path}\`);
  next(); // pass to next handler
});

// Error handler (4 params = error middleware)
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});
\`\`\`

## Route Parameters
\`\`\`js
app.get('/users/:id', (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;
  res.json({ id, page, limit });
});
\`\`\``,
    order_index: 1,
    estimated_minutes: 30,
    type: 'reading',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'be-lesson-3',
    module_id: 'be-module-3',
    title: 'PostgreSQL & Prisma ORM',
    content: `# PostgreSQL & Prisma ORM

Prisma is a modern ORM for Node.js and TypeScript that provides type-safe database access.

## Setup
\`\`\`bash
npm install prisma @prisma/client
npx prisma init
\`\`\`

## Schema Definition
\`\`\`prisma
// prisma/schema.prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id        Int    @id @default(autoincrement())
  title     String
  content   String?
  author    User   @relation(fields: [authorId], references: [id])
  authorId  Int
}
\`\`\`

## CRUD Operations
\`\`\`js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create
const user = await prisma.user.create({
  data: { email: 'alex@example.com', name: 'Alex' }
});

// Read with relations
const userWithPosts = await prisma.user.findUnique({
  where: { id: 1 },
  include: { posts: true }
});

// Update
await prisma.user.update({
  where: { id: 1 },
  data: { name: 'Alex Chen' }
});

// Delete
await prisma.user.delete({ where: { id: 1 } });
\`\`\`

## Raw SQL when needed
\`\`\`js
const result = await prisma.$queryRaw\`
  SELECT * FROM users WHERE email LIKE \${query}
\`;
\`\`\``,
    order_index: 1,
    estimated_minutes: 35,
    type: 'reading',
    created_at: '2024-01-01T00:00:00Z',
  },
  // ── Mobile lessons ──
  {
    id: 'mob-lesson-1',
    module_id: 'mob-module-1',
    title: 'React Native Core Components',
    content: `# React Native Core Components

React Native renders to native UI components, not HTML. Every component maps to a real platform widget.

## Essential Components

### View — the <div> of React Native
\`\`\`jsx
import { View, StyleSheet } from 'react-native';

function Card() {
  return (
    <View style={styles.card}>
      {/* children */}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4, // Android shadow
  },
});
\`\`\`

### Text — all text must use this
\`\`\`jsx
<Text style={{ fontSize: 18, fontWeight: '700', color: '#111' }}>
  Hello World
</Text>
\`\`\`

### TouchableOpacity — tappable wrapper
\`\`\`jsx
<TouchableOpacity onPress={() => alert('Tapped!')} activeOpacity={0.8}>
  <Text>Tap me</Text>
</TouchableOpacity>
\`\`\`

### ScrollView vs FlatList
- \`ScrollView\` — renders all items at once, great for small lists
- \`FlatList\` — virtualized, only renders visible items, required for long lists

\`\`\`jsx
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <ItemCard item={item} />}
/>
\`\`\`

## Flexbox in React Native
Default flex direction is **column** (unlike CSS where it's row):
\`\`\`jsx
<View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
  <View style={{ flex: 1 }} />
  <View style={{ flex: 2 }} />
</View>
\`\`\``,
    order_index: 1,
    estimated_minutes: 30,
    type: 'reading',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'mob-lesson-2',
    module_id: 'mob-module-2',
    title: 'Expo Router & File-Based Navigation',
    content: `# Expo Router & File-Based Navigation

Expo Router brings file-system based routing to React Native, inspired by Next.js.

## File Structure → Routes
\`\`\`
app/
  _layout.tsx       → root layout (wraps all screens)
  index.tsx         → /
  (tabs)/
    _layout.tsx     → tab navigator
    home.tsx        → /home
    profile.tsx     → /profile
  user/
    [id].tsx        → /user/123 (dynamic)
  modal.tsx         → /modal
\`\`\`

## Root Layout
\`\`\`tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
\`\`\`

## Tab Navigator
\`\`\`tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Icon name="home" color={color} />,
        }}
      />
    </Tabs>
  );
}
\`\`\`

## Navigation
\`\`\`tsx
import { useRouter, useLocalSearchParams } from 'expo-router';

function MyScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Text>User: {id}</Text>
      <Button onPress={() => router.push('/profile')} />
      <Button onPress={() => router.back()} />
    </>
  );
}
\`\`\``,
    order_index: 1,
    estimated_minutes: 30,
    type: 'reading',
    created_at: '2024-01-01T00:00:00Z',
  },
  // ── Python lessons ──
  {
    id: 'py-lesson-1',
    module_id: 'py-module-1',
    title: 'Python Fundamentals',
    content: `# Python Fundamentals

Python is a high-level, interpreted language known for its clean syntax and readability. It runs everywhere and is used for web, data science, AI, and automation.

## Variables & Types
\`\`\`python
# No type declarations needed (dynamic typing)
name = "Alex"
age = 25
height = 1.8
is_developer = True

# Type hints (Python 3.5+, optional but recommended)
name: str = "Alex"
age: int = 25
\`\`\`

## Data Structures
\`\`\`python
# List — ordered, mutable
skills = ["Python", "JavaScript", "SQL"]
skills.append("React")
first = skills[0]        # "Python"
last = skills[-1]        # "React"
slice = skills[1:3]      # ["JavaScript", "SQL"]

# Dictionary — key-value pairs
user = {"name": "Alex", "age": 25, "active": True}
user["email"] = "alex@example.com"
name = user.get("name", "Unknown")  # safe access

# Set — unique values
unique_tags = {"python", "web", "python"}  # {"python", "web"}

# Tuple — immutable
coordinates = (48.8566, 2.3522)
lat, lng = coordinates   # unpacking
\`\`\`

## Control Flow
\`\`\`python
# Comprehensions (Pythonic loops)
squares = [x**2 for x in range(10)]
even_squares = [x**2 for x in range(10) if x % 2 == 0]

# Dictionary comprehension
word_lengths = {word: len(word) for word in ["hello", "world"]}
\`\`\`

## Functions
\`\`\`python
def greet(name: str, greeting: str = "Hello") -> str:
    return f"{greeting}, {name}!"

# Lambda (anonymous function)
double = lambda x: x * 2

# *args and **kwargs
def log(*args, **kwargs):
    print(args, kwargs)
\`\`\``,
    order_index: 1,
    estimated_minutes: 35,
    type: 'reading',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'py-lesson-2',
    module_id: 'py-module-2',
    title: 'Object-Oriented Python',
    content: `# Object-Oriented Python

Python is fully object-oriented. Everything is an object, including functions and classes.

## Classes & Instances
\`\`\`python
class Developer:
    # Class variable (shared by all instances)
    species = "Homo programmaticus"

    def __init__(self, name: str, language: str):
        # Instance variables
        self.name = name
        self.language = language
        self._xp = 0  # convention: "private"

    def code(self, hours: int) -> None:
        self._xp += hours * 10
        print(f"{self.name} coded for {hours}h (+{hours*10} XP)")

    @property
    def xp(self) -> int:
        return self._xp

    def __repr__(self) -> str:
        return f"Developer(name={self.name!r}, xp={self._xp})"

dev = Developer("Alex", "Python")
dev.code(2)
print(dev.xp)     # 20
print(dev)        # Developer(name='Alex', xp=20)
\`\`\`

## Inheritance
\`\`\`python
class SeniorDeveloper(Developer):
    def __init__(self, name, language, team_size):
        super().__init__(name, language)
        self.team_size = team_size

    def mentor(self) -> None:
        print(f"{self.name} mentors a team of {self.team_size}")

    def code(self, hours: int) -> None:
        super().code(hours)
        self._xp += 5  # Senior bonus
\`\`\`

## Dataclasses (modern Python)
\`\`\`python
from dataclasses import dataclass, field
from typing import List

@dataclass
class Project:
    title: str
    tech_stack: List[str] = field(default_factory=list)
    is_complete: bool = False

    def complete(self) -> None:
        self.is_complete = True

project = Project("Portfolio", ["React", "TypeScript"])
\`\`\``,
    order_index: 1,
    estimated_minutes: 35,
    type: 'reading',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'py-lesson-3',
    module_id: 'py-module-3',
    title: 'APIs & Web Scraping with Python',
    content: `# APIs & Web Scraping with Python

Python makes it easy to consume REST APIs and scrape web data.

## HTTP Requests with \`requests\`
\`\`\`python
import requests

# GET request
response = requests.get(
    "https://api.github.com/users/octocat",
    headers={"Accept": "application/json"}
)
response.raise_for_status()  # raises on 4xx/5xx
user = response.json()
print(user["name"])

# POST with JSON body
response = requests.post(
    "https://api.example.com/users",
    json={"name": "Alex", "email": "alex@example.com"},
    headers={"Authorization": "Bearer TOKEN"}
)
\`\`\`

## Building a Simple REST Client
\`\`\`python
from dataclasses import dataclass
from typing import Optional
import requests

@dataclass
class APIClient:
    base_url: str
    token: Optional[str] = None

    @property
    def headers(self):
        h = {"Content-Type": "application/json"}
        if self.token:
            h["Authorization"] = f"Bearer {self.token}"
        return h

    def get(self, path: str) -> dict:
        r = requests.get(f"{self.base_url}{path}", headers=self.headers)
        r.raise_for_status()
        return r.json()
\`\`\`

## Web Scraping with BeautifulSoup
\`\`\`python
from bs4 import BeautifulSoup
import requests

response = requests.get("https://news.ycombinator.com")
soup = BeautifulSoup(response.text, "html.parser")

# Find all story titles
stories = soup.select(".titleline > a")
for story in stories[:5]:
    print(story.text, "→", story["href"])
\`\`\`

## Async Requests (aiohttp)
\`\`\`python
import asyncio
import aiohttp

async def fetch(url: str) -> dict:
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            return await resp.json()

urls = ["https://api.example.com/1", "https://api.example.com/2"]
results = asyncio.run(asyncio.gather(*[fetch(u) for u in urls]))
\`\`\``,
    order_index: 1,
    estimated_minutes: 30,
    type: 'reading',
    created_at: '2024-01-01T00:00:00Z',
  },
];

// ─── Mock Tasks ───────────────────────────────────────────────────────────────

export const MOCK_TASKS: Task[] = [
  {
    id: 'task-1',
    user_id: MOCK_USER_ID,
    title: 'Build a personal portfolio page',
    description: 'Create a simple HTML/CSS portfolio showcasing your skills and projects.',
    module_id: 'module-1',
    module_title: 'HTML Fundamentals',
    status: 'in_progress',
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-14T00:00:00Z',
  },
  {
    id: 'task-2',
    user_id: MOCK_USER_ID,
    title: 'Complete HTML forms exercise',
    description: 'Build a registration form with validation using only HTML5 attributes.',
    module_id: 'module-1',
    module_title: 'HTML Fundamentals',
    status: 'done',
    due_date: '2024-01-12',
    created_at: '2024-01-08T00:00:00Z',
    updated_at: '2024-01-12T00:00:00Z',
  },
  {
    id: 'task-3',
    user_id: MOCK_USER_ID,
    title: 'Read CSS Flexbox documentation',
    description: 'Go through the MDN Flexbox guide and complete the examples.',
    module_id: 'module-2',
    module_title: 'CSS Mastery',
    status: 'todo',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    created_at: '2024-01-13T00:00:00Z',
    updated_at: '2024-01-13T00:00:00Z',
  },
  {
    id: 'task-4',
    user_id: MOCK_USER_ID,
    title: 'Set up React development environment',
    description: 'Install Node.js, create-react-app or Vite, and set up VS Code extensions.',
    module_id: 'module-4',
    module_title: 'React Fundamentals',
    status: 'todo',
    due_date: null,
    created_at: '2024-01-14T00:00:00Z',
    updated_at: '2024-01-14T00:00:00Z',
  },
];

// ─── Mock Projects ────────────────────────────────────────────────────────────

export const MOCK_SUGGESTED_PROJECTS: Record<LearningGoal, Project[]> = {
  frontend: [
    {
      id: 'proj-fe-1',
      user_id: MOCK_USER_ID,
      title: 'Portfolio Website',
      description: 'A personal portfolio site showcasing your projects, skills, and experience. Deploy it to Vercel.',
      goal: 'frontend',
      status: 'building',
      github_url: null,
      is_suggested: true,
      tech_stack: ['HTML', 'CSS', 'JavaScript'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
    },
    {
      id: 'proj-fe-2',
      user_id: MOCK_USER_ID,
      title: 'Weather App with API',
      description: 'Fetch real-time weather data from OpenWeatherMap API and display it with beautiful UI.',
      goal: 'frontend',
      status: 'idea',
      github_url: null,
      is_suggested: true,
      tech_stack: ['React', 'TypeScript', 'API'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'proj-fe-3',
      user_id: MOCK_USER_ID,
      title: 'Mini Jira Task Manager',
      description: 'A Kanban-style task board with drag-and-drop, columns, and local storage persistence.',
      goal: 'frontend',
      status: 'idea',
      github_url: null,
      is_suggested: true,
      tech_stack: ['React', 'TypeScript', 'CSS'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ],
  backend: [
    {
      id: 'proj-be-1',
      user_id: MOCK_USER_ID,
      title: 'REST API Backend',
      description: 'A full REST API with authentication, CRUD operations, and PostgreSQL database.',
      goal: 'backend',
      status: 'idea',
      github_url: null,
      is_suggested: true,
      tech_stack: ['Node.js', 'Express', 'PostgreSQL'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'proj-be-2',
      user_id: MOCK_USER_ID,
      title: 'Blog Platform API',
      description: 'Build a headless blog backend with posts, comments, tags, and JWT auth.',
      goal: 'backend',
      status: 'idea',
      github_url: null,
      is_suggested: true,
      tech_stack: ['Node.js', 'Prisma', 'PostgreSQL'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ],
  mobile: [
    {
      id: 'proj-mob-1',
      user_id: MOCK_USER_ID,
      title: 'Mobile Habit Tracker',
      description: 'Track daily habits with streaks, reminders, and progress visualization.',
      goal: 'mobile',
      status: 'idea',
      github_url: null,
      is_suggested: true,
      tech_stack: ['React Native', 'Expo', 'AsyncStorage'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'proj-mob-2',
      user_id: MOCK_USER_ID,
      title: 'AI Notes App',
      description: 'A notes app with AI-powered summarization and smart tagging.',
      goal: 'mobile',
      status: 'idea',
      github_url: null,
      is_suggested: true,
      tech_stack: ['React Native', 'Expo', 'OpenAI'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ],
  cybersecurity: [
    {
      id: 'proj-sec-1',
      user_id: MOCK_USER_ID,
      title: 'Password Strength Checker',
      description: 'A tool that analyzes password strength and suggests improvements.',
      goal: 'cybersecurity',
      status: 'idea',
      github_url: null,
      is_suggested: true,
      tech_stack: ['Python', 'Flask'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'proj-sec-2',
      user_id: MOCK_USER_ID,
      title: 'Network Scanner Tool',
      description: 'A Python tool for scanning networks, open ports, and identifying services.',
      goal: 'cybersecurity',
      status: 'idea',
      github_url: null,
      is_suggested: true,
      tech_stack: ['Python', 'Scapy', 'nmap'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ],
  data_analyst: [
    {
      id: 'proj-da-1',
      user_id: MOCK_USER_ID,
      title: 'COVID-19 Data Dashboard',
      description: 'Analyze and visualize COVID-19 trends using public datasets.',
      goal: 'data_analyst',
      status: 'idea',
      github_url: null,
      is_suggested: true,
      tech_stack: ['Python', 'pandas', 'Plotly'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'proj-da-2',
      user_id: MOCK_USER_ID,
      title: 'Sales Analysis Report',
      description: 'End-to-end data analysis project with cleaning, EDA, and insights.',
      goal: 'data_analyst',
      status: 'idea',
      github_url: null,
      is_suggested: true,
      tech_stack: ['Python', 'pandas', 'Matplotlib'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ],
  python: [
    {
      id: 'proj-py-1',
      user_id: MOCK_USER_ID,
      title: 'Web Scraper & Notifier',
      description: 'Scrape product prices and send email alerts when prices drop.',
      goal: 'python',
      status: 'idea',
      github_url: null,
      is_suggested: true,
      tech_stack: ['Python', 'BeautifulSoup', 'smtplib'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'proj-py-2',
      user_id: MOCK_USER_ID,
      title: 'FastAPI CRUD API',
      description: 'A production-ready FastAPI app with auth, database, and Docker.',
      goal: 'python',
      status: 'idea',
      github_url: null,
      is_suggested: true,
      tech_stack: ['Python', 'FastAPI', 'PostgreSQL'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ],
};

// ─── Mock Quiz Questions ──────────────────────────────────────────────────────

export const MOCK_QUIZ_QUESTIONS: Record<string, QuizQuestion[]> = {
  'module-1': [
    {
      id: 'q1-1',
      module_id: 'module-1',
      question: 'What does HTML stand for?',
      options: [
        'HyperText Markup Language',
        'High-Tech Modern Language',
        'HyperTransfer Markup Logic',
        'Home Tool Markup Language',
      ],
      correct_index: 0,
      explanation: 'HTML stands for HyperText Markup Language. It is the standard language for creating web pages.',
    },
    {
      id: 'q1-2',
      module_id: 'module-1',
      question: 'Which tag is used to create the largest heading in HTML?',
      options: ['<h6>', '<heading>', '<h1>', '<header>'],
      correct_index: 2,
      explanation: '<h1> creates the largest heading. Headings range from <h1> (largest) to <h6> (smallest).',
    },
    {
      id: 'q1-3',
      module_id: 'module-1',
      question: 'What is the correct HTML element for inserting a line break?',
      options: ['<break>', '<lb>', '<br>', '<newline>'],
      correct_index: 2,
      explanation: '<br> is a void element that creates a line break without needing a closing tag.',
    },
    {
      id: 'q1-4',
      module_id: 'module-1',
      question: 'Which attribute makes a form input required?',
      options: ['mandatory', 'required', 'validate', 'must-fill'],
      correct_index: 1,
      explanation: 'The `required` attribute prevents form submission if the input is empty.',
    },
    {
      id: 'q1-5',
      module_id: 'module-1',
      question: 'What is the purpose of the <alt> attribute on images?',
      options: [
        'Set image dimensions',
        'Provide alternative text for accessibility and SEO',
        'Link to another page',
        'Add a tooltip on hover',
      ],
      correct_index: 1,
      explanation: 'The alt attribute provides alternative text for screen readers and when images fail to load.',
    },
  ],
  'module-2': [
    {
      id: 'q2-1',
      module_id: 'module-2',
      question: 'Which CSS property makes a container a flexbox?',
      options: ['flex: true', 'layout: flex', 'display: flex', 'position: flex'],
      correct_index: 2,
      explanation: '`display: flex` turns an element into a flex container, enabling flexbox layout for its children.',
    },
    {
      id: 'q2-2',
      module_id: 'module-2',
      question: 'What does `justify-content: space-between` do in flexbox?',
      options: [
        'Adds space inside items',
        'Distributes items with equal space between them',
        'Centers all items',
        'Pushes items to the right',
      ],
      correct_index: 1,
      explanation: 'space-between distributes items evenly with the first at the start and last at the end.',
    },
    {
      id: 'q2-3',
      module_id: 'module-2',
      question: 'Which property controls spacing between grid columns and rows?',
      options: ['margin', 'padding', 'gap', 'spacing'],
      correct_index: 2,
      explanation: 'The `gap` property (shorthand for `row-gap` and `column-gap`) sets space between grid/flex items.',
    },
  ],
};
