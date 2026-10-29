import { LayoutGroup, motion } from 'motion/react';
import { useId } from 'react';
import { snappy } from '@/lib/springs';

/** Segmented switch whose highlight slides between options on a spring. */
export function Tabs<V extends string>({
  value,
  options,
  onChange,
}: {
  value: V;
  options: { value: V; label: string }[];
  onChange: (v: V) => void;
}) {
  const id = useId();
  return (
    <LayoutGroup id={id}>
      <div className="tabs" role="tablist">
        {options.map((o) => (
          <button
            type="button"
            role="tab"
            aria-selected={o.value === value}
            key={o.value}
            className={o.value === value ? 'is-active' : ''}
            onClick={() => onChange(o.value)}
          >
            {o.value === value && <motion.span layoutId="pill" className="tabs__pill" transition={snappy} />}
            <span className="tabs__label">{o.label}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}
