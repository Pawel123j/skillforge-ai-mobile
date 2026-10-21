# ⚡ SkillForge AI — Mobile Learning Roadmap Assistant

> An AI-powered mobile app that helps aspiring developers follow structured learning roadmaps, complete tasks, build portfolio projects, and track their progress — all with a built-in mentor engine.

---

## 📱 App Preview

SkillForge AI guides you from zero to job-ready developer through:
- **Structured roadmaps** for 6 developer career paths
- **Lesson-by-lesson learning** with progress tracking
- **Module quizzes** with XP rewards
- **Task management** to stay organized
- **Portfolio project suggestions** to impress recruiters
- **AI Mentor insights** based on your activity patterns

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| 🔐 **Authentication** | Register, login, persistent sessions via Supabase Auth |
| 🎯 **Onboarding** | Select goal, skill level, and daily time commitment |
| 🏠 **Dashboard** | Progress overview, streak, XP, current module, today's task |
| 🗺️ **Roadmap** | Module-based learning paths with progress tracking |
| 📖 **Lessons** | Detailed lesson content with completion tracking |
| 📝 **Quizzes** | Multiple-choice quizzes per module with scoring |
| ✅ **Tasks** | Full CRUD task manager with status and due dates |
| 🚀 **Projects** | Suggested + custom portfolio projects with GitHub links |
| 🧠 **AI Mentor** | Rule-based insight engine (OpenAI-ready architecture) |
| 👤 **Profile** | Edit name, change goal/time, toggle dark/light theme |

---

## 🎓 Learning Paths

| Path | Description | Modules |
|------|-------------|---------|
| 🎨 **Frontend Developer** | HTML, CSS, JavaScript, React, TypeScript | 8 |
| ⚙️ **Backend Developer** | Node.js, REST APIs, Databases, Auth, Cloud | 8 |
| 📱 **Mobile Developer** | React Native, Expo, Navigation, Publishing | 7 |
| 🔒 **Cybersecurity** | Networking, Linux, Ethical Hacking, OWASP | 9 |
| 📊 **Data Analyst** | Python, SQL, Visualization, Machine Learning | 7 |
| 🐍 **Python Developer** | Python, OOP, APIs, Django/FastAPI, Automation | 8 |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Expo 51 + React Native 0.74 |
| **Language** | TypeScript 5.3 |
| **Navigation** | Expo Router 3 (file-based) |
| **Backend / DB** | Supabase (Auth + PostgreSQL) |
| **State Management** | Zustand 4 |
| **Forms** | React Hook Form + Zod validation |
| **UI** | Custom component library (dark/light) |
| **Storage** | AsyncStorage (session persistence) |

---

## 📂 Project Structure

```
skillforge-ai-mobile/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout (auth, theme init)
│   ├── index.tsx                 # Route guard
│   ├── auth/
│   │   ├── login.tsx             # Login screen
│   │   └── register.tsx          # Register screen
│   ├── onboarding/
│   │   └── index.tsx             # 3-step onboarding flow
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab bar
│   │   ├── dashboard.tsx         # Dashboard
│   │   ├── roadmap.tsx           # Learning roadmap
│   │   ├── tasks.tsx             # Task manager
│   │   ├── projects.tsx          # Portfolio projects
│   │   ├── mentor.tsx            # AI Mentor screen
│   │   └── profile.tsx           # User profile
│   ├── module/[id].tsx           # Module detail + lessons
│   ├── lesson/[id].tsx           # Lesson reader
│   └── quiz/[moduleId].tsx       # Module quiz
├── src/
│   ├── components/
│   │   ├── common/               # Button, Input, Card, Badge, etc.
│   │   ├── cards/                # ModuleCard, TaskCard, ProjectCard, etc.
│   │   └── forms/                # TaskForm, ProjectForm
│   ├── constants/                # Colors, labels, XP values
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client (mock fallback)
│   │   └── mockData.ts           # Full mock dataset (demo mode)
│   ├── services/                 # Business logic layer
│   │   ├── authService.ts
│   │   ├── profileService.ts
│   │   ├── roadmapService.ts
│   │   ├── taskService.ts
│   │   ├── projectService.ts
│   │   ├── quizService.ts
│   │   ├── progressService.ts
│   │   └── mentorService.ts      # Rule-based AI engine
│   ├── stores/                   # Zustand global state
│   │   ├── authStore.ts
│   │   ├── taskStore.ts
│   │   ├── projectStore.ts
│   │   └── themeStore.ts
│   ├── types/                    # TypeScript interfaces
│   └── utils/                    # Formatting, color helpers
├── supabase/
│   ├── schema.sql                # Full database schema + RLS policies
│   └── seed.sql                  # Seed data for learning paths
├── .env.example                  # Environment variable template
├── app.json                      # Expo configuration
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone (for testing)

### 1. Clone and Install

```bash
git clone https://github.com/pawel123j/skillforge-ai-mobile.git
cd skillforge-ai-mobile
npm install
```

### 2. Environment Variables (Optional)

The app runs in **Demo Mode** if no Supabase credentials are provided.

```bash
cp .env.example .env
```

Edit `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run the App

