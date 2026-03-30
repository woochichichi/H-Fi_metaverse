import { create } from 'zustand';
import type { ZoneId } from '../lib/constants';

interface MetaverseState {
  activeZone: ZoneId | null;
  playerPosition: { x: number; y: number };
  onlineUsers: string[];
  setActiveZone: (zone: ZoneId | null) => void;
  setPlayerPosition: (pos: { x: number; y: number }) => void;
  setOnlineUsers: (users: string[]) => void;
}

export const useMetaverseStore = create<MetaverseState>((set) => ({
  activeZone: null,
  playerPosition: { x: 430, y: 380 },
  onlineUsers: [],
  setActiveZone: (zone) => set({ activeZone: zone }),
  setPlayerPosition: (pos) => set({ playerPosition: pos }),
  setOnlineUsers: (users) => set({ onlineUsers: users }),
}));
