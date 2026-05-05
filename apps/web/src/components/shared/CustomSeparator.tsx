export function CustomSeparator({ className }: { className?: string }) {
  return (
    <div
      className={`h-px w-full bg-linear-to-r from-transparent via-[#818CF8]/30 to-transparent ${className || ''}`}
      aria-hidden="true"
    />
  );
}
