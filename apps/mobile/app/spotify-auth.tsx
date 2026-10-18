import { useRouter } from 'expo-router';
import { useEffect } from 'react';

/**
 * Landing route for the `exos://spotify-auth` redirect after Spotify
 * sign-in. The auth session already handed the result to the import modal,
 * so this only steps out of the deep link.
 */
export default function SpotifyAuthRoute() {
  const router = useRouter();

  useEffect(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)' as never);
    }
  }, [router]);

  return null;
}
