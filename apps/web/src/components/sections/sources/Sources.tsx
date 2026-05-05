import SourceCard from './SourceCard';

export default function Sources() {
  return (
    <section
      id="sources"
      className="grid grid-cols-1 lg:grid-cols-2 py-12 sm:py-14 lg:py-16 max-w-275 mx-auto px-4 sm:px-6 gap-4 sm:gap-4.5 items-stretch"
    >
      <SourceCard source="deezer" />
      <SourceCard source="soundcloud" />
    </section>
  );
}
