import { useState } from 'react';
import { ChevronLeft, ChevronRight, Bug } from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';
import { useMetaverseStore } from '../../stores/metaverseStore';
import { useAuthStore } from '../../stores/authStore';
import { ROOMS_DATA, TEAM_TO_ROOM } from '../../lib/constants';
import type { RoomId } from '../../lib/constants';
import type { RoomAlertMap, ZoneAlertMap } from '../../hooks/useZoneAlerts';

interface BottomBarProps {
  roomAlerts: RoomAlertMap;
  zoneAlerts: ZoneAlertMap;
}

// 방별 메뉴 아이템 정의
const ROOM_MENUS: Record<RoomId, { id: string; label: string; emoji: string }[]> = {
  stock: [
    { id: 'stock-lobby', label: '로비', emoji: '🏠' },
    { id: 'stock-kpi', label: 'KPI', emoji: '📊' },
    { id: 'stock-notice', label: '공지', emoji: '📢' },
  ],
  life: [
    { id: 'life-lobby', label: '로비', emoji: '🏠' },
    { id: 'life-kpi', label: 'KPI', emoji: '📊' },
    { id: 'life-notice', label: '공지', emoji: '📢' },
  ],
  shield: [
    { id: 'shield-lobby', label: '로비', emoji: '🏠' },
    { id: 'shield-kpi', label: 'KPI', emoji: '📊' },
    { id: 'shield-notice', label: '공지', emoji: '📢' },
  ],
  plaza: [
    { id: 'voc', label: 'VOC 센터', emoji: '📞' },
    { id: 'idea', label: '아이디어', emoji: '💡' },
    { id: 'gathering', label: '모임방', emoji: '🎉' },
    { id: 'reaction', label: '반응속도', emoji: '⚡' },
    { id: 'omok', label: '오목', emoji: '⚫' },
    { id: 'jumprope', label: '줄넘기', emoji: '🏃' },
  ],
};

// 공용 메뉴 (방 무관)
const GLOBAL_MENUS = [
  { id: 'note', label: '마음의 편지', emoji: '💌' },
  { id: 'inbox', label: '수집함', emoji: '📥' },
];

export default function BottomBar({ roomAlerts, zoneAlerts }: BottomBarProps) {
  const { openModal } = useUiStore();
  const { currentRoom, enterRoom } = useMetaverseStore();
  const { profile } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const myTeamRoom = TEAM_TO_ROOM[profile?.team || ''] || 'stock';
  const isAdmin = profile?.role === 'admin';

  const handleMenuClick = (menuId: string, targetRoom: RoomId) => {
    if (currentRoom !== targetRoom) enterRoom(targetRoom);
    openModal(menuId);
  };

  // 관리자: 내 팀 방 → 중앙 광장 → 나머지 팀 방
  // 일반: 내 팀 방 → 중앙 광장만
  const roomOrder: RoomId[] = isAdmin
    ? [
        myTeamRoom,
        'plaza',
        ...(Object.keys(ROOMS_DATA) as RoomId[]).filter(
          (id) => id !== myTeamRoom && id !== 'plaza'
        ),
      ]
    : [myTeamRoom, 'plaza'];

  return (
    <div className="relative flex h-full flex-shrink-0">
      <div
        className={`flex flex-col border-r border-white/[.06] transition-all duration-200 ${collapsed ? 'w-0 overflow-hidden border-none' : 'w-[168px]'}`}
        style={{ background: 'rgba(42,31,40,.95)', backdropFilter: 'blur(12px)' }}
      >
        {!collapsed && (
          <div className="flex flex-1 flex-col overflow-y-auto p-3">
            {/* 방별 메뉴 섹션 */}
            {roomOrder.map((roomId) => {
              const room = ROOMS_DATA[roomId];
              const menus = ROOM_MENUS[roomId];
              const isCurrentRoom = currentRoom === roomId;

              return (
                <div key={roomId} className="mb-2">
                  {/* 방 헤더 — 클릭으로 이동 */}
                  <button
                    onClick={() => { if (!isCurrentRoom) enterRoom(roomId); }}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all duration-150 ${
                      isCurrentRoom
                        ? 'text-white'
                        : 'text-text-muted hover:bg-white/[.04] hover:text-text-secondary'
                    }`}
                    style={isCurrentRoom ? { background: `${room.theme.main}33`, borderLeft: `3px solid ${room.theme.main}` } : { borderLeft: '3px solid transparent' }}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ background: room.theme.main }}
                    />
                    <span className="truncate">{room.label}</span>
                    {isCurrentRoom && (
                      <span className="ml-auto text-[9px] text-text-muted">현재</span>
                    )}
                    {!isCurrentRoom && roomAlerts[roomId] && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,.6)]" />
                    )}
                  </button>

                  {/* Zone 메뉴 목록 */}
                  <div className="mt-0.5 ml-2 flex flex-col gap-0.5">
                    {menus.map((menu) => {
                      const hasAlert = !!zoneAlerts[menu.id];
                      return (
                        <button
                          key={menu.id}
                          onClick={() => handleMenuClick(menu.id, roomId)}
                          className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all duration-150 ${
                            isCurrentRoom
                              ? 'text-text-secondary hover:bg-accent/15 hover:text-accent-light'
                              : 'text-text-muted/60 hover:bg-white/[.04] hover:text-text-muted'
                          }`}
                        >
                          <span className="text-sm">{menu.emoji}</span>
                          <span>{menu.label}</span>
                          {hasAlert && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_4px_rgba(239,68,68,.6)]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* 구분선 + 공용 메뉴 */}
            <div className="mt-1 flex flex-col gap-0.5 border-t border-white/[.06] pt-2">
              <div className="px-2.5 text-[10px] font-medium text-text-muted mb-0.5">전체</div>
              {GLOBAL_MENUS.map((menu) => (
                <button
                  key={menu.id}
                  onClick={() => openModal(menu.id)}
                  className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] font-medium text-text-secondary transition-all duration-150 hover:bg-accent/15 hover:text-accent-light"
                >
                  <span className="text-sm">{menu.emoji}</span>
                  <span>{menu.label}</span>
                </button>
              ))}
            </div>

            {/* 하단 고정: 사이트 건의 */}
            <div className="mt-auto border-t border-white/[.06] pt-2">
              <button
                onClick={() => openModal('site-report')}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] font-medium text-text-muted transition-all duration-150 hover:bg-white/[.06] hover:text-text-secondary"
              >
                <Bug size={14} className="shrink-0" />
                <span>사이트 건의</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute top-1/2 -right-4 z-10 flex h-10 w-4 -translate-y-1/2 items-center justify-center rounded-r-md border border-l-0 border-white/[.1] text-text-muted transition-colors hover:bg-white/[.1] hover:text-text-secondary"
        style={{ background: 'rgba(30,30,48,.85)' }}
        title={collapsed ? '메뉴 열기' : '메뉴 접기'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </div>
  );
}
