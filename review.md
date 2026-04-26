Code Review: EXØS Mobile App
Сводка
Кодовая база в целом здоровая: zustand используется по уму, есть неплохие паттерны (withDb retry на NullPointerException, setUnauthorizedHandler, single-flight refresh). Async cleanup есть везде где нужны.

Критические проблемы найдены в трёх местах:

🔴 audioService.ts — listener без cleanup + permanent setInterval
🔴 Списки треков без виртуализации в library.tsx, PlaylistScreen.tsx
🟡 usePlayerStore() без селекторов во всех табах — ререндеры на 4Hz из-за прогресса плеера
Дальше — детально по приоритетам.

🔴 Blockers
🔴 Audio listener leak + бесконечный setInterval
Файл: @/home/phexuss/Desktop/exos/apps/mobile/services/audio/audioService.ts:32-44, 51-58, 122-126

audioService.ts:32-44
player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
  if (status.didJustFinish) {
    const s = store();
    const { repeat } = s.getState();
    if (repeat === 'one') {
      player?.seekTo(0);
      player?.play();
      s.setState({ progress: 0 });
    } else {
      s.getState().skipNext();
    }
  }
});
Проблемы:

Listener не сохраняется — в releaseAudio() нет способа его отписать. При Fast Refresh в DEV на каждом hot-reload getPlayer() вызывается заново и накапливает дубликаты listener'ов → skipNext срабатывает по N раз на конец трека.
positionInterval крутится постоянно после первого playUrl/playLocalFile. Не останавливается на pause, не останавливается на закрытие плеера — каждые 250мс читает player.duration/currentTime и пишет в стор → даже на паузе апдейтит state (хотя и тем же значением, но set всё равно ререндерит подписчиков на progress).
releaseAudio() определён, но никогда не вызывается — нигде в проекте нет вызова. На logout / shutdown handle не освобождается.
Почему важно: В DEV при активном dev-loop — мерцания, дубль-skip-next, перерисовка MiniPlayer каждые 250мс даже на паузе.

Suggestion:

ts
let statusSub: { remove(): void } | null = null;
 
function getPlayer(): AudioPlayer {
  if (!player) {
    setAudioModeAsync({ /* ... */ });
    player = createAudioPlayer();
    statusSub = player.addListener('playbackStatusUpdate', (status) => { /* ... */ });
  }
  return player;
}
 
function startPositionTracking() {
  stopPositionTracking();
  positionInterval = setInterval(() => {
    if (isSeeking || !player) return;
    // Skip when paused — store has isPlaying flag
    if (!store().getState().isPlaying) return;
    /* ... */
  }, 250);
}
 
export function pauseAudio(): void {
  player?.pause();
  stopPositionTracking();
}
 
export function resumeAudio(): void {
  player?.play();
  startPositionTracking();
}
 
export function releaseAudio(): void {
  stopPositionTracking();
  statusSub?.remove();
  statusSub = null;
  player?.remove();
  player = null;
}
И добавить вызов в useAuthStore.logout или в RootLayout cleanup.

🔴 Списки треков без виртуализации
Файлы:

library.tsx:193-202
PlaylistScreen.tsx:200-211
library.tsx:186-204
) : (
  <View
    style={{
      borderTopWidth: 0.5,
      borderTopColor: COLORS.border,
    }}
  >
    {tracks.map((track) => (
      <TrackItem
        key={track.id}
        track={track}
        onPress={handlePlay}
        onLongPress={setSelectedTrack}
        isActive={currentTrack?.id === track.id}
        accentColor={accentColor}
      />
    ))}
  </View>
)}
Проблема: При 500+ скачанных треков рендерятся все одновременно. Каждый TrackItem — это Image + AnimatedPressable + два AppText. Это:

~30+ MB памяти на изображения, которые юзер не видит (Image декодирует растровое изображение даже когда вне viewport)
Прокрутка лагает — frame budget съеден layout'ом
accentColor меняется на смену трека → пересоздаётся style-объект для всех 500 → форс-репэйнт
Suggestion: Использовать FlatList (или лучше FlashList от Shopify):

ts
<FlatList
  data={tracks}
  keyExtractor={(t) => t.id}
  renderItem={renderTrack}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews
  // High items: getItemLayout for stable height
  getItemLayout={(_, idx) => ({ length: 80, offset: 80 * idx, index: idx })}
