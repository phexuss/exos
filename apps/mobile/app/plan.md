# Audio Stream Integration Plan

## Проблема
`expo-audio` не может играть `https://www.youtube.com/watch?v=...` — это HTML страница, а не аудио файл.
Нужна прямая ссылка на аудио поток (googlevideo.com/videoplayback?...).

## Решение
Две библиотеки решают разные задачи:
- `ytmusic-api` — поиск по названию → videoId (уже есть, не трогать)
- `@distube/ytdl-core` — videoId → прямая аудио ссылка (добавить)

---

## Backend

### Шаг 1 — Установить пакет
```bash
cd apps/api && pnpm add @distube/ytdl-core
```

### Шаг 2 — youtube.service.ts
Добавить метод `getStreamUrl` рядом с существующим `findVideoId`.
`findVideoId` НЕ ТРОГАТЬ.

```typescript
import ytdl from '@distube/ytdl-core'

async getStreamUrl(videoId: string): Promise {
  try {
    const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`)
    const format = ytdl.chooseFormat(info.formats, {
      quality: 'highestaudio',
      filter: 'audioonly',
    })
    return format.url ?? null
  } catch (e) {
    this.logger.warn(`getStreamUrl failed for ${videoId}: ${e}`)
    return null
  }
}
```

### Шаг 3 — tracks.service.ts
Добавить метод `getStreamUrl`:

```typescript
async getStreamUrl(id: string): Promise {
  const cacheKey = `stream:${id}`

  const cached = await this.cacheManager.get(cacheKey)
  if (cached) return { audioUrl: cached }

  // 1. получаем метаданные трека
  const track = await this.deezerService.getTrack(id)

  // 2. ищем videoId через ytmusic-api
  const videoId = await this.youtubeService.findVideoId(
    `${track.artist.name} - ${track.title}`
  )
  if (!videoId) return { audioUrl: null }

  // 3. извлекаем прямую аудио ссылку
  const audioUrl = await this.youtubeService.getStreamUrl(videoId)
  if (!audioUrl) return { audioUrl: null }

  // кэшируем на 1 час (ссылка живёт ~6 часов)
  await this.cacheManager.set(cacheKey, audioUrl, 3600)

  return { audioUrl }
}
```

### Шаг 4 — tracks.controller.ts
Добавить эндпоинт:

```typescript
@Get(':id/stream')
async getStreamUrl(@Param('id') id: string) {
  return this.tracksService.getStreamUrl(id)
}
```

### Шаг 5 — Проверить на бэке
GET /api/tracks/1109731/stream
Ответ должен быть:
```json
{
  "audioUrl": "https://rr1---sn-...googlevideo.com/videoplayback?..."
}
```
Если `audioUrl: null` — смотреть логи бэка, там будет warn от `getStreamUrl`.

---

## Frontend

### Шаг 6 — audioService.ts
Заменить вызов `/sources` на `/stream`:

```typescript
async playTrack(trackId: string): Promise<void> {
  const p = getPlayer()

  // запрос на новый эндпоинт
  const data = await apiGet<{ audioUrl: string | null }>(
    `${API_ENDPOINTS.tracks}/${trackId}/stream`
  )

  if (!data.audioUrl) {
    console.warn('[Audio] No audio URL for track:', trackId)
    return
  }

  console.log('[Audio] Playing:', data.audioUrl)

  // отдаём прямую ссылку в expo-audio
  p.replace({ uri: data.audioUrl })
  p.play()
}
```

### Шаг 7 — Проверить на фронте
В логах должно быть:
[API] http://192.168.0.104:3000/api/tracks/522434502/stream
[Audio] Playing: https://rr1---sn-...googlevideo.com/videoplayback?...

И трек должен заиграть.

---

## Итоговый флоу
Юзер тапает трек
→ GET /api/tracks/:id/stream
→ deezerService.getTrack(id)          — название и артист
→ youtubeService.findVideoId(query)   — ytmusic-api → videoId
→ youtubeService.getStreamUrl(videoId) — ytdl-core → прямая ссылка
→ { audioUrl: "https://googlevideo.com/..." }
→ expo-audio.replace({ uri: audioUrl })
→ 🎵 играет

## Важно
- `findVideoId` в `youtube.service.ts` НЕ ТРОГАТЬ — он работает
- `/api/tracks/:id/sources` НЕ ТРОГАТЬ — он нужен для других целей
- Кэш TTL = 3600 секунд (1 час), ссылки от YouTube живут ~6 часов
- Если `audioUrl` всё равно null — логи бэка покажут на каком шаге падает