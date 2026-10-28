import { create } from 'zustand';

type Toast = { id: number; text: string; tone: 'info' | 'error' };

type ToastState = { toasts: Toast[]; push: (text: string, tone?: Toast['tone']) => void };

let seq = 0;

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (text, tone = 'info') => {
    const id = ++seq;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text, tone }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4200);
  },
}));

export const toast = (text: string, tone?: Toast['tone']) => useToasts.getState().push(text, tone);
