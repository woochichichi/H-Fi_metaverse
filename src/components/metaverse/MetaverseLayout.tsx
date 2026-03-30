import { useRef, useEffect, useCallback } from 'react';
import MapCanvas from './MapCanvas';
import PlayerCharacter from './PlayerCharacter';
import NPCCharacter from './NPCCharacter';
import Zone from './Zone';
import ChatBubble from './ChatBubble';
import EmojiFloat from './EmojiFloat';
import BottomBar from './BottomBar';
import VocPanel from '../voc/VocPanel';
import IdeaPanel from '../idea/IdeaPanel';
import NoticePanel from '../notice/NoticePanel';
import KpiPanel from '../kpi/KpiPanel';
import NotePanel from '../note/NotePanel';
import LoungePanel from './LoungePanel';
import MoodPanel from './MoodPanel';
import { useMetaverseStore } from '../../stores/metaverseStore';
import { useUiStore } from '../../stores/uiStore';
import { MAP_WIDTH, MAP_HEIGHT, TEAM_ZONES } from '../../lib/constants';
import { useAuthStore } from '../../stores/authStore';
import { X } from 'lucide-react';

// mood 전용 래퍼 (마음의소리 Zone에서 바로 패널 열 때)
function MoodPanelWrapper({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3">
        <h2 className="font-heading text-base font-bold text-text-primary">💭 마음의소리</h2>
        <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/[.08] hover:text-text-primary">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <MoodPanel />
      </div>
    </div>
  );
}

// Zone ID → 패널 매핑 (v4: 팀별 zone ID를 기능별 패널로 매핑)
function getZonePanel(zoneId: string): React.FC<{ onClose: () => void }> | null {
  if (zoneId === 'voc') return VocPanel;
  if (zoneId === 'idea') return IdeaPanel;
  if (zoneId.endsWith('-notice')) return ({ onClose }) => <NoticePanel onClose={onClose} />;
  if (zoneId.endsWith('-kpi')) return KpiPanel;
  if (zoneId.endsWith('-lobby')) return MoodPanelWrapper;
  if (zoneId === 'note') return NotePanel;
  if (zoneId === 'lounge') return LoungePanel;
  if (zoneId === 'mood') return MoodPanelWrapper;
  return null;
}

// Zone 접근 권한 체크 (v4: 타 팀 KPI/공지 잠금)
function checkZoneAccess(zoneId: string, userTeam: string | undefined): { allowed: boolean; message?: string } {
  const zone = TEAM_ZONES.find((z) => z.id === zoneId);
  if (!zone) return { allowed: true }; // 공용 zone (voc, idea) 또는 old zone
  if (!userTeam) return { allowed: false, message: '팀 정보가 없습니다' };

  // 같은 팀이면 허용
  if (zone.team === userTeam) return { allowed: true };

  // 타 팀 KPI/공지 → 잠금
  if (zoneId.endsWith('-kpi') || zoneId.endsWith('-notice')) {
    return { allowed: false, message: `🔒 이 공간은 [${zone.team}] 팀 전용입니다` };
  }

  // 타 팀 로비 → 읽기 전용으로 허용
  return { allowed: true };
}

export default function MetaverseLayout() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const { playerPosition } = useMetaverseStore();
  const { modalOpen, closeModal, addToast } = useUiStore();
  const { profile } = useAuthStore();

  const centerCamera = useCallback(() => {
    const container = containerRef.current;
    const viewport = viewportRef.current;
    if (!container || !viewport) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    let ox = cw / 2 - playerPosition.x - 17;
    let oy = ch / 2 - playerPosition.y - 22;

    // 맵 가장자리에서 카메라 고정 (빈 공간 노출 방지)
    ox = Math.min(0, Math.max(ox, cw - MAP_WIDTH));
    oy = Math.min(0, Math.max(oy, ch - MAP_HEIGHT));

    viewport.style.transform = `translate(${ox}px, ${oy}px)`;
  }, [playerPosition]);

  useEffect(() => {
    centerCamera();
  }, [centerCamera]);

  useEffect(() => {
    window.addEventListener('resize', centerCamera);
    return () => window.removeEventListener('resize', centerCamera);
  }, [centerCamera]);

  // ESC 키로 패널 닫기
  useEffect(() => {
    if (!modalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen, closeModal]);

  // v4: 타 팀 Zone 접근 시 잠금
  useEffect(() => {
    if (!modalOpen) return;
    const access = checkZoneAccess(modalOpen, profile?.team);
    if (!access.allowed) {
      closeModal();
      if (access.message) addToast(access.message, 'error');
    }
  }, [modalOpen, profile?.team, closeModal, addToast]);

  // 현재 열린 패널 컴포넌트 결정
  const PanelComponent = modalOpen ? getZonePanel(modalOpen) : null;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* 좌측 메뉴 패널 */}
      <BottomBar />

      {/* 맵 컨테이너 */}
      <div className="relative flex-1 flex flex-col overflow-hidden">
        <div ref={containerRef} className="relative flex-1 overflow-hidden" style={{ background: '#6b8f71' }}>
          <div ref={viewportRef} className="absolute" style={{ width: MAP_WIDTH, height: MAP_HEIGHT }}>
            <MapCanvas>
              <Zone />
              <NPCCharacter />
              <ChatBubble />
              <PlayerCharacter />
              <EmojiFloat />
            </MapCanvas>
          </div>

          {/* Zone 패널 슬라이드 */}
          {PanelComponent && (
            <>
              {/* 백드롭 */}
              <div
                className="absolute inset-0 z-[100] bg-black/40"
                onClick={closeModal}
              />
              {/* 슬라이드 패널 */}
              <div
                className="absolute right-0 top-0 z-[101] flex h-full w-full max-w-md flex-col bg-bg-primary shadow-2xl animate-[slideInRight_.25s_ease-out]"
                style={{ borderLeft: '1px solid rgba(255,255,255,.06)' }}
              >
                <PanelComponent onClose={closeModal} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
