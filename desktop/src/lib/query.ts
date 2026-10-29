/**
 * A small query cache for screens. A screen that was seen (or prefetched on
 * hover) renders from memory on the first frame, with no skeleton, and
 * refreshes in the background when its data is older than `staleMs`. The
 * engine's disk cache sits behind this, so a cold start is fast too.
 */
import { useCallback, useEffect, useSyncExternalStore } from 'react';

type Entry<T> = {
  data?: T;
  error?: string;
  at: number;
  promise?: Promise<T>;
};

const entries = new Map<string, Entry<unknown>>();
const subs = new Map<string, Set<() => void>>();
const MAX_ENTRIES = 200;

function notify(key: string) {
  for (const fn of subs.get(key) ?? []) fn();
}

function entry<T>(key: string): Entry<T> {
  let e = entries.get(key) as Entry<T> | undefined;
  if (!e) {
    e = { at: 0 };
    entries.set(key, e);
    // Oldest first in a Map; drop the oldest unwatched ones.
    if (entries.size > MAX_ENTRIES) {
      for (const k of entries.keys()) {
        if (entries.size <= MAX_ENTRIES) break;
        if (!subs.get(k)?.size) entries.delete(k);
      }
    }
  }
  return e;
}

/** Starts (or joins) a fetch for `key`. */
export function fetchQuery<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const e = entry<T>(key);
  if (e.promise) return e.promise;
  const p = fn().then(
    (data) => {
      // Replace the object so useSyncExternalStore sees a change.
      entries.set(key, { data, at: Date.now() });
      notify(key);
      return data;
    },
    (err: unknown) => {
      entries.set(key, { data: e.data, at: e.at, error: err instanceof Error ? err.message : String(err) });
      notify(key);
      throw err;
    },
  );
  entries.set(key, { ...e, promise: p });
  notify(key);
  return p;
}

/** Fetches ahead of a click (hover, focus) unless the data is already fresh. */
export function prefetch<T>(key: string, fn: () => Promise<T>, staleMs = 5 * 60_000) {
  const e = entries.get(key);
  if (e?.promise || (e?.data !== undefined && Date.now() - e.at < staleMs)) return;
  fetchQuery(key, fn).catch(() => {});
}

export type Query<T> = { data: T | null; error: string | null; loading: boolean; refreshing: boolean };

export function useQuery<T>(key: string | null, fn: () => Promise<T>, staleMs = 5 * 60_000): Query<T> {
  const subscribe = useCallback(
    (cb: () => void) => {
      if (!key) return () => {};
      if (!subs.has(key)) subs.set(key, new Set());
      subs.get(key)!.add(cb);
      return () => subs.get(key)?.delete(cb);
    },
    [key],
  );
  const snap = useSyncExternalStore(subscribe, () => (key ? (entries.get(key) as Entry<T> | undefined) : undefined));
  useEffect(() => {
    if (!key) return;
    const e = entries.get(key);
    if (e?.promise) return;
    if (e?.data === undefined || Date.now() - e.at > staleMs) fetchQuery(key, fn).catch(() => {});
    // fn is a new closure each render; the key identifies the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, staleMs]);
  if (!key) return { data: null, error: null, loading: false, refreshing: false };
  const data = snap?.data ?? null;
  return {
    data,
    error: data === null ? (snap?.error ?? null) : null,
    loading: data === null && !snap?.error,
    refreshing: !!snap?.promise && data !== null,
  };
}
