/**
 * Ambient color behind the page in Glass mode, so glass surfaces have
 * something to refract — the web counterpart of the app's artwork backdrop.
 * Hidden unless <html> has the `glass` class.
 */
export function GlassBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-0 transition-opacity duration-700 glass:opacity-100"
    >
      <div className="glass-blob absolute -top-40 -left-32 size-[34rem] rounded-full bg-[#818cf8]/35 blur-[120px]" />
      <div className="glass-blob absolute top-1/3 -right-40 size-[30rem] rounded-full bg-[#a855f7]/25 blur-[120px] [animation-delay:-8s]" />
      <div className="glass-blob absolute -bottom-48 left-1/4 size-[32rem] rounded-full bg-[#f97316]/20 blur-[130px] [animation-delay:-16s]" />
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-background/30 to-background/70" />
    </div>
  );
}
