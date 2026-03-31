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
  name?: string;
  message: string;
  team?: string;
  timestamp: number;
}

export interface ChatLogEntry {
  id: string;
  name: string;
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
  direction?: 'left' | 'right';
  isTyping?: boolean;
  pet?: string;
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
  chatLog: ChatLogEntry[];
  playerDirection: 'left' | 'right';
  isTyping: boolean;
  typingUsers: Set<string>;
  spawnKey: number;
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
  setPlayerDirection: (dir: 'left' | 'right') => void;
  setIsTyping: (v: boolean) => void;
  setTypingUser: (userId: string, isTyping: boolean) => void;
}

// 말풍선 자동 삭제 타이머 (store 외부에서 관리 — 인터페이스 오염 방지)
const _bubbleTimers = new Map<string, ReturnType<typeof setTimeout>>();

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
  chatLog: [],
  playerDirection: 'right',
  isTyping: false,
  typingUsers: new Set(),
  spawnKey: 0,
  addChatBubble: (bubble) => {
    // 같은 유저의 이전 타이머 취소
    const prevTimer = _bubbleTimers.get(bubble.userId);
    if (prevTimer) clearTimeout(prevTimer);

    set((s) => {
      const next = new Map(s.chatBubbles);
      next.set(bubble.userId, bubble);
      // 채팅 로그에 추가 (최대 50개 유지)
      const logEntry: ChatLogEntry = {
        id: bubble.id,
        name: bubble.name || '???',
        message: bubble.message,
        team: bubble.team,
        timestamp: bubble.timestamp,
      };
      const newLog = [...s.chatLog, logEntry].slice(-50);
      return { chatBubbles: next, chatLog: newLog };
    });

    const timer = setTimeout(() => {
      _bubbleTimers.delete(bubble.userId);
      get().removeChatBubble(bubble.userId);
    }, 8000);
    _bubbleTimers.set(bubble.userId, timer);
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
    // 이전 방 말풍선 타이머 전부 정리
    _bubbleTimers.forEach((t) => clearTimeout(t));
    _bubbleTimers.clear();
    set((s) => ({
      currentRoom: roomId,
      playerPosition: spawn,
      nearZone: null,
      nearPortal: null,
      activeZone: null,
      moveTarget: null,
      otherPlayers: new Map(),
      chatBubbles: new Map(),
      chatLog: [],
      typingUsers: new Set(),
      spawnKey: s.spawnKey + 1,
    }));
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
  setPlayerDirection: (dir) => set({ playerDirection: dir }),
  setIsTyping: (v) => set({ isTyping: v }),
  setTypingUser: (userId, typing) =>
    set((s) => {
      const next = new Set(s.typingUsers);
      if (typing) next.add(userId);
      else next.delete(userId);
      return { typingUsers: next };
    }),
}));
