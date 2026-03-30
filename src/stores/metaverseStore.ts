import { create } from 'zustand';
import type { ZoneId } from '../lib/constants';

interface EmojiFloat {
  id: string;
  emoji: string;
  x: number;
  y: number;
}

interface MetaverseState {
  activeZone: ZoneId | null;
  nearZone: ZoneId | null;
  playerPosition: { x: number; y: number };
  onlineUsers: string[];
  emojiFloats: EmojiFloat[];
  setActiveZone: (zone: ZoneId | null) => void;
  setNearZone: (zone: ZoneId | null) => void;
  setPlayerPosition: (pos: { x: number; y: number }) => void;
  setOnlineUsers: (users: string[]) => void;
  addEmojiFloat: (emoji: string) => void;
  removeEmojiFloat: (id: string) => void;
}

export const useMetaverseStore = create<MetaverseState>((set, get) => ({
  activeZone: null,
  nearZone: null,
  playerPosition: { x: 430, y: 380 },
  onlineUsers: [],
  emojiFloats: [],
  setActiveZone: (zone) => set({ activeZone: zone }),
  setNearZone: (zone) => set({ nearZone: zone }),
  setPlayerPosition: (pos) => set({ playerPosition: pos }),
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  addEmojiFloat: (emoji) => {
    const { playerPosition } = get();
    const id = crypto.randomUUID();
    set((s) => ({
      emojiFloats: [...s.emojiFloats, { id, emoji, x: playerPosition.x + 8, y: playerPosition.y - 10 }],
    }));
    setTimeout(() => get().removeEmojiFloat(id), 1500);
  },
  removeEmojiFloat: (id) =>
    set((s) => ({ emojiFloats: s.emojiFloats.filter((e) => e.id !== id) })),
}));
