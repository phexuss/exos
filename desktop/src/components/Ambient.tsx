import { placeholderGradient } from '@/lib/format';
import { usePlayer } from '@/store/player';

/** Glass mode backdrop: the current artwork, blurred across the whole window. */
export function Ambient() {
  const current = usePlayer((s) => s.current);
  const bg = current
    ? current.coverUrl
      ? `url("${current.coverUrl}")`
      : placeholderGradient(current.album ?? current.id)
    : 'radial-gradient(50% 50% at 25% 20%, var(--ambient-idle-a), transparent 70%), radial-gradient(40% 40% at 85% 80%, var(--ambient-idle-b), transparent 70%)';
  return (
    <div className="ambient" aria-hidden>
      <div className="ambient__art is-on" key={bg} style={{ backgroundImage: bg }} />
      <div className="ambient__veil" />
    </div>
  );
}
