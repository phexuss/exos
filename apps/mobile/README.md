# EXOS Mobile — Integration Map

Где что менять при подключении бэкенда.

---

## Mock Data → API

Все моки в `mocks/data.ts`. Ниже — точные файлы и строки, где они используются.

### Home Screen — `app/(tabs)/index.tsx`

| Мок | Строка импорта | Описание |
|-----|---------------|----------|
| `MOCK_RECENTLY_PLAYED` | `import { MOCK_DAILY_MIX, MOCK_RECENTLY_PLAYED } from "@/mocks/data"` (строка 12) | Горизонтальные карточки "Recently Played" |
| `MOCK_DAILY_MIX` | там же | Вертикальный список треков "Daily Mix" |

Оба массива — `Track[]`. Заменить на fetch.

### Search Screen — `app/(tabs)/search.tsx`

| Мок | Строка импорта | Описание |
|-----|---------------|----------|
| `MOCK_TRENDING` | `import { MOCK_TRENDING } from "@/mocks/data"` (строка 14) | Все результаты поиска, фильтрация идёт на клиенте (строка 28–40) |

Заменить `MOCK_TRENDING` на серверный поиск. Фильтрация по `query` и `selectedSource` уже на клиенте — можно перенести на API.

### Library Screen — `app/(tabs)/library.tsx`

| Мок | Строка импорта | Описание |
|-----|---------------|----------|
| `MOCK_PLAYLISTS` | `import { MOCK_PLAYLISTS, MOCK_TRACKS } from "@/mocks/data"` (строка 11) | Список плейлистов |
| `MOCK_TRACKS` (liked) | там же, `const SAVED_TRACKS = MOCK_TRACKS.filter((t) => t.liked)` (строка 15) | Сохранённые треки |

---

## Playback — Mock Timer → Audio Engine

### Что удалить
- `hooks/useMockPlayback.ts` — фейковый таймер, тикает `progress` +1/duration каждую секунду

### Где подключён
- `app/player.tsx` строка 15: `import { useMockPlayback } from "@/hooks/useMockPlayback"`
- `app/player.tsx` строка 38: `const { startSeeking, stopSeeking } = useMockPlayback()`

### Что должен делать аудио-движок
- Писать в `usePlayerStore.getState().setProgress(pos / duration)` при обновлении позиции
- Вызывать `skipNext()` при окончании трека
- Читать `repeat` (`"off" | "all" | "one"`) для логики повтора

### SeekBar (`components/SeekBar.tsx`)
- `onSeek(ratio)` — 0..1, маппить в `audioEngine.seekTo(ratio * duration)`
- `onSeekStart()` — остановить пуш позиции из движка
- `onSeekEnd()` — возобновить

---

## Player Store — `store/usePlayerStore.ts`

Единый стейт плеера, к нему подключается UI и аудио-движок:

```
setProgress(0..1)      — обновить позицию
play(track)            — новый трек, progress=0, isPlaying=true
pause() / resume()     — пауза/возобновление
togglePlayback()       — toggle
skipNext()             — следующий трек (учитывает shuffle)
skipPrevious()         — предыдущий
setQueue(tracks)       — установить очередь
```

---

## Domain Types — `types/domain.ts`

```typescript
Track = {
  id, title, artist: { id, name },
  duration: "m:ss",     // parseDuration() в player.tsx конвертит в секунды
  coverUrl?: string,    // пока placeholder, подставить в player + MiniPlayer
  source: "youtube" | "deezer" | "soundcloud" | "spotify",
  lyrics?: string[],    // массив строк, "" = разрыв строфы
}
```

- `coverUrl` — заменить `<AppIcon name="music">` placeholder в `player.tsx` (строка 235) и `MiniPlayer.tsx`
- `lyrics` — сейчас хардкод в `mocks/data.ts` (трек "Substratum"), заменить на API fetch
- Новые источники → `constants/sources.ts`

---

## API Layer — `services/`

| Файл | Что |
|------|-----|
| `api/client.ts` | `mockRequest()` — заменить на реальный HTTP клиент |
| `api/endpoints.ts` | Карта эндпоинтов: `/auth`, `/search`, `/tracks`, `/playlists`, `/profile` |
| `api/search.ts` | `mockSearch()` — заменить на реальный запрос |
| `adapters/search.adapter.ts` | `mapApiTrackToTrack()` — маппинг DTO→Track, пока identity |

---

## Чеклист

- [ ] `mocks/data.ts` → заменить все `MOCK_*` на API fetchers в 3 экранах
- [ ] `services/api/client.ts` → реальный HTTP клиент вместо `mockRequest()`
- [ ] `hooks/useMockPlayback.ts` → удалить, подключить аудио-движок к store
- [ ] `coverUrl` → подставить `<Image>` в player и MiniPlayer
- [ ] `lyrics` → fetch с API вместо хардкода в моках
