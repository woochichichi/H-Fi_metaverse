import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import MapCanvas from './MapCanvas';
import PlayerCharacter from './PlayerCharacter';
import OtherPlayers from './OtherPlayers';
import PlayerContextMenu from './PlayerContextMenu';
import RockPaperScissors from '../game/RockPaperScissors';
import { useRPS } from '../../hooks/useRPS';
import type { OtherPlayer } from '../../stores/metaverseStore';
// import NPCCharacter from './NPCCharacter';
import Zone from './Zone';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import ChatLog from './ChatLog';
import EmojiFloat from './EmojiFloat';
import BottomBar from './BottomBar';
import TouchDpad from './TouchDpad';
import usePlayerSync from '../../hooks/usePlayerSync';
import VocPanel from '../voc/VocPanel';
import IdeaPanel from '../idea/IdeaPanel';
import WorryPanel from '../worry/WorryPanel';
import NoticePanel from '../notice/NoticePanel';
import KpiPanel from '../kpi/KpiPanel';
import NotePanel from '../note/NotePanel';
import InboxPanel from '../inbox/InboxPanel';
import LobbyPanel from './LobbyPanel';
import GatheringPanel from '../gathering/GatheringPanel';
import OmokPanel from '../game/OmokPanel';
import ReactionPanel from '../game/ReactionPanel';
import JumpRopePanel from '../game/JumpRopePanel';
import FortunePanel from '../game/FortunePanel';
import LabModal from '../lab/LabModal';
import SiteReportPanel from './SiteReportPanel';
import FaqPanel from './FaqPanel';
import { useMetaverseStore } from '../../stores/metaverseStore';
import { useUiStore } from '../../stores/uiStore';
import { ROOMS_DATA, TEAM_ZONES } from '../../lib/constants';
import { getMapTimeTheme } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';
import { useZoneAlerts } from '../../hooks/useZoneAlerts';

// Zone ID → 패널 매핑 (v4: 팀별 zone ID를 기능별 패널로 매핑)
function getZonePanel(zoneId: string, userTeam: string | undefined): React.FC<{ onClose: () => void }> | null {
  if (zoneId === 'stock-lab') return null; // 연구실은 별도 모달로 처리
  if (zoneId === 'voc') return VocPanel;
  if (zoneId === 'idea') return IdeaPanel;
  if (zoneId === 'worry') return WorryPanel;
  if (zoneId.endsWith('-notice')) return ({ onClose }) => <NoticePanel onClose={onClose} />;
  if (zoneId.endsWith('-kpi')) return KpiPanel;
  if (zoneId.endsWith('-lobby')) {
    const zone = TEAM_ZONES.find((z) => z.id === zoneId);
    const lobbyTeam = zone?.team ?? userTeam ?? '';
    const readOnly = !!userTeam && lobbyTeam !== userTeam;
    return ({ onClose }) => <LobbyPanel onClose={onClose} team={lobbyTeam} readOnly={readOnly} />;
  }
  if (zoneId === 'inbox') return InboxPanel;
  if (zoneId === 'note') return NotePanel;
  if (zoneId === 'gathering') return GatheringPanel;
  if (zoneId === 'omok') return OmokPanel;
  if (zoneId === 'reaction') return ReactionPanel;
  if (zoneId === 'jumprope') return JumpRopePanel;
  if (zoneId === 'fortune') return FortunePanel;
  if (zoneId === 'site-report') return SiteReportPanel;
  if (zoneId === 'faq') return FaqPanel;
  return null;
}

// Zone 접근 권한 체크 (v4: 타 팀 KPI/공지 잠금)
function checkZoneAccess(zoneId: string, userTeam: string | undefined): { allowed: boolean; message?: string } {
  const zone = TEAM_ZONES.find((z) => z.id === zoneId);
  if (!zone) return { allowed: true }; // 공용 zone (voc, idea) 또는 old zone
  if (!userTeam) return { allowed: false, message: '팀 정보가 없습니다' };

  if (zone.team === userTeam) return { allowed: true };

  if (zoneId.endsWith('-kpi') || zoneId.endsWith('-notice')) {
    return { allowed: false, message: `🔒 이 공간은 [${zone.team}] 팀 전용입니다` };
  }

  return { allowed: true };
}

