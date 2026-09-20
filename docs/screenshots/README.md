# Zrzuty ekranu

Ten katalog jest pusty celowo.

Aplikacja jest natywna (Expo / React Native) — żeby zrobić zrzut, trzeba ją
uruchomić na emulatorze albo telefonie. Środowisko, w którym przygotowywano
to repozytorium, nie ma ani jednego, ani drugiego.

Wstawienie tu wizualizacji zamiast prawdziwego zrzutu byłoby gorsze niż brak
obrazka: czytelnik nie miałby jak odróżnić jednego od drugiego.

## Jak je zrobić

Aplikacja ma **tryb demo** — bez konfiguracji Supabase wchodzi na pełnym
zestawie danych przykładowych, więc zrzuty da się zrobić od razu po
sklonowaniu:

```bash
npm install
npx expo start
```

Potem `i` (symulator iOS), `a` (emulator Androida) albo zeskanuj kod QR
aplikacją Expo Go.

Zrzut: na iOS Cmd+S w symulatorze, na Androidzie przycisk aparatu
w emulatorze.

## Co warto pokazać

| Plik | Ekran |
|---|---|
| `onboarding.png` | wybór celu i poziomu |
| `dashboard.png` | pulpit z XP, serią i wykresem aktywności |
| `roadmap.png` | oś modułów z postępem |
| `lesson.png` | widok lekcji |
| `quiz.png` | pytanie quizowe |
| `mentor.png` | podpowiedzi silnika mentora |
| `projects.png` | lista projektów portfolio |

Potem podlinkuj je w sekcji „App Preview" w README.
