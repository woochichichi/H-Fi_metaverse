import { create } from 'zustand';
import type { ZoneId, RoomId, PortalDef } from '../lib/constants';
import { ROOMS_DATA } from '../lib/constants';

interface EmojiFloat {
  id: string;
  emoji: string;
  x: number;
  y: number;
}

export interface ChatBubble {
  id: string;
  userId: string;
  message: string;
  team?: string;
  timestamp: number;
}

interface MoveTarget {
  x: number;
  y: number;
  zoneId: ZoneId;
}

export interface OtherPlayer {
  userId: string;
  name: string;
  team: string;
  room: RoomId;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  moodEmoji?: string;
  avatarColor?: string;
  skinColor?: string;
  hairColor?: string;
  hairStyle?: string;
  accessory?: string;
}

export interface GlobalPresenceUser {
  userId: string;
  name: string;
  team: string;
  room: RoomId;
  moodEmoji?: string;
}

interface MetaverseState {
  activeZone: ZoneId | null;
  nearZone: ZoneId | null;
  playerPosition: { x: number; y: number };
  moveTarget: MoveTarget | null;
  onlineUsers: string[];
  globalOnlineUsers: Map<string, GlobalPresenceUser>;
  emojiFloats: EmojiFloat[];
  currentRoom: RoomId;
  nearPortal: PortalDef | null;
  otherPlayers: Map<string, OtherPlayer>;
  chatBubbles: Map<string, ChatBubble>;
  addChatBubble: (bubble: ChatBubble) => void;
  removeChatBubble: (userId: string) => void;
  setActiveZone: (zone: ZoneId | null) => void;
  setNearZone: (zone: ZoneId | null) => void;
  setPlayerPosition: (pos: { x: number; y: number }) => void;
  setMoveTarget: (target: MoveTarget | null) => void;
  setOnlineUsers: (users: string[]) => void;
  setGlobalOnlineUsers: (users: Map<string, GlobalPresenceUser>) => void;
  addEmojiFloat: (emoji: string) => void;
  removeEmojiFloat: (id: string) => void;
  setCurrentRoom: (roomId: RoomId) => void;
  setNearPortal: (portal: PortalDef | null) => void;
  enterRoom: (roomId: RoomId, spawnPoint?: { x: number; y: number }) => void;
  updateOtherPlayer: (player: OtherPlayer) => void;
  removeOtherPlayer: (userId: string) => void;
  clearOtherPlayers: () => void;
}

export const useMetaverseStore = create<MetaverseState>((set, get) => ({
  activeZone: null,
  nearZone: null,
  playerPosition: { x: 400, y: 100 },
  moveTarget: null,
  onlineUsers: [],
  globalOnlineUsers: new Map(),
  emojiFloats: [],
  currentRoom: 'stock',
  nearPortal: null,
  otherPlayers: new Map(),
  chatBubbles: new Map(),
  addChatBubble: (bubble) => {
    set((s) => {
      const next = new Map(s.chatBubbles);
      next.set(bubble.userId, bubble);
      return { chatBubbles: next };
    });
    setTimeout(() => get().removeChatBubble(bubble.userId), 5000);
  },
  removeChatBubble: (userId) =>
    set((s) => {
      const next = new Map(s.chatBubbles);
      next.delete(userId);
      return { chatBubbles: next };
    }),
  setActiveZone: (zone) => set({ activeZone: zone }),
  setNearZone: (zone) => set({ nearZone: zone }),
  setPlayerPosition: (pos) => set({ playerPosition: pos }),
  setMoveTarget: (target) => set({ moveTarget: target }),
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  setGlobalOnlineUsers: (users) => set({ globalOnlineUsers: users }),
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
  setCurrentRoom: (roomId) => set({ currentRoom: roomId }),
  setNearPortal: (portal) => set({ nearPortal: portal }),
  enterRoom: (roomId, spawnPoint) => {
    const room = ROOMS_DATA[roomId];
    const spawn = spawnPoint || room.spawnPoint;
    set({
      currentRoom: roomId,
      playerPosition: spawn,
      nearZone: null,
      nearPortal: null,
      activeZone: null,
      moveTarget: null,
      otherPlayers: new Map(),
    });
  },
  updateOtherPlayer: (player) =>
    set((s) => {
      const next = new Map(s.otherPlayers);
      const existing = next.get(player.userId);
      next.set(player.userId, {
        ...player,
        x: existing?.x ?? player.targetX,
        y: existing?.y ?? player.targetY,
      });
      return { otherPlayers: next };
    }),
  removeOtherPlayer: (userId) =>
    set((s) => {
      const next = new Map(s.otherPlayers);
      next.delete(userId);
      return { otherPlayers: next };
    }),
  clearOtherPlayers: () => set({ otherPlayers: new Map() }),
}));
