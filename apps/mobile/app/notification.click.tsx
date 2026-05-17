import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';

export default function NotificationClickRoute() {
  const router = useRouter();

  useEffect(() => {
    const player = usePlayerStore.getState();
    if (player.currentTrack) {
      player.openPlayer();
    }
    router.replace('/(tabs)' as never);
  }, [router]);

  return null;
}
