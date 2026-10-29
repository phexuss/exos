import type { Track } from './types';

/**
 * What is being dragged right now. Drags never leave the window, so the
 * tracks themselves stay here instead of being serialised into dataTransfer.
 */
export type Dragged = { tracks: Track[]; from?: { playlistId: string; index: number } };

let current: Dragged | null = null;

export function startDrag(e: React.DragEvent, d: Dragged) {
  current = d;
  e.dataTransfer.effectAllowed = 'copyMove';
  e.dataTransfer.setData('text/plain', d.tracks.map((t) => `${t.artist.name} - ${t.title}`).join('\n'));
}

export const dragged = () => current;
export const endDrag = () => {
  current = null;
};
