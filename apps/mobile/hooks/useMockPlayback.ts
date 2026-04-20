import { useEffect, useRef } from 'react';

import { usePlayerStore } from '@/store/usePlayerStore';

function parseDuration(duration: string): number {
  const [min, sec] = duration.split(':').map(Number);
  return (min ?? 0) * 60 + (sec ?? 0);
}

export function useMockPlayback() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSeeking = useRef(false);

  useEffect(() => {
    const tick = () => {
      if (isSeeking.current) return;
      const { isPlaying, currentTrack, progress, repeat, skipNext } =
        usePlayerStore.getState();
      if (!isPlaying || !currentTrack) return;

      const totalSec = parseDuration(currentTrack.duration);
      if (totalSec <= 0) return;

      const step = 1 / totalSec;
      const next = progress + step;

      if (next >= 1) {
        if (repeat === 'one') {
          usePlayerStore.setState({ progress: 0 });
        } else {
          skipNext();
        }
      } else {
        usePlayerStore.setState({ progress: next });
      }
    };

    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startSeeking = () => {
    isSeeking.current = true;
  };

  const stopSeeking = () => {
    isSeeking.current = false;
  };

  return { startSeeking, stopSeeking };
}