/>
Альтернатива: FlashList из @shopify/flash-list — обычно в 2-3x быстрее на больших списках.

🔴 usePlayerStore() без селектора в табах
Файлы:

index.tsx:94
library.tsx:25
search.tsx:35
PlaylistScreen.tsx:31
MiniPlayer.tsx:12-13
index.tsx:92-95
export default function HomeScreen() {
  const { t } = useI18n();
  const { play, setQueue, currentTrack } = usePlayerStore();
  const accentColor = useDynamicAccent();
Проблема: usePlayerStore() без селектора подписывает компонент на весь стор. progress обновляется каждые 250мс из audioService → HomeScreen, LibraryScreen, SearchScreen, PlaylistScreen ререндерятся 4 раза в секунду, даже когда юзер их не видит.

MiniPlayer нужно подписаться на progress, но остальные компоненты — нет.

Why: В zustand вызов useStore() без селектора эквивалентен useSyncExternalStore без getSnapshot — любой setState триггерит ререндер.

Suggestion:

ts
// Home / Library / Search / Playlist
const play = usePlayerStore((s) => s.play);
const setQueue = usePlayerStore((s) => s.setQueue);
const currentTrackId = usePlayerStore((s) => s.currentTrack?.id);
// Use currentTrackId for `isActive` checks instead of currentTrack
Только MiniPlayer и PlayerScreen должны подписываться на progress. MiniPlayer сейчас подписан правильно, но не через селектор:

ts
// MiniPlayer.tsx — split selectors
const currentTrack = usePlayerStore((s) => s.currentTrack);
const isPlaying = usePlayerStore((s) => s.isPlaying);
const progress = usePlayerStore((s) => s.progress);
const togglePlayback = usePlayerStore((s) => s.togglePlayback);
🟡 Suggestions
🟡 LyricsView — пересоздание SyncedLine на каждый тик прогресса
Файл: @/home/phexuss/Desktop/exos/apps/mobile/components/LyricsView.tsx:194-214, 332-348

LyricsView.tsx:194-214
useEffect(() => {
  if (currentLineIndex < 0 || !scrollRef.current) return;
 
  let offset = 0;
  for (let i = 0; i < currentLineIndex; i++) {
    offset += lineHeights.current[i] || 43;
  }
  // Place active line ~1/3 from top of container
  const targetY = Math.max(0, offset - containerH * 0.3);
Проблемы:

SyncedLine не обёрнут в React.memo → при каждом изменении currentLineIndex пересоздаются все строки в parsedLines.map(). Для песни на 60 строк — 60 React-компонентов рендерятся 4 раза в секунду.
vibrateHex() вызывается дважды на render каждой активной строки (line 130 и line 139) — это арифметика на каждый рендер.
distance пересчитывается inline → каждый SyncedLine получает новый prop, даже если не изменился.
Suggestion:

ts
const SyncedLine = memo(function SyncedLine({ ... }) { /* ... */ });
 
// Кэш для vibrateHex
const vibrateCache = new Map<string, string>();
function vibrateHex(hex: string): string {
  const cached = vibrateCache.get(hex);
  if (cached) return cached;
  /* compute */
  vibrateCache.set(hex, result);
  return result;
}
Альтернативно: вместо progress через React-state, передавать его в shared value reanimated и обновлять isActive через useAnimatedReaction — тогда React не ререндерится вообще.

🟡 useDynamicAccent — extractColor не отменяется по-настоящему
Файл: useDynamicAccent.ts:185-200

useDynamicAccent.ts:185-200
let cancelled = false;
 
extractColor(coverUrl)
  .then((hex) => {
    if (cancelled || !hex) return;
    const boosted = boostSaturation(hex);
    cache.set(coverUrl, boosted);
    setColor(boosted);
  })
  .catch(() => {
    if (!cancelled) setColor(COLORS.accent);
  });
 
return () => {
  cancelled = true;
};
Why: cancelled flag только игнорирует setState. Сам fetch + FileReader + декодирование atob продолжают работать → впустую жгут CPU при быстром свапе треков.

Suggestion:

ts
const controller = new AbortController();
const res = await fetch(tinyUrl, { signal: controller.signal });
// ...
return () => controller.abort();
Также extractColor использует FileReader + atob на UI-thread — это блокирует JS на 5-20мс на каждое изображение. Для альбомов 1x1 px это ок, но для не-Deezer источников URL не модифицируется (url.includes('dzcdn.net')) → грузится полное изображение и парсится в JS. Лучше использовать react-native-image-colors (нативный) при build, как и упомянуто в TODO.

🟡 SettingsStore — module-level side effect
Файл: useSettingsStore.ts:23-36

useSettingsStore.ts:23-36
// Hydrate from storage on init
AsyncStorage.getItem(STORAGE_KEY)
  .then((raw) => {
    if (raw !== null) {
      useSettingsStore.setState({
        dynamicAccent: JSON.parse(raw),
        _hydrated: true,
      });
    } else {
      useSettingsStore.setState({ _hydrated: true });
    }
  })
  .catch(() => {
    useSettingsStore.setState({ _hydrated: true });
  });
Why: Hydrate начинается при первом import модуля — до того как React смонтирован и до того как LanguageProvider поднялся. Если JSON.parse падает на повреждённом значении — поглощается .catch() молча. Также _hydrated нигде не читается (можно проверить grep).

Suggestion: Перенести в RootLayout useEffect рядом с useAuthStore.checkAuth() — единая точка bootstrap'а. Либо явно использовать _hydrated флаг чтобы блокировать UI пока настройки не загрузились (если важно).

🟡 library.tsx — двойной load на focus + revision change
Файл: library.tsx:42-50

library.tsx:42-50
useFocusEffect(
  useCallback(() => {
    load();
  }, [load]),
);
 
useEffect(() => {
  load();
}, [revision, load]);
Why: Когда пользователь скачивает трек, находясь на library: revision инкрементится → useEffect зовёт load(). Сразу после возврата фокуса (если был блюр) — useFocusEffect снова зовёт load(). Два параллельных SQL-запроса. Не критично, но лишний дребезг.

Suggestion: Оставить только useEffect на revision (revision уже бампится при setDownloadedIds, который вызывается в RootLayout на mount → load всегда триггерится). useFocusEffect нужен только если есть мутации вне stores (например, удаление плейлиста через PlaylistScreen — оно через DB напрямую, без revision-bump).

Лучше: добавить bumpRevision() в places где меняется data вне store (deletePlaylist, addTrackToPlaylist, etc.) — тогда useFocusEffect не нужен вообще.

🟡 useDownloadStore.revision — over-bumping
Файл: useDownloadStore.ts:61-74

useDownloadStore.ts:61-68
setDownloadProgress: (trackId, progress, status) =>
  set((s) => ({
    activeDownloads: {
      ...s.activeDownloads,
      [trackId]: { progress, status },
    },
    revision: s.revision + 1,
  })),
Why: revision бампится на каждый прогресс-тик скачивания (~ 1Hz при downloadFile, но потенциально чаще). Все подписчики revision (library.tsx:27) ререндерятся → перезапрос SQL.

Suggestion: Bumpать revision только при markDownloaded/markRemoved/setDownloadedIds. Прогресс — отдельная тема, его подписчики (DownloadButton) уже подписаны через s.activeDownloads[track.id]?.progress, не нуждаются в revision.

🟡 PlayerScreen FlatList без оптимизаций
Файл: PlayerScreen.tsx:150-163

PlayerScreen.tsx:150-163
<FlatList
  data={queue}
  keyExtractor={(item) => item.id}
  showsVerticalScrollIndicator={false}
  renderItem={({ item }) => (
    <TrackItem
      track={item}
      onPress={(t) => {
        play(t);
        setShowQueue(false);
      }}
    />
  )}
/>
Why: renderItem создаёт новый inline-callback на каждый рендер → TrackItem (не memo!) рендерится для всех элементов очереди, даже не изменившихся. Также нет getItemLayout/windowSize — для очереди 100+ треков скролл не плавный.

Suggestion:

ts
const renderTrack = useCallback(({ item }: { item: Track }) => (
  <TrackItem track={item} onPress={handleQueuePlay} />
), [handleQueuePlay]);
 
const handleQueuePlay = useCallback((t: Track) => {
  play(t);
  setShowQueue(false);
}, [play, setShowQueue]);
 
// + memoize TrackItem
🟡 TrackItem / RecentCard без React.memo
Файлы:

TrackItem.tsx:21
index.tsx:17-90
Why: Эти компоненты рендерятся в списках по N штук. При смене currentTrack (одной строки isActive меняется) — все N перерисовываются.

Suggestion:

ts
export const TrackItem = memo(function TrackItem(props: TrackItemProps) {
  /* ... */
}, (prev, next) =>
  prev.track.id === next.track.id &&
  prev.isActive === next.isActive &&
  prev.accentColor === next.accentColor &&
  prev.showBitrate === next.showBitrate &&
  prev.showDownload === next.showDownload,
);
🟡 MiniPlayer border progress — width в %
Файл: MiniPlayer.tsx:38-44

MiniPlayer.tsx:38-44
<View
  style={{
    height: 1,
    width: `${Math.max(progress * 100, 0.5)}%`,
    backgroundColor: accentColor,
  }}
/>
Why: width: '50.234%' пересоздаёт style-object 4 раза в секунду. Каждый раз RN bridge передаёт новое значение → setNativeProps на нативном View. Не блокер, но можно сделать без React-обновления через reanimated useSharedValue + useAnimatedStyle.

Suggestion: В audioService.startPositionTracking обновлять shared-value параллельно с setState({ progress }). Тогда MiniPlayer/SeekBar читают shared-value напрямую и не ререндерятся.

💭 Nits
💭 usePlayerStore — Function тип
Файл: @/home/phexuss/Desktop/exos/apps/mobile/store/usePlayerStore.ts:39, 59

usePlayerStore.ts:39
function smartPlay(track: Track, set: Function): boolean {
Why: Function — банный тип в biome (lint/complexity/noBannedTypes). Не safety, но потеряны типы.

Suggestion: Заменить на сигнатуру:

ts
type SetState = (
  partial: Partial<PlayerState> | ((s: PlayerState) => Partial<PlayerState>),
) => void;
 
function smartPlay(track: Track, set: SetState): boolean { /* ... */ }
💭 database.ts:40 — e: any
Файл: database.ts:40-50

database.ts:40-44
} catch (e: any) {
  if (
    e?.message?.includes('NullPointerException') ||
    e?.message?.includes('NativeDatabase')
  ) {
Suggestion:

ts
} catch (e) {
  const msg = e instanceof Error ? e.message : '';
  if (msg.includes('NullPointerException') || msg.includes('NativeDatabase')) { /* ... */ }
}
💭 audioService.ts — global mutable state без защиты
Файл: audioService.ts:4-6

audioService.ts:4-6
let player: AudioPlayer | null = null;
let positionInterval: ReturnType<typeof setInterval> | null = null;
let isSeeking = false;
Why: Это сервис-singleton — норм для RN. Просто заметка: при unit-тестах сложно сбросить state. Если будут тесты — ввести фабрику.

💭 LyricsView.tsx — magic number 43
Файл: LyricsView.tsx:199

LyricsView.tsx:199
offset += lineHeights.current[i] || 43;
Suggestion: Вынести в const ESTIMATED_LINE_HEIGHT = 43.

💭 useDynamicAccent cache — без TTL/limit
Файл: useDynamicAccent.ts:7

useDynamicAccent.ts:7
const cache = new Map<string, string>();
Why: Растёт безгранично. На сессии в 1000 треков — 1000 entries × ~30 байт. Не утечка, но мысль на будущее: LRU с лимитом 200.

✅ Хорошие паттерны
withDb retry на NullPointerException (database.ts:34-52) — классный self-healing pattern для известного бага expo-sqlite.
Single-flight refresh в apiRequest (client.ts:62-94) — корректно handlit'ит race на 401.
DownloadButton использует разделённые селекторы (DownloadButton.tsx:18-23) — прекрасный пример того, как должно быть везде.
SeekBar — gesture handlers в worklet'ах + runOnJS для коллбэков. Это native 60fps без mutex'ов.
Overlay-архитектура (Player/Profile/Settings/Playlist) с lazy-mount через if (!isOpen) return null — память не утекает, оверлеи действительно дешёвые.
Priority order для фиксов
🔴 audioService listener+interval cleanup — 1 файл, ~20 строк, заметный профит на DEV.
🔴 Селекторы в табах — usePlayerStore() → usePlayerStore((s) => s.thing). ~5 файлов, чистый win по перформансу.
🔴 library.tsx + PlaylistScreen.tsx → FlatList — самый большой UX-импакт для пользователей с большой коллекцией.
🟡 revision bump только на add/remove — 1 функция в store.
🟡 memo на TrackItem/RecentCard/SyncedLine — копеечная работа, заметный профит на больших экранах.