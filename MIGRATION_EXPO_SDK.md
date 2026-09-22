# Plan migracji Expo SDK

Ten dokument to **plan**, nie wykonana migracja. Aplikacja jest dziś na
**Expo SDK 51** (`expo ~51.0.28`, React Native `0.74.5`, React `18.2.0`).
Migracja nie została przeprowadzona automatycznie, bo przeskok przez kilka
wersji SDK zmienia architekturę renderowania i główne zależności — wymaga
uruchomienia aplikacji na urządzeniu/emulatorze po każdym kroku, czego nie da
się zrobić w tym środowisku.

## Zasada: jeden SDK na raz

Expo wspiera migrację **o jedną wersję SDK naraz** (51 → 52 → 53 → …). Przeskok
kilku wersji jednym poleceniem prawie zawsze kończy się nieczytelnym błędem
Metro albo natywnym crashem, którego nie da się przypisać do konkretnej zmiany.
Dla każdego kroku:

```bash
# 1. Podbij samo expo do docelowego SDK, resztę zależności dociągnij --fix:
npx expo install expo@^<NN> --fix
# 2. Sprawdź spójność wersji i konfiguracji:
npx expo-doctor
# 3. Uruchom na obu platformach i przeklikaj krytyczne ścieżki:
npx expo start --clear         # potem 'a' (Android) i 'i' (iOS)
```

> **Numery wersji sprawdź na bieżąco** na
> <https://docs.expo.dev/versions/latest/> i w przewodniku „Upgrade the SDK"
> — nie wpisuję tu docelowego numeru na sztywno, żeby plan nie zestarzał się
> wraz z kolejnym wydaniem. Kolejność kroków i lista wpływu poniżej pozostają
> aktualne niezależnie od numeru.

## Wpływ na TĘ aplikację, krok po kroku

Poniżej tylko zmiany dotykające zależności obecnych w `package.json`.

### SDK 52 — Nowa Architektura staje się domyślna

- **New Architecture (Fabric/TurboModules) domyślnie włączona.** To największy
  pojedynczy skok. Wszystkie natywne biblioteki muszą ją wspierać. W tym
  projekcie natywne pakiety to `react-native-screens`,
  `react-native-safe-area-context`, `@react-native-community/netinfo`,
  `@react-native-async-storage/async-storage`, `expo-secure-store` — wszystkie
  są zarządzane przez Expo, więc `expo install --fix` dobierze wersje zgodne
  z Nową Architekturą. **Punkt do weryfikacji ręcznej:** przewijanie list,
  gesty i bezpieczne obszary (safe area) — tu New Arch najczęściej ujawnia
  regresje.
- Jeśli coś nie działa, Nową Architekturę można tymczasowo wyłączić
  (`"newArchEnabled": false` w `app.json`) i migrować ją osobno — ale to
  rozwiązanie przejściowe, nie docelowe.

### expo-router 3 → 4 → 5

- Aplikacja używa `expo-router ~3.5` z `experiments.typedRoutes` i katalogiem
  `app/`. Router przechodzi przez v4 (SDK 52) i v5 (SDK 53) z niebanalnymi
  zmianami API nawigacji. **Po każdym kroku** przejdź przewodnik migracji
  routera i sprawdź: deep-linki (`scheme: "skillforge"`), typowane trasy oraz
  ekrany logowania/rejestracji (tu żyje `expo-secure-store`).

### SDK 53 — React 18 → 19

- React `18.2.0` → `19.x`. Do sprawdzenia pod kątem Reacta 19:
  `react-hook-form` (+ `@hookform/resolvers`), `zustand`, `@supabase/supabase-js`
  — wszystkie mają wydania zgodne z React 19, ale wymagają podbicia.
- `@types/react` musi iść w parze z wersją Reacta (`~19.x`).

### Porządki w devDependencies (zrób przy okazji)

- **`@types/react-native` do usunięcia.** Typy są dostarczane razem z
  `react-native` od 0.71; osobny pakiet typów jest przestarzały i potrafi
  powodować konflikty typów. Usuń z `devDependencies`.
- `eslint-config-expo` i `eslint` podbij zgodnie z tym, czego wymaga docelowy
  SDK (nowsze SDK idą w stronę ESLint 9 / flat config — sprawdź, czy `.eslintrc`
  nie wymaga migracji do `eslint.config.js`).

## Kryteria ukończenia każdego kroku

Krok uznaj za zamknięty dopiero, gdy **wszystkie** przechodzą:

- `npx expo-doctor` bez ostrzeżeń,
- `npm run type-check` (tsc --noEmit) czysto,
- `npm run lint` czysto,
- aplikacja startuje i działa na Androidzie **oraz** iOS (nie tylko web),
- krytyczne ścieżki przeklikane: logowanie (Supabase + secure-store),
  nawigacja między trasami, tryb ciemny/jasny (`userInterfaceStyle`).

## Czego ten plan NIE robi

- Nie zmienia ani jednej wersji w `package.json` — to świadome. Migracja bez
  możliwości uruchomienia aplikacji na urządzeniu byłaby zgadywaniem.
- Nie zakłada, że `expo install --fix` załatwia New Architecture za darmo —
  dobiera zgodne wersje, ale regresje w renderowaniu wykrywa dopiero człowiek
  na ekranie.

## Status

**REQUIRES HUMAN ACTION + DEVICE.** Plan gotowy do wykonania; sama migracja
wymaga maszyny deweloperskiej z emulatorami Androida i iOS.
