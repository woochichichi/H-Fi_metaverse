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
import { MAP_WIDTH, MAP_HEIGHT } from '../../lib/constants';
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

// Zone ID → 패널 매핑
const ZONE_PANELS: Record<string, React.FC<{ onClose: () => void }>> = {
  voc: VocPanel,
  idea: IdeaPanel,
  notice: ({ onClose }) => <NoticePanel onClose={onClose} />,
  kpi: KpiPanel,
  note: NotePanel,
  lounge: LoungePanel,
  mood: MoodPanelWrapper,
};

export default function MetaverseLayout() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const { playerPosition } = useMetaverseStore();
  const { modalOpen, closeModal } = useUiStore();

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

  // 현재 열린 패널 컴포넌트 결정
  const PanelComponent = modalOpen ? ZONE_PANELS[modalOpen] : null;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* 맵 컨테이너 */}
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

        {/* 좌측 메뉴 패널 */}
        <BottomBar />

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
  );
}