```bash
npx expo start
```

- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Scan QR code with Expo Go for physical device

---

## 🗄️ Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **Anon Key** from Settings → API

### 2. Run the Schema

```bash
# In Supabase SQL Editor, paste and run:
supabase/schema.sql
```

### 3. Run Seed Data

```bash
# In Supabase SQL Editor, paste and run:
supabase/seed.sql
```

### 4. Configure Environment

Add your Supabase URL and Anon Key to `.env`

### Database Schema

```sql
profiles         -- User profiles, goals, preferences
learning_paths   -- 6 career paths
modules          -- Learning modules per path
lessons          -- Lessons per module
tasks            -- User tasks (CRUD)
projects         -- Portfolio projects
quiz_questions   -- Multiple choice questions per module
quiz_results     -- User quiz scores
user_progress    -- XP, streak, completed lessons/modules
```

### Security (RLS)

- ✅ Users can only read/write their own `profiles`, `tasks`, `projects`, `quiz_results`, `user_progress`
- ✅ `learning_paths`, `modules`, `lessons`, `quiz_questions` are readable by all authenticated users
- ✅ Service role key is never exposed in the frontend
- ✅ Automatic profile + progress creation on signup via database trigger

---

## 🌐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL | No (uses mock mode) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key | No (uses mock mode) |

> ⚠️ **Never commit `.env` files.** The `.gitignore` already excludes them.

---

## 🎨 Demo Mode

If Supabase credentials are not configured, the app automatically runs in **Demo Mode**:
- Uses a full mock dataset with realistic data
- All features work — roadmap, tasks, projects, mentor, quiz
- No network calls are made
- Perfect for running and evaluating locally

---

## 🧠 AI Mentor Engine

The mentor screen uses a **rule-based engine** that analyzes:
- Days since last activity → inactivity warnings
- Streak days → streak milestone celebrations
- Completed lessons vs. projects → actionable suggestions
- Pending task count → focus reminders
- XP milestones → achievement messages

The service layer is designed to be **drop-in replaced** with OpenAI API:

```typescript
// src/services/mentorService.ts
// Replace generateMentorInsight() with an OpenAI chat completion call
// The function signature and return types stay the same
```

---

## 📊 XP System

| Action | XP Reward |
|--------|-----------|
| Complete a lesson | +50 XP |
| Complete a task | +25 XP |
| Complete a project | +200 XP |
| Pass a quiz | +100 XP |
| Streak day bonus | +10 XP |

Levels: Newcomer → Apprentice → Learner → Developer → Practitioner → Engineer → Senior Dev → Expert

---

## 🚢 Deployment / GitHub Setup

### Automatic (GitHub CLI)

```bash
git init
git add .
git commit -m "Initial commit: SkillForge AI mobile app"
gh repo create skillforge-ai-mobile --public --source=. --remote=origin --push
```

### Manual

