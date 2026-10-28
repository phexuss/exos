import { useEffect, useRef } from 'react';
import { placeholderGradient } from '@/lib/format';
import { usePlayer } from '@/store/player';

/** Side of the canvas the artwork is shrunk into; stretched to the window it reads as a soft blur. */
const SIZE = 14;

/**
 * The artwork, blurred across the whole window. Instead of a CSS blur (which
 * WebKitGTK on Linux recomputes on the CPU every frame) the image is drawn
 * once into a tiny canvas and the compositor scales it up. Drawing a
 * cross-origin image is fine; we never read the pixels back.
 */
function ArtCanvas({ src }: { src: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const img = new Image();
    let alive = true;
    img.onload = () => {
      const ctx = ref.current?.getContext('2d');
      if (!alive || !ctx) return;
      ctx.imageSmoothingQuality = 'high';
      // Two steps down keep the average colours instead of a few sampled pixels.
      const mid = document.createElement('canvas');
      mid.width = 64;
      mid.height = 64;
      mid.getContext('2d')?.drawImage(img, 0, 0, 64, 64);
      ctx.drawImage(mid, 0, 0, SIZE, SIZE);
      ref.current?.classList.add('is-on');
    };
    img.src = src;
    return () => {
      alive = false;
    };
  }, [src]);
  return <canvas ref={ref} className="ambient__art" width={SIZE} height={SIZE} />;
}

export function AmbientArt() {
  const current = usePlayer((s) => s.current);
  if (current?.coverUrl) return <ArtCanvas key={current.coverUrl} src={current.coverUrl} />;
  const bg = current
    ? placeholderGradient(current.album ?? current.id)
    : 'radial-gradient(50% 50% at 25% 20%, var(--ambient-idle-a), transparent 70%), radial-gradient(40% 40% at 85% 80%, var(--ambient-idle-b), transparent 70%)';
  return <div className="ambient__art is-on" key={bg} style={{ backgroundImage: bg }} />;
}

/** Glass mode backdrop behind the whole shell. */
export function Ambient() {
  return (
    <div className="ambient" aria-hidden>
      <AmbientArt />
      <div className="ambient__veil" />
    </div>
  );
}
