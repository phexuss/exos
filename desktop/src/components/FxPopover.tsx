import { AudioLines } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useT } from '@/i18n';
import { EQ_BANDS, EQ_PRESETS, EQ_RANGE, type EqPreset, eqPresetOf, FX_PRESETS, type FxPreset, presetOf } from '@/lib/fx';
import { snappy } from '@/lib/springs';
import { useSettings } from '@/store/settings';
import { Tabs } from './Tabs';
import { Slider, Toggle } from './ui';

const SPEED_MIN = 0.5;
const SPEED_RANGE = 1;

const bandLabel = (hz: number) => (hz >= 1000 ? `${hz / 1000}k` : String(hz));

/** The equalizer page: ten bands, presets, and a switch that bypasses it without losing the curve. */
function EqPage() {
  const eqOn = useSettings((s) => s.eqOn);
  const eq = useSettings((s) => s.eq);
  const set = useSettings((s) => s.set);
  const { t } = useT();
  const preset = eqPresetOf(eq);
  const setBand = (i: number, v: number) => {
    const next = [...eq];
    next[i] = v;
    set({ eq: next, eqOn: true });
  };
  return (
    <>
      <div className="fx__row fx__row--switch">
        <span>{t('fx.eqOn')}</span>
        <Toggle on={eqOn} onChange={(v) => set({ eqOn: v })} label={t('fx.eqOn')} />
      </div>
      <div className="fx__chips" role="group" aria-label={t('fx.eqPresets')}>
        {(Object.keys(EQ_PRESETS) as EqPreset[]).map((p) => (
          <button
            type="button"
            key={p}
            className={`fx__chip ${preset === p ? 'is-on' : ''}`}
            aria-pressed={preset === p}
            onClick={() => set({ eq: [...EQ_PRESETS[p]], eqOn: p !== 'flat' })}
          >
            {t(`fx.eq_${p}`)}
          </button>
        ))}
      </div>
      <div className={`eq ${eqOn ? '' : 'is-off'}`}>
        {EQ_BANDS.map((hz, i) => (
          <label key={hz} className="eq__band" title={`${bandLabel(hz)} Hz · ${eq[i] > 0 ? '+' : ''}${eq[i]} dB`}>
            <input
              type="range"
              min={-EQ_RANGE}
              max={EQ_RANGE}
              step={1}
              value={eq[i] ?? 0}
              aria-label={`${bandLabel(hz)} Hz`}
              onChange={(e) => setBand(i, Number(e.target.value))}
              onDoubleClick={() => setBand(i, 0)}
            />
            <span>{bandLabel(hz)}</span>
          </label>
        ))}
      </div>
      <p className="fx__hint">{t('fx.eqHint')}</p>
    </>
  );
}

/** Player bar button with sped up / slowed / reverb controls above it. */
export function FxPopover() {
  const speed = useSettings((s) => s.speed);
  const reverb = useSettings((s) => s.reverb);
  const set = useSettings((s) => s.set);
  const { t } = useT();
  const eqActive = useSettings((s) => s.eqOn && s.eq.some((g) => g !== 0));
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<'fx' | 'eq'>('fx');
  const root = useRef<HTMLDivElement>(null);
  const fxActive = speed !== 1 || reverb > 0;
  const active = fxActive || eqActive;
  const preset = presetOf({ speed, reverb });

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  const round = (v: number, step: number) => Math.round(v / step) * step;

  return (
    <div className="fx" ref={root}>
      <button
        type="button"
        className={`icon-btn ${active ? 'is-on' : ''}`}
        aria-label={t('fx.button')}
        aria-expanded={open}
        title={t('fx.button')}
        onClick={() => setOpen(!open)}
      >
        <AudioLines size={18} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fx__pop"
            role="dialog"
            aria-label={t('fx.title')}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.12 } }}
            transition={snappy}
          >
            <div className="fx__head">
              <div className="fx__pages" role="tablist">
                <button type="button" role="tab" aria-selected={page === 'fx'} className={page === 'fx' ? 'is-on' : ''} onClick={() => setPage('fx')}>
                  {t('fx.title')}
                </button>
                <button type="button" role="tab" aria-selected={page === 'eq'} className={page === 'eq' ? 'is-on' : ''} onClick={() => setPage('eq')}>
                  {t('fx.eq')}
                </button>
              </div>
              {page === 'fx' && fxActive && (
                <button type="button" className="link-btn" onClick={() => set(FX_PRESETS.off)}>
                  {t('fx.reset')}
                </button>
              )}
            </div>
            {page === 'eq' ? (
              <EqPage />
            ) : (
              <>
              <Tabs<FxPreset | 'custom'>
                value={preset ?? 'custom'}
                onChange={(p) => p !== 'custom' && set(FX_PRESETS[p])}
                options={[
                  { value: 'off', label: t('fx.normal') },
                  { value: 'sped', label: t('fx.sped') },
                  { value: 'slowed', label: t('fx.slowed') },
                ]}
              />
              <div className="fx__row">
                <span>{t('fx.speed')}</span>
                <Slider
                  value={speed - SPEED_MIN}
                  max={SPEED_RANGE}
                  label={t('fx.speed')}
                  onChange={(v) => set({ speed: round(SPEED_MIN + v, 0.05) })}
                  onCommit={(v) => set({ speed: round(SPEED_MIN + v, 0.05) })}
                />
                <span className="tabular fx__val">×{speed.toFixed(2)}</span>
              </div>
              <div className="fx__row">
                <span>{t('fx.reverb')}</span>
                <Slider
                  value={reverb}
                  max={1}
                  label={t('fx.reverb')}
                  onChange={(v) => set({ reverb: round(v, 0.05) })}
                  onCommit={(v) => set({ reverb: round(v, 0.05) })}
                />
                <span className="tabular fx__val">{Math.round(reverb * 100)}%</span>
              </div>
              <p className="fx__hint">{t('fx.hint')}</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