export default function MetaverseLayout() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const { playerPosition, currentRoom } = useMetaverseStore();
  const { modalOpen, closeModal, addToast } = useUiStore();
  const { profile } = useAuthStore();
  const mapTheme = useMemo(() => getMapTimeTheme(), []);
  const [isTouchDevice] = useState(() => 'ontouchstart' in window || navigator.maxTouchPoints > 0);
  usePlayerSync();

  // 연구실 모달 상태
  const [labOpen, setLabOpen] = useState(false);

  // stock-lab 존 클릭 감지 → 연구실 모달 열기
  useEffect(() => {
    if (modalOpen === 'stock-lab') {
      closeModal();
      setLabOpen(true);
    }
  }, [modalOpen, closeModal]);

  // 우클릭 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = useState<{
    player: OtherPlayer;
    x: number;
    y: number;
  } | null>(null);

  // 가위바위보 훅
  const { state: rpsState, requestDuel, acceptDuel, rejectDuel, makeChoice, getResult, reset: resetRPS } = useRPS();

  const handlePlayerRightClick = useCallback((player: OtherPlayer, clientX: number, clientY: number) => {
    setContextMenu({ player, x: clientX, y: clientY });
  }, []);

  const handleRequestDuel = useCallback((player: OtherPlayer) => {
    requestDuel({ userId: player.userId, name: player.name });
  }, [requestDuel]);
  const { zoneAlerts, checkAlerts, markZoneVisited, getRoomAlerts } = useZoneAlerts();

  // 초기 로드 + 방 이동 시 알림 체크
  useEffect(() => {
    if (profile?.id && profile?.team) {
      checkAlerts(profile.id, profile.team, profile.created_at);
    }
  }, [profile?.id, profile?.team, currentRoom, checkAlerts]);

  // 존 패널 열릴 때 방문 기록 갱신
  useEffect(() => {
    if (modalOpen && profile?.id) {
      markZoneVisited(profile.id, modalOpen);
    }
  }, [modalOpen, profile?.id, markZoneVisited]);

  const roomAlerts = getRoomAlerts();

  const room = ROOMS_DATA[currentRoom];
  const mapW = room.mapSize.w;
  const mapH = room.mapSize.h;

  const centerCamera = useCallback(() => {
    const container = containerRef.current;
    const viewport = viewportRef.current;
    if (!container || !viewport) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    let ox = cw / 2 - playerPosition.x - 17;
    let oy = ch / 2 - playerPosition.y - 22;

    ox = Math.min(0, Math.max(ox, cw - mapW));
    oy = Math.min(0, Math.max(oy, ch - mapH));

    viewport.style.transform = `translate(${ox}px, ${oy}px)`;
  }, [playerPosition, mapW, mapH]);

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

  const PanelComponent = useMemo(
    () => (modalOpen ? getZonePanel(modalOpen, profile?.team) : null),
    [modalOpen, profile?.team],
  );

  return (
    <div className="flex flex-1 overflow-hidden">
      <BottomBar roomAlerts={roomAlerts} zoneAlerts={zoneAlerts} />

      <div className="relative flex-1 flex flex-col overflow-hidden">
        <div ref={containerRef} className="relative flex-1 overflow-hidden" style={{ background: mapTheme.outerBg }}>
          <div ref={viewportRef} className="absolute" style={{ width: mapW, height: mapH, willChange: 'transform' }}>
            <MapCanvas roomAlerts={roomAlerts}>
              <Zone zoneAlerts={zoneAlerts} />
              {/* <NPCCharacter /> */}
              <ChatBubble />
              <OtherPlayers onPlayerRightClick={handlePlayerRightClick} />
              <PlayerCharacter />
              <EmojiFloat />
            </MapCanvas>
          </div>

          {!modalOpen && <ChatLog />}
          {!modalOpen && <ChatInput />}
          {isTouchDevice && !modalOpen && <TouchDpad />}

          {PanelComponent && (
            <>
              <div
                className="absolute inset-0 z-[100] bg-black/40"
                onClick={closeModal}
              />
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

      {/* 우클릭 컨텍스트 메뉴 */}
      {contextMenu && (
        <PlayerContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={[
            {
              label: '가위바위보 대결',
              icon: '✊',
              onClick: () => handleRequestDuel(contextMenu.player),
            },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* 연구실 모달 */}
      {labOpen && <LabModal onClose={() => setLabOpen(false)} />}

      {/* 가위바위보 모달 */}
      <RockPaperScissors
        state={rpsState}
        getResult={getResult}
        onAccept={acceptDuel}
        onReject={rejectDuel}
        onChoose={makeChoice}
        onClose={resetRPS}
      />
    </div>
  );
}