1. Create a new public repository at [github.com/new](https://github.com/new) named `skillforge-ai-mobile`
2. Copy the repository URL
3. Run:

```bash
git init
git add .
git commit -m "Initial commit: SkillForge AI mobile app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/skillforge-ai-mobile.git
git push -u origin main
```

---

## 📱 Building for Production

### Install EAS CLI

```bash
npm install -g eas-cli
eas login
eas build:configure
```

### Build for iOS / Android

```bash
eas build --platform ios
eas build --platform android
```

### Submit to App Store / Play Store

```bash
eas submit --platform ios
eas submit --platform android
```

---

## 🔮 Future Improvements

- [ ] **OpenAI GPT-4 Mentor** — Replace rule engine with conversational AI
- [ ] **Push Notifications** — Daily learning reminders and streak alerts
- [ ] **Social Features** — Follow other learners, compare streaks
- [ ] **Video Lessons** — Embedded video player with timestamps
- [ ] **Code Sandbox** — In-app code editor with live preview
- [ ] **Certificates** — Shareable completion certificates per path
- [ ] **Community** — Q&A forum and study groups
- [ ] **Analytics Dashboard** — Weekly/monthly learning reports
- [ ] **Offline Mode** — Cache lessons for offline reading
- [ ] **Apple/Google Login** — OAuth social login

---

## 🏆 Portfolio Description

**SkillForge AI** is a mobile demo with an optional Supabase backend, demonstrating:

- **Full-stack mobile architecture** — Expo + React Native + TypeScript + Supabase
- **Authentication flows** — Registration, login, session persistence, route guards
- **Complex state management** — Multiple Zustand stores with async actions
- **Form validation** — React Hook Form + Zod schemas
- **Clean service layer** — Separation of concerns between UI and business logic
- **Database design** — Relational schema with RLS security policies
- **Mock/real data strategy** — Demo mode when Supabase configuration is absent; configured backend failures are not silently replaced with mock data
- **Rule-based AI system** — Extensible mentor engine with OpenAI-ready architecture
- **Dark/light theming** — System-level theme with persistent user preference
- **Mobile UX patterns** — Pull-to-refresh, modals, tab navigation, loading states

This project is ready to present in technical interviews and demonstrates real-world patterns used in production mobile applications.

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

Built with ⚡ by [SkillForge AI](https://github.com/pawel123j/skillforge-ai-mobile)

## Verified development checks

Use Node 22 and `npm ci`, then run:

```bash
npm run lint -- --max-warnings 0
npm run type-check
npm test
CI=1 EXPO_OFFLINE=1 npx expo export --platform web
```

ESLint 8 uses the Expo configuration in `.eslintrc.cjs`. CI runs all four
checks. The Jest/Expo screen regressions exercise missing lessons, empty and
failed quizzes, progress changes without remounting, backend module metadata,
and failed onboarding. They use controlled service responses, not a live
Supabase deployment. Browser validation also exercised task creation/editing
and the missing-lesson screen at a mobile viewport.

Without Supabase settings, task/project/progress data is a session-only demo
and resets on reload. Theme preferences are persisted. Supabase authentication,
RLS, offline behavior and Android/iOS release builds still require validation
against a configured backend and devices. These checks do not establish
production readiness. The mentor uses rules, not a deployed language model.


### Testy przeglądarkowe

Po zainstalowaniu zależności aplikacji i zbudowaniu frontendu zgodnie z README / workflow `browser.yml` (lub jobem browser w `ci.yml`):

```bash
python -m venv .venv-e2e
# Aktywuj ten venv przed dalszymi poleceniami.
python -m pip install -r e2e/requirements.txt
python -m playwright install chromium
python -m pytest -q e2e
```

Na Linux może być potrzebne `python -m playwright install --with-deps chromium` z uprawnieniami administratora. Alternatywnie `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` wskazuje istniejący Chromium. Testy uruchamiają i zatrzymują własny serwer, używają nowego kontekstu przeglądarki i zapisują logi w ignorowanym `e2e/artifacts/`. Pełny backend musi mieć zainstalowane swoje zależności; `E2E_API_PYTHON` jest opcjonalnym wyborem jego interpretera w AutoDesk/BankGuard. Testy nie uruchamiają wdrożenia.


## Zależności i ograniczenia bezpieczeństwa (2026-10-17)

Po aktualizacji zależności wymuszono jedną wersję React Native/React przez `overrides` zgodne z wersjami głównymi aplikacji, a renderer testów przypięto do React 18.2.0. Zapobiega to zainstalowaniu RN 0.88 jako zagnieżdżonego peer dependency w projekcie RN 0.74.5. Czyste `npm ci`, lint bez ostrzeżeń, typy, 7 regresji ekranów, eksport i browser E2E zostały sprawdzone po tej zmianie.

## Walidacja etapu 2 — 2026-10-18

`tar` jest przypięty do 7.5.22. Wersjonowana poprawka `patches/@expo+cli+0.18.31.patch` dostosowuje oba importy CLI do API tar 7; samo podbicie wersji łamało ekstrakcję. `npm ci` stosuje patch automatycznie. `npm run test:toolchain` sprawdza 4 przypadki: ekstrakcję szablonu, fallback bez systemowego tar, gałąź win32 i odrzucenie wyjścia poza katalog. Gałąź win32 jest symulowana, nie jest testem systemu Windows.

Rejestracja respektuje profil tworzony przez trigger, nie wykonuje powtórnego INSERT i pokazuje stan wymagający potwierdzenia e-mail, jeśli Supabase nie zwróci sesji. Błędy odczytu profilu/progresu nie uruchamiają inicjalizacji danych. Trigger ma pusty `search_path`; istniejące bazy aktualizuje `supabase/migrations/20261018_function_search_path.sql`. Seed quizu jest powtarzalny bez tworzenia nowych duplikatów; nie usuwa starych danych.

Testy RLS: zainstaluj `supabase/tests/requirements.txt`, ustaw SKILLFORGE_TEST_ADMIN_URL na **izolowany** PostgreSQL z CREATEDB, uruchom `python -m pytest -q supabase/tests`. Powstaje własna baza UUID. 25 testów sprawdza faktyczne polityki PostgreSQL dla dwóch użytkowników i anonima, cudze odczyty/zapisy, triggery i seed. Lokalny kontrakt auth.uid() nie zastępuje walidacji hostowanego Supabase Auth/PostgREST.

Czyste npm ci, lint/typy, 14 Jest, 4 toolchain, 25 RLS, eksport web i 1 E2E PASS. Krytyczny tar usunięty; audyt nadal wykazuje 70 high, 29 moderate i 1 low w starym SDK (0 critical). Android/iOS i pełna integracja hostowana pozostają niezweryfikowane. Projekt pozostaje PARTIAL.

### Etap 3 — migracja SDK (2026-10-19)

Aplikacja używa Expo 58.0.14 / React Native 0.88.0 / React 19.3.0 zgodnie z
oficjalną macierzą SDK. `npm ci`, lint, typy, 16 testów aplikacji, eksport web
oraz bundlowanie JS/Hermes dla Android/iOS przeszły lokalnie. Te ostatnie nie
są buildami APK/IPA ani testami urządzeń. Testy zmiany lekcji/modułu chronią
przed pozostawieniem poprzedniego stanu po nawigacji.

[SECURITY_PATCH.md](SECURITY_PATCH.md) opisuje trzy ograniczone poprawki i bramkę
`npm run security:check`. Bieżący surowy audit: **58 high, 18 moderate, 0 critical**;
wszystkie bezpośrednie advisories dotyczą wskazanych lokalnych poprawek. Nie jest
to audit zerowy. Dawna poprawka importów SDK 51 została usunięta po czterech
regresjach ekstraktora SDK 58. Pozostały patch-package stosuje nowe poprawki.

[Supabase integration](supabase/tests/README.md) opisuje rzeczywisty lokalny
Auth/PostgREST oraz RLS. Bieżące E2E web wymagają poprawnie działającego sandboxa
Chromium; uruchomienie w tej chmurze zostało zablokowane przed startem aplikacji
przez niewłaściwego właściciela pomocnika SUID. Sandbox pozostaje włączony.
Android/iOS release i urządzenia nadal pozostają do walidacji. Status: PARTIAL.
