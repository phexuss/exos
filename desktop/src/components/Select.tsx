import { Check, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { snappy } from '@/lib/springs';

/**
 * Drop-down drawn by the app. The native <select> popup is drawn by the
 * toolkit, and on Linux under Wayland it comes up white with unreadable items,
 * so every choice list in the app goes through this instead.
 */
export function Select<V extends string>({
  value,
  options,
  onChange,
  label,
  id,
}: {
  value: V;
  options: { value: V; label: string }[];
  onChange: (v: V) => void;
  label: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hot, setHot] = useState(0);
  const [pos, setPos] = useState<{
    left: number;
    top?: number;
    bottom?: number;
    minWidth: number;
    up: boolean;
  } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  useLayoutEffect(() => {
    if (!open || !button.current) return;
    const r = button.current.getBoundingClientRect();
    const height = options.length * 34 + 12;
    const up = r.bottom + 6 + height > window.innerHeight - 8 && r.top > height;
    setPos(
      up
        ? {
            left: r.left,
            bottom: window.innerHeight - r.top + 6,
            minWidth: r.width,
            up,
          }
        : { left: r.left, top: r.bottom + 6, minWidth: r.width, up },
    );
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!list.current?.contains(t) && !button.current?.contains(t)) setOpen(false);
    };
    const close = () => setOpen(false);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('blur', close);
    window.addEventListener('resize', close);
    // Scrolling the page moves the button away from the list; close like a native popup.
    document.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('blur', close);
      window.removeEventListener('resize', close);
      document.removeEventListener('scroll', close, true);
    };
  }, [open]);

  const choose = (v: V) => {
    onChange(v);
    setOpen(false);
    button.current?.focus();
  };

  return (
    <>
      <button
        ref={button}
        id={id}
        type="button"
        className={`select ${open ? 'is-open' : ''}`}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setHot(Math.max(0, options.indexOf(current)));
          setOpen(!open);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            e.stopPropagation();
            if (!open) {
              setHot(Math.max(0, options.indexOf(current)));
              setOpen(true);
              return;
            }
            const step = e.key === 'ArrowDown' ? 1 : -1;
            setHot((h) => (h + step + options.length) % options.length);
          } else if (open && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            choose(options[hot].value);
          } else if (open && e.key === 'Escape') {
            e.stopPropagation();
            setOpen(false);
          }
        }}
      >
        <span className="ellipsis">{current?.label}</span>
        <ChevronDown size={15} className="select__chevron" />
      </button>
      {createPortal(
        <AnimatePresence>
          {open && pos && (
            <motion.div
              ref={list}
              role="listbox"
              aria-label={label}
              className="menu select__list"
              style={{
                left: pos.left,
                top: pos.top,
                bottom: pos.bottom,
                minWidth: pos.minWidth,
                transformOrigin: pos.up ? '50% 100%' : '50% 0',
              }}
              initial={{ opacity: 0, scale: 0.96, y: pos.up ? 6 : -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.1 } }}
              transition={snappy}
            >
              {options.map((o, i) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={o.value === value}
                  key={o.value}
                  className={i === hot ? 'is-hot' : ''}
                  onMouseEnter={() => setHot(i)}
                  onClick={() => choose(o.value)}
                >
                  <span style={{ flex: 1 }}>{o.label}</span>
                  {o.value === value && <Check size={15} />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        // Pages move with transforms, which would carry a fixed list along; it lives on <body>.
        document.body,
      )}
    </>
  );
}
