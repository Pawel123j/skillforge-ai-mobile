/**
 * Testy silnika mentora.
 *
 * `generateMentorInsight` to drabinka warunków: pierwszy pasujący wygrywa
 * i przesłania wszystkie następne. Kolejność tych warunków JEST decyzją
 * produktową — ostrzeżenie o bezczynności ma pierwszeństwo przed gratulacjami
 * za serię, bo użytkownik, który nie wchodził od tygodnia, nie potrzebuje
 * pochwały. Testy pilnują właśnie tej kolejności, bo w kodzie nie widać jej
 * inaczej niż przez układ `if`-ów.
 */
import {
  generateAllInsights,
  generateMentorInsight,
} from '@/services/mentorService';
import type { Profile, Project, Task, UserProgress } from '@/types';

// ── dane pomocnicze ──────────────────────────────────────────────────────

const profile: Profile = {
  id: 'p1',
  user_id: 'u1',
  full_name: 'Test User',
  learning_goal: null,
  skill_level: null,
  daily_time_minutes: null,
  avatar_url: null,
  onboarding_completed: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

/** Data sprzed `days` dni, w formacie, jakiego używa baza. */
function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

function progressOf(over: Partial<UserProgress> = {}): UserProgress {
  return {
    id: 'pr1',
    user_id: 'u1',
    completed_lessons: [],
    completed_modules: [],
    xp: 0,
    streak_days: 0,
    last_activity_date: daysAgo(0),
    updated_at: daysAgo(0),
    ...over,
  };
}

function task(status: Task['status'], id = 't'): Task {
  return { id, status } as Task;
}

function project(status: Project['status'], title = 'Projekt'): Project {
  return { id: 'pj-' + title, title, status } as Project;
}

const lessons = (n: number) => Array.from({ length: n }, (_, i) => `lesson-${i}`);

// ── drabinka priorytetów ─────────────────────────────────────────────────

describe('generateMentorInsight — kolejność reguł', () => {
  it('seria co siedem dni wygrywa ze wszystkim innym', () => {
    const insight = generateMentorInsight(
      profile,
      progressOf({ streak_days: 14, xp: 550, completed_lessons: lessons(8) }),
      [task('todo', 'a'), task('todo', 'b'), task('todo', 'c'), task('todo', 'd'), task('todo', 'e')],
      [project('building')],
    );

    expect(insight.id).toBe('mentor-streak');
    expect(insight.type).toBe('achievement');
    expect(insight.message).toContain('14');
  });

  it('ostrzeżenie o bezczynności wygrywa z zachętami', () => {
    // Użytkownik nieobecny od tygodnia nie potrzebuje pochwały za postępy.
    const insight = generateMentorInsight(
      profile,
      progressOf({ streak_days: 2, xp: 550, last_activity_date: daysAgo(7) }),
      [],
      [],
    );

    expect(insight.id).toBe('mentor-inactive');
    expect(insight.type).toBe('warning');
    expect(insight.message).toContain('7');
  });

  it('brak jakiejkolwiek aktywności traktowany jest jak długa nieobecność', () => {
    const insight = generateMentorInsight(
      profile,
      progressOf({ last_activity_date: null }),
      [],
      [],
    );

    expect(insight.id).toBe('mentor-inactive');
  });

  it('po trzech lekcjach bez projektu podpowiada rozpoczęcie projektu', () => {
    const insight = generateMentorInsight(
      profile,
      progressOf({ completed_lessons: lessons(3), streak_days: 1 }),
      [],
      [project('idea')],   // sam pomysł to jeszcze nie rozpoczęty projekt
    );

    expect(insight.id).toBe('mentor-project');
    expect(insight.action_route).toBe('/(tabs)/projects');
  });

  it('pięć zaległych zadań daje przypomnienie o zadaniach', () => {
    const insight = generateMentorInsight(
      profile,
      progressOf({ streak_days: 1, completed_lessons: lessons(1) }),
      [task('todo', 'a'), task('todo', 'b'), task('in_progress', 'c'), task('todo', 'd'), task('todo', 'e')],
      [],
    );

    expect(insight.id).toBe('mentor-tasks');
    expect(insight.message).toContain('5');
  });

  it('zadania ukończone nie liczą się jako zaległe', () => {
    const insight = generateMentorInsight(
      profile,
      progressOf({ streak_days: 1, completed_lessons: lessons(1) }),
      [task('done', 'a'), task('done', 'b'), task('done', 'c'), task('done', 'd'), task('done', 'e')],
      [],
    );

    expect(insight.id).not.toBe('mentor-tasks');
  });

  it('kamień milowy 500 XP działa tylko w swoim przedziale', () => {
    const inRange = generateMentorInsight(
      profile, progressOf({ xp: 550, streak_days: 1, completed_lessons: lessons(1) }), [], []);
    expect(inRange.id).toBe('mentor-xp');

    // Powyżej 600 XP komunikat o 500 byłby już nieaktualny.
    const above = generateMentorInsight(
      profile, progressOf({ xp: 900, streak_days: 1, completed_lessons: lessons(1) }), [], []);
    expect(above.id).not.toBe('mentor-xp');
  });

  it('projekt w budowie zachęca do dokończenia i podaje jego nazwę', () => {
    const insight = generateMentorInsight(
      profile,
      progressOf({ streak_days: 1, completed_lessons: lessons(1) }),
      [],
      [project('building', 'Kalkulator kalorii')],
    );

    expect(insight.id).toBe('mentor-finish');
    expect(insight.message).toContain('Kalkulator kalorii');
  });
});

// ── zachowanie domyślne ──────────────────────────────────────────────────

describe('generateMentorInsight — brak dopasowania', () => {
  it('zawsze zwraca kompletną podpowiedź, nawet dla pustego konta', () => {
    const insight = generateMentorInsight(profile, progressOf(), [], []);

    expect(insight.id).toBeTruthy();
    expect(insight.title.trim()).not.toBe('');
    expect(insight.message.trim()).not.toBe('');
    expect(insight.icon.trim()).not.toBe('');
    expect(['encouragement', 'warning', 'tip', 'achievement']).toContain(insight.type);
  });

  it('nie wychodzi poza listę zachęt przy dowolnej długości serii', () => {
    // Indeks liczony jest modulo długość listy — gdyby lista się skurczyła,
    // a modulo zostało, użytkownik dostałby `undefined` zamiast tekstu.
    for (let streak = 0; streak < 20; streak++) {
      const insight = generateMentorInsight(
        profile,
        progressOf({ streak_days: streak === 0 ? 0 : streak, completed_lessons: lessons(1) }),
        [],
        [],
      );
      expect(insight).toBeDefined();
      expect(insight.message.trim()).not.toBe('');
    }
  });
});

// ── lista wszystkich podpowiedzi ─────────────────────────────────────────

describe('generateAllInsights', () => {
  it('dla pustego konta zwraca przynajmniej ogólną poradę', () => {
    const all = generateAllInsights(profile, progressOf(), [], []);

    expect(all.length).toBeGreaterThan(0);
    expect(all[all.length - 1].id).toBe('insight-tip');
  });

  it('zbiera wszystkie pasujące podpowiedzi naraz, a nie tylko pierwszą', () => {
    // To jest różnica względem generateMentorInsight: tam wygrywa jedna
    // reguła, tu mają wyjść wszystkie, które pasują.
    const all = generateAllInsights(
      profile,
      progressOf({
        streak_days: 5,
        xp: 300,
        completed_lessons: lessons(4),
        last_activity_date: daysAgo(5),
      }),
      [],
      [],
    );

    const ids = all.map((i) => i.id);
    expect(ids).toEqual(expect.arrayContaining([
      'insight-inactive', 'insight-streak', 'insight-no-projects', 'insight-xp', 'insight-tip',
    ]));
  });

  it('projekt o statusie innym niż pomysł zdejmuje podpowiedź o braku projektów', () => {
    const all = generateAllInsights(
      profile,
      progressOf({ completed_lessons: lessons(5) }),
      [],
      [project('building')],
    );

    expect(all.map((i) => i.id)).not.toContain('insight-no-projects');
  });

  it('każda zwrócona podpowiedź ma komplet pól wymaganych przez widok', () => {
    const all = generateAllInsights(
      profile,
      progressOf({ streak_days: 10, xp: 999, completed_lessons: lessons(6), last_activity_date: daysAgo(9) }),
      [],
      [],
    );

    for (const insight of all) {
      expect(insight.id).toBeTruthy();
      expect(insight.title.trim()).not.toBe('');
      expect(insight.message.trim()).not.toBe('');
      expect(insight.icon.trim()).not.toBe('');
    }
  });

  it('identyfikatory podpowiedzi nie powtarzają się', () => {
    // Powtórzony identyfikator rozwaliłby listę renderowaną po `key`.
    const all = generateAllInsights(
      profile,
      progressOf({ streak_days: 10, xp: 999, completed_lessons: lessons(6), last_activity_date: daysAgo(9) }),
      [],
      [],
    );

    expect(new Set(all.map((i) => i.id)).size).toBe(all.length);
  });
});
