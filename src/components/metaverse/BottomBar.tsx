import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

export default function BottomBar({ roomAlerts, zoneAlerts }: BottomBarProps) {
  const { openModal } = useUiStore();
  const { currentRoom, enterRoom } = useMetaverseStore();
  const { profile } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const room = ROOMS_DATA[currentRoom];

  // KPI 클릭 시 → 내 팀 룸으로 자동 전환 후 모달
  const handleAction = (actionId: string) => {
    if (actionId === 'kpi') {
      const myRoom = TEAM_TO_ROOM[profile?.team || ''] || 'stock';
      const kpiZoneId = `${ROOMS_DATA[myRoom].id}-kpi`;
      if (currentRoom !== myRoom) enterRoom(myRoom);
      openModal(kpiZoneId);
    } else if (actionId === 'voc' || actionId === 'idea' || actionId === 'gathering' || actionId === 'omok' || actionId === 'reaction') {
      if (currentRoom !== 'plaza') enterRoom('plaza');
      openModal(actionId);
    } else {
      openModal(actionId);
    }
  };

  const actions = [
    { id: 'kpi', label: 'KPI', emoji: '📊' },
    { id: 'voc', label: 'VOC', emoji: '📞' },
    { id: 'idea', label: '아이디어', emoji: '💡' },
    { id: 'note', label: '마음의 편지', emoji: '💌' },
    { id: 'gathering', label: '모임방', emoji: '🎉' },
  ];

  return (
    <div className="relative flex h-full flex-shrink-0">
      <div
        className={`flex flex-col border-r border-white/[.06] transition-all duration-200 ${collapsed ? 'w-0 overflow-hidden border-none' : 'w-[160px]'}`}
        style={{ background: 'rgba(42,31,40,.95)', backdropFilter: 'blur(12px)' }}
      >
        {!collapsed && (
          <div className="flex flex-1 flex-col justify-between p-3">
            {/* 현재 룸 표시 */}
            <div className="mb-2">
              <div
                className="rounded-lg px-3 py-1.5 text-center text-[11px] font-bold text-white"
                style={{ background: `${room.theme.main}44`, border: `1px solid ${room.theme.main}66` }}
              >
                <span>📍 {room.label}</span>
                {roomAlerts[currentRoom] && (
                  <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,.6)]" />
                )}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex flex-col gap-1">
              {actions.map((a) => {
                // zone alert 매핑: kpi → {myRoom}-kpi, note → 알림 없음
                const alertZoneId = a.id === 'kpi'
                  ? `${ROOMS_DATA[TEAM_TO_ROOM[profile?.team || ''] || 'stock'].id}-kpi`
                  : a.id;
                const hasAlert = !!zoneAlerts[alertZoneId];
                return (
                  <button
                    key={a.id}
                    onClick={() => handleAction(a.id)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[12px] font-semibold text-text-secondary transition-all duration-150 hover:bg-accent/15 hover:text-accent-light"
                  >
                    <span className="text-base">{a.emoji}</span>
                    {a.label}
                    {hasAlert && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,.6)]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* 룸 이동 바로가기 */}
            <div className="mt-2 flex flex-col gap-1 border-t border-white/[.06] pt-2">
              <div className="px-2 text-[10px] font-medium text-text-muted mb-1">룸 이동</div>
              {(Object.keys(ROOMS_DATA) as RoomId[]).filter(id => id !== currentRoom).map((id) => {
                const r = ROOMS_DATA[id];
                return (
                  <button
                    key={id}
                    onClick={() => enterRoom(id)}
                    className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-medium text-text-muted transition-all duration-150 hover:bg-white/[.06] hover:text-text-secondary"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: r.theme.main }} />
                    {r.label}
                    {roomAlerts[id] && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_4px_rgba(239,68,68,.6)]" />
                    )}
                  </button>
                );
              })}
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
