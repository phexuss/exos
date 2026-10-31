/**
 * The colour fields behind the whole page, the same as behind the desktop
 * app's sign-in screen: accent, Deezer violet and SoundCloud orange drifting
 * slowly. Glass panes refract them.
 */
export function GlassBackdrop() {
  return (
    <div aria-hidden="true" className="aurora">
      <i />
      <i />
      <i />
    </div>
  );
}
