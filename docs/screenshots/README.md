# Zrzuty ekranu

## Skąd pochodzą

Aplikacja jest natywna (Expo / React Native). Środowisko, w którym robiono
zrzuty, nie ma emulatora ani telefonu, więc zrzuty pochodzą z **wersji
webowej** tego samego kodu, zbudowanej jako statyczny eksport:

```bash
npx expo export --platform web
```

Strony renderowano w Chromium w widoku telefonu 390×844 (@2x), w **trybie
demo** (bez Supabase, dane z `src/lib/mockData.ts`). Wejście przez `/`,
czyli tak jak robi to aplikacja: guard przekierowuje użytkownika demo na
dashboard, a dalsze ekrany otwierano przez pasek zakładek.

To prawdziwy render aplikacji, nie makieta, ale nie zrzut z telefonu.
Na iOS i Androidzie czcionki, cienie i drobne odstępy mogą wyglądać nieco
inaczej.

| Plik | Ekran |
|---|---|
| `onboarding.png` | wybór celu nauki |
| `dashboard.png` | pulpit z XP, serią, bieżącym modułem i zadaniem na dziś |
| `roadmap.png` | oś modułów z postępem i filtrami |
| `quiz.png` | pytanie quizowe modułu |
| `mentor.png` | podpowiedzi silnika mentora (regułowego) |

## Czego tu nie ma i dlaczego

| Ekran | Powód |
|---|---|
| Lekcja | Bloki kodu w treści lekcji renderują się błędnie: parser w `app/lesson/[id].tsx` zamienia linię z ```` ``` ```` w pusty blok kodu, a same linie kodu idą jako zwykłe akapity. To błąd w logice JS, więc dotyczy też wersji natywnej. Zrzut dopiero po poprawce. |
| Projekty | W wersji webowej poziomy pasek filtrów (All / Ideas / Building) rozciąga się na kilkaset pikseli wysokości. Wygląda to na typowe zachowanie react-native-web dla poziomego `ScrollView` bez `flexGrow: 0`. Na urządzeniu natywnym tego nie sprawdzano. |
| Zadania, Profil | Nie zrobiono. |

## Zrzuty natywne

Tryb demo działa bez konfiguracji, więc zrzuty z telefonu da się zrobić od
razu po sklonowaniu:

```bash
npm install
npx expo start
```

Potem `i` (symulator iOS), `a` (emulator Androida) albo kod QR w aplikacji
Expo Go. Zrzut: na iOS Cmd+S w symulatorze, na Androidzie przycisk aparatu
w emulatorze.
