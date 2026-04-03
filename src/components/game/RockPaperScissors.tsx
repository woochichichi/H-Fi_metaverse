import { createPortal } from 'react-dom';
import type { RPSChoice, RPSState } from '../../hooks/useRPS';

// ── 이모지 매핑 ──────────────────────────────────────────
const CHOICE_EMOJI: Record<RPSChoice, string> = {
  rock: '✊',
  paper: '✋',
  scissors: '✌️',
};
const CHOICE_LABEL: Record<RPSChoice, string> = {
  rock: '바위',
  paper: '보',
  scissors: '가위',
};
const CHOICES: RPSChoice[] = ['rock', 'scissors', 'paper'];

// ── 하위 UI 컴포넌트 ────────────────────────────────────

function Backdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {children}
    </div>
  );
}

function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative w-[340px] rounded-2xl p-6 shadow-2xl"
      style={{
        background: 'rgba(18, 18, 30, 0.97)',
        border: '1px solid rgba(255,255,255,0.1)',
        animation: 'fadeIn .2s ease-out',
      }}
    >
      {children}
    </div>
  );
}

// ── 요청 대기 화면 ───────────────────────────────────────
function RequestingScreen({ opponent }: { opponent: { name: string } }) {
  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="text-4xl animate-pulse">⚔️</div>
      <p className="text-white/90 font-semibold text-[15px] text-center">
        <span className="text-yellow-400">{opponent.name}</span>님에게<br />
        대결 신청 중…
      </p>
      <p className="text-white/40 text-[12px]">상대방의 수락을 기다리는 중입니다</p>
    </div>
  );
}

// ── 수락 요청 팝업 ───────────────────────────────────────
function IncomingRequestScreen({
  requester,
  onAccept,
  onReject,
}: {
  requester: { name: string };
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="text-4xl">⚔️</div>
      <p className="text-white/90 font-semibold text-[15px] text-center">
        <span className="text-yellow-400">{requester.name}</span>님이<br />
        가위바위보 대결을 신청했습니다.<br />
        수락하시겠습니까?
      </p>
      <p className="text-white/35 text-[11px]">60초 내 미응답 시 자동 취소</p>
      <div className="flex gap-3 w-full">
        <button
          className="flex-1 rounded-xl py-2.5 text-[14px] font-bold text-white transition-colors"
          style={{ background: 'rgba(108,92,231,.85)' }}
          onClick={onAccept}
        >
          수락
        </button>
        <button
          className="flex-1 rounded-xl py-2.5 text-[14px] font-bold text-white/70 transition-colors hover:bg-white/10"
          style={{ background: 'rgba(255,255,255,0.07)' }}
          onClick={onReject}
        >
          거절
        </button>
      </div>
    </div>
  );
}

// ── 카운트다운 화면 ───────────────────────────────────────
function CountdownScreen({ countdown, opponent }: { countdown: number; opponent: { name: string } }) {
  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <p className="text-white/60 text-[13px]">
        <span className="text-white font-semibold">{opponent.name}</span>님과 대결!
      </p>
      <div
        key={countdown}
        className="text-[80px] font-black leading-none"
        style={{
          color: countdown <= 2 ? '#FF6B6B' : '#6C5CE7',
          animation: 'scaleIn .35s ease-out',
          textShadow: `0 0 40px ${countdown <= 2 ? 'rgba(255,107,107,.5)' : 'rgba(108,92,231,.5)'}`,
        }}
      >
        {countdown}
      </div>
      <p className="text-white/40 text-[12px]">곧 가위바위보를 선택합니다!</p>
    </div>
  );
}

// ── 선택 화면 ─────────────────────────────────────────────
function ChoosingScreen({
  myChoice,
  onChoose,
}: {
  myChoice: RPSChoice | null;
  onChoose: (c: RPSChoice) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <p className="text-white/90 font-bold text-[15px]">선택하세요! (5초)</p>
      <div className="flex gap-3">
        {CHOICES.map((c) => (
          <button
            key={c}
            disabled={!!myChoice}
            className="flex flex-col items-center gap-1 rounded-2xl px-4 py-4 text-4xl transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: myChoice === c ? 'rgba(108,92,231,.6)' : 'rgba(255,255,255,0.07)',
              border: myChoice === c ? '2px solid rgba(108,92,231,.8)' : '2px solid rgba(255,255,255,0.1)',
              transform: myChoice === c ? 'scale(1.08)' : undefined,
            }}
            onClick={() => onChoose(c)}
          >
            <span>{CHOICE_EMOJI[c]}</span>
            <span className="text-[11px] text-white/70 font-semibold">{CHOICE_LABEL[c]}</span>
          </button>
        ))}
      </div>
      {myChoice && (
        <p className="text-white/50 text-[12px]">선택 완료! 상대방을 기다리는 중…</p>
      )}
    </div>
  );
}

// ── 결과 화면 ─────────────────────────────────────────────
function ResultScreen({
  myChoice,
  opponentChoice,
  opponentName,
  result,
  onClose,
}: {
  myChoice: RPSChoice | null;
  opponentChoice: RPSChoice | null;
  opponentName: string;
  result: 'win' | 'lose' | 'draw' | null;
  onClose: () => void;
}) {
  const mine = myChoice ?? 'rock';
  const theirs = opponentChoice ?? 'rock';

  const resultConfig = {
    win:  { label: '승리! 🎉', color: '#00D68F', bg: 'rgba(0,214,143,0.15)' },
    lose: { label: '패배 😢',  color: '#FF6B6B', bg: 'rgba(255,107,107,0.15)' },
    draw: { label: '무승부 🤝', color: '#FFA500', bg: 'rgba(255,165,0,0.15)' },
  };
  const cfg = result ? resultConfig[result] : resultConfig.draw;

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div
        className="w-full rounded-xl py-3 text-center text-[18px] font-black"
        style={{ color: cfg.color, background: cfg.bg }}
      >
        {cfg.label}
      </div>
      <div className="flex items-center gap-6 mt-1">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[48px]">{CHOICE_EMOJI[mine]}</span>
          <span className="text-[11px] text-white/60">나 ({CHOICE_LABEL[mine]})</span>
        </div>
        <span className="text-white/30 text-xl font-bold">vs</span>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[48px]">{CHOICE_EMOJI[theirs]}</span>
          <span className="text-[11px] text-white/60">{opponentName} ({CHOICE_LABEL[theirs]})</span>
        </div>
      </div>
      <button
        className="mt-2 w-full rounded-xl py-2.5 text-[14px] font-bold text-white transition-colors hover:opacity-90"
        style={{ background: 'rgba(108,92,231,.8)' }}
        onClick={onClose}
      >
        닫기
      </button>
    </div>
  );
}

// ── 메인 모달 컴포넌트 ────────────────────────────────────
interface RockPaperScissorsProps {
  state: RPSState;
  getResult: () => 'win' | 'lose' | 'draw' | null;
  onAccept: () => void;
  onReject: () => void;
  onChoose: (c: RPSChoice) => void;
  onClose: () => void;
}

export default function RockPaperScissors({
  state,
  getResult,
  onAccept,
  onReject,
  onChoose,
  onClose,
}: RockPaperScissorsProps) {
  const { gameState, opponent, myChoice, opponentChoice, countdown, incomingRequest } = state;

  // 수락 대기 팝업 (게임과 독립적으로 표시)
  if (incomingRequest && gameState === 'idle') {
    return createPortal(
      <Backdrop>
        <Modal>
          <IncomingRequestScreen
            requester={incomingRequest}
            onAccept={onAccept}
            onReject={onReject}
          />
        </Modal>
      </Backdrop>,
      document.body,
    );
  }

  if (gameState === 'idle') return null;

  return createPortal(
    <Backdrop>
      <Modal>
        {gameState === 'requested' && opponent && (
          <RequestingScreen opponent={opponent} />
        )}
        {gameState === 'countdown' && opponent && (
          <CountdownScreen countdown={countdown} opponent={opponent} />
        )}
        {gameState === 'choosing' && (
          <ChoosingScreen myChoice={myChoice} onChoose={onChoose} />
        )}
        {gameState === 'result' && opponent && (
          <ResultScreen
            myChoice={myChoice}
            opponentChoice={opponentChoice}
            opponentName={opponent.name}
            result={getResult()}
            onClose={onClose}
          />
        )}
      </Modal>
    </Backdrop>,
    document.body,
  );
}
