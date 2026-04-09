import { useState, useRef, useEffect } from 'react';
import { X, RotateCcw, User, Trophy, Clock, Send, Flag, SmilePlus } from 'lucide-react';
import { useOmokGame, BOARD_SIZE, type OmokPlayer, type ChatMessage, type FloatingEmoji } from '../../hooks/useOmokGame';
import { useOmokRanking } from '../../hooks/useOmokRanking';
import { useAuthStore } from '../../stores/authStore';
import { isForbidden } from '../../lib/renju';

const CELL = 24;
const BOARD_PX = CELL * (BOARD_SIZE - 1) + CELL;

const EMOTE_LIST = [
  { emoji: '⏰', label: '빨리하세요' },
  { emoji: '😴', label: '졸려요' },
  { emoji: '🤔', label: '흠...' },
  { emoji: '😎', label: '여유~' },
  { emoji: '🔥', label: '불타오르네' },
  { emoji: '😱', label: '헉!' },
  { emoji: '👏', label: '좋은수!' },
  { emoji: '🙏', label: '살려주세요' },
];

/* ---------- 착수 이펙트용 CSS keyframes (inline style) ---------- */
const rippleKeyframes = `
@keyframes omok-ripple {
  0% { transform: translate(-50%,-50%) scale(0.3); opacity: 0.8; }
  100% { transform: translate(-50%,-50%) scale(2.5); opacity: 0; }
}
@keyframes omok-pop {
  0% { transform: scale(0.4); opacity: 0; }
  50% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes omok-float-up {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-80px) scale(1.5); opacity: 0; }
}
`;

function StoneDot({ stone, isLast, isNew }: { stone: 1 | 2; isLast: boolean; isNew?: boolean }) {
  return (
    <div
      className="absolute rounded-full"
      style={{
        width: CELL - 4, height: CELL - 4, top: 2, left: 2,
        background: stone === 1
          ? 'radial-gradient(circle at 35% 35%, #555, #111)'
          : 'radial-gradient(circle at 35% 35%, #fff, #ddd)',
        border: stone === 1 ? '1px solid #000' : '1px solid #bbb',
        boxShadow: stone === 1 ? '1px 1px 2px rgba(0,0,0,.5)' : '1px 1px 2px rgba(0,0,0,.2)',
        animation: isNew ? 'omok-pop 0.3s ease-out' : undefined,
      }}
    >
      {isLast && (
        <div className="absolute rounded-full" style={{
          width: 6, height: 6, top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          background: stone === 1 ? '#fff' : '#e74c3c',
        }} />
      )}
    </div>
  );
}

function GhostStone({ color }: { color: 1 | 2 }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: CELL - 4, height: CELL - 4, top: 2, left: 2,
        background: color === 1
          ? 'radial-gradient(circle at 35% 35%, #555, #111)'
          : 'radial-gradient(circle at 35% 35%, #fff, #ddd)',
        border: color === 1 ? '1px solid rgba(0,0,0,0.3)' : '1px solid rgba(187,187,187,0.3)',
        opacity: 0.4,
      }}
    />
  );
}

function RippleEffect({ stone }: { stone: 1 | 2 }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: CELL, height: CELL,
        top: '50%', left: '50%',
        border: `2px solid ${stone === 1 ? 'rgba(255,255,255,0.6)' : 'rgba(231,76,60,0.6)'}`,
        animation: 'omok-ripple 0.6s ease-out forwards',
      }}
    />
  );
}

function Timer({ timeLeft, isMyTurn, turnTime }: { timeLeft: number; isMyTurn: boolean; turnTime: number }) {
  const urgent = timeLeft <= 10;
  const pct = (timeLeft / turnTime) * 100;

  return (
    <div className="flex w-full items-center gap-2">
      <Clock size={14} className={urgent ? 'text-red-400' : 'text-text-muted'} />
      <div className="flex-1 rounded-full bg-white/[.08] h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 linear ${
            urgent ? 'bg-red-400' : isMyTurn ? 'bg-accent' : 'bg-text-muted/50'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-mono font-semibold min-w-[2rem] text-right ${
        urgent ? 'text-red-400 animate-pulse' : 'text-text-secondary'
      }`}>
        {timeLeft}s
      </span>
    </div>
  );
}

function CountdownScreen({ countdown, players, myColor, profile }: {
  countdown: number;
  players: OmokPlayer[];
  myColor: 1 | 2 | null;
  profile: { id: string } | null;
}) {
  const opponent = players.find((p) => p.id !== profile?.id);
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <div className="text-5xl">⚫</div>
      <h3 className="font-heading text-lg font-bold text-text-primary">곧 시작합니다!</h3>
      <div className="flex items-center gap-4 text-sm text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: myColor === 1 ? '#222' : '#eee', border: '1px solid #888' }} />
          나 {myColor === 1 ? '(흑·선공)' : '(백)'}
        </span>
        <span className="text-text-muted">vs</span>
        <span className="flex items-center gap-1.5">
          {opponent?.realName || '상대방'} {myColor === 2 ? '(흑·선공)' : '(백)'}
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: myColor === 2 ? '#222' : '#eee', border: '1px solid #888' }} />
        </span>
      </div>
      <div className="mt-2 flex h-20 w-20 items-center justify-center rounded-full bg-accent/20">
        <span className="text-4xl font-bold text-accent">{countdown}</span>
      </div>
      <p className="text-xs text-text-muted">준비하세요!</p>
    </div>
  );
}

function WaitingScreen({ playerCount }: { playerCount: number }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <div className="text-5xl">⚫</div>
      <h3 className="font-heading text-lg font-bold text-text-primary">오목 게임방</h3>
      <p className="text-sm text-text-secondary text-center">상대방이 입장하면 게임이 시작됩니다</p>
      <div className="flex items-center gap-2 rounded-lg bg-white/[.06] px-4 py-2">
        <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
        <span className="text-sm text-text-secondary">대기 중... ({playerCount}/2명)</span>
      </div>
      <div className="mt-4 rounded-lg bg-white/[.04] p-4 text-xs text-text-muted leading-relaxed space-y-1">
        <p>흑돌 선공, 번갈아 착수 (턴당 60초)</p>
        <p>5목 연속 놓으면 승리! (렌주룰 적용)</p>
        <p className="text-red-400/70">흑 금수: 장목(6+) / 삼삼(3-3) / 사사(4-4)</p>
      </div>
    </div>
  );
}

function ResultCard({ iWon, opponent, reason, onReset }: {
  iWon: boolean; opponent?: OmokPlayer; reason?: string; onReset: () => void;
}) {
  return (
    <div className="w-full rounded-xl border border-white/[.08] bg-white/[.04] p-4">
      <div className="mb-1 text-center text-lg font-bold">
        {iWon ? <span className="text-accent">승리!</span> : <span className="text-red-400">패배</span>}
      </div>
      {reason && (
        <p className="mb-3 text-center text-xs text-text-muted">{reason}</p>
      )}
      {opponent && (
        <div className="mb-3 rounded-lg bg-white/[.06] p-3">
          <p className="mb-1 text-xs text-text-muted">상대방</p>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20">
              <User size={16} className="text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{opponent.realName}</p>
              <p className="text-xs text-text-muted">{opponent.team}</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-text-muted">
            사내 메신저에서 "{opponent.realName}" 검색해서 한마디 건네보세요!
          </p>
        </div>
      )}
      <button
        onClick={onReset}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent/20 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/30"
      >
        <RotateCcw size={14} />
        다시 하기
      </button>
    </div>
  );
}

function ChatBox({ messages, onSend, myColor }: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  myColor: 1 | 2 | null;
}) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className="w-full rounded-lg border border-white/[.06] bg-white/[.03] overflow-hidden">
      <div
        ref={scrollRef}
        className="h-20 overflow-y-auto px-2 py-1.5 space-y-0.5"
      >
        {messages.length === 0 && (
          <p className="text-[10px] text-text-muted/50 text-center pt-5">채팅으로 대화하세요</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`text-[11px] leading-tight ${m.senderColor === myColor ? 'text-accent' : 'text-text-secondary'}`}>
            <span className="font-semibold">{m.sender}</span>
            <span className="text-text-muted mx-1">:</span>
            <span>{m.text}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 border-t border-white/[.06] px-2 py-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="메시지..."
          maxLength={100}
          className="flex-1 bg-transparent text-xs text-text-primary placeholder-text-muted/40 outline-none"
        />
        <button
          onClick={handleSend}
          className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:text-accent transition-colors"
        >
          <Send size={12} />
        </button>
      </div>
    </div>
  );
}

function EmoteBar({ onEmote, show, onToggle }: {
  onEmote: (emoji: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs text-text-muted hover:bg-white/[.06] hover:text-text-secondary transition-colors"
      >
        <SmilePlus size={14} />
        이모지
      </button>
      {show && (
        <div className="absolute bottom-full left-0 mb-1 flex flex-wrap gap-1 rounded-lg bg-surface-overlay border border-white/[.1] p-2 shadow-lg z-10" style={{ width: 220 }}>
          {EMOTE_LIST.map((e) => (
            <button
              key={e.emoji}
              onClick={() => { onEmote(e.emoji); onToggle(); }}
              className="flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 hover:bg-white/[.08] transition-colors"
              title={e.label}
            >
              <span className="text-lg">{e.emoji}</span>
              <span className="text-[9px] text-text-muted">{e.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FloatingEmojis({ emojis }: { emojis: FloatingEmoji[] }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {emojis.map((e) => (
        <div
          key={e.id}
          className="absolute"
          style={{
            left: e.senderColor === 1 ? '20%' : '70%',
            bottom: '10%',
            animation: 'omok-float-up 3s ease-out forwards',
            fontSize: 32,
          }}
        >
          {e.emoji}
        </div>
      ))}
    </div>
  );
}

const MEDAL = ['🥇', '🥈', '🥉'];

function RankingTab() {
  const { ranking, loading } = useOmokRanking();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <span className="text-sm text-text-muted">로딩 중...</span>
      </div>
    );
  }

  if (ranking.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
        <Trophy size={32} className="text-text-muted" />
        <p className="text-sm text-text-muted">아직 전적이 없습니다</p>
        <p className="text-xs text-text-muted">게임을 플레이하면 랭킹에 등록됩니다!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-2">
        {ranking.map((r, i) => (
          <div
            key={r.id}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
              i < 3 ? 'bg-white/[.06]' : 'bg-white/[.02]'
            }`}
          >
            <span className="w-7 text-center text-sm font-bold">
              {i < 3 ? MEDAL[i] : `${i + 1}`}
            </span>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">
                {r.nickname || r.name}
              </p>
              <p className="text-xs text-text-muted">{r.team}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono font-semibold text-text-primary">
                {r.wins}승 {r.losses}패
              </p>
              <p className="text-xs font-mono text-text-muted">
                승률 {r.win_rate}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OmokPanel({ onClose }: { onClose: () => void }) {
  const { profile } = useAuthStore();
  const {
    board, status, currentTurn, myColor, players, winner, winReason, lastMove, placedMove,
    timeLeft, countdown, forbiddenCells, chatMessages, floatingEmojis,
    makeMove, resetGame, forfeit, sendChat, sendEmote, TURN_TIME,
  } = useOmokGame();
  const [tab, setTab] = useState<'game' | 'ranking'>('game');
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);
  const [showEmoteBar, setShowEmoteBar] = useState(false);

  const myName = profile?.nickname || profile?.name || '나';
  const opponentName = players.find((p) => p.id !== profile?.id)?.name || '상대방';
  const isMyTurn = currentTurn === myColor;
  const isInGame = status === 'playing' || status === 'countdown';

  const handleClose = () => {
    if (isInGame) {
      if (window.confirm('게임이 진행 중입니다. 나가면 패배 처리됩니다.\n정말 나가시겠습니까?')) {
        if (status === 'playing') forfeit();
        onClose();
      }
    } else {
      onClose();
    }
  };

  // 호버 시 금수 여부 체크
  const isHoverForbidden = hoverCell && myColor === 1 && board[hoverCell.row]?.[hoverCell.col] === 0
    ? isForbidden(board, hoverCell.row, hoverCell.col)
    : false;

  return (
    <div className="flex h-full flex-col relative">
      {/* keyframes injection */}
      <style>{rippleKeyframes}</style>

      {/* 플로팅 이모지 */}
      <FloatingEmojis emojis={floatingEmojis} />

      {/* 헤더 + 탭 */}
      <div className="border-b border-white/[.06]">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="font-heading text-base font-bold text-text-primary">⚫ 오목</h2>
          <button
            onClick={handleClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/[.08] hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex px-4 gap-1 pb-2">
          {(['game', 'ranking'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === t
                  ? 'bg-accent/20 text-accent'
                  : 'text-text-muted hover:bg-white/[.06] hover:text-text-secondary'
              }`}
            >
              {t === 'game' ? '게임' : <>
                <Trophy size={12} />
                랭킹
              </>}
            </button>
          ))}
        </div>
      </div>

      {tab === 'ranking' ? (
        <RankingTab />
      ) : status === 'waiting' ? (
        <WaitingScreen playerCount={players.length} />
      ) : status === 'countdown' ? (
        <CountdownScreen countdown={countdown} players={players} myColor={myColor} profile={profile} />
      ) : (
        <div className="flex flex-1 flex-col items-center gap-2 overflow-y-auto p-3">
          {/* 플레이어 정보 */}
          <div className="flex w-full items-center justify-between rounded-lg bg-white/[.06] px-3 py-2 text-sm">
            <span className={`flex items-center gap-1.5 ${myColor === 1 ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: myColor === 1 ? '#222' : '#eee', border: '1px solid #888' }} />
              {myName}{myColor === 1 ? ' (흑)' : ' (백)'}
            </span>
            <span className={`flex items-center gap-1.5 ${myColor === 2 ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>
              {opponentName}{myColor === 2 ? ' (흑)' : ' (백)'}
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: myColor === 2 ? '#222' : '#eee', border: '1px solid #888' }} />
            </span>
          </div>

          {/* 타이머 */}
          {status === 'playing' && !winner && (
            <Timer timeLeft={timeLeft} isMyTurn={isMyTurn} turnTime={TURN_TIME} />
          )}

          {/* 턴/결과 */}
          {status === 'finished' ? (
            <ResultCard
              iWon={winner === myColor}
              opponent={players.find((p) => p.id !== profile?.id)}
              reason={winReason}
              onReset={resetGame}
            />
          ) : (
            <div className="text-sm font-medium">
              <span className={isMyTurn ? 'text-green-400' : 'text-text-muted'}>
                {isMyTurn ? '내 차례' : `${opponentName} 차례`}
                {currentTurn === 1 ? ' (흑)' : ' (백)'}
              </span>
            </div>
          )}

          {/* 오목판 */}
          <div
            className="relative rounded"
            style={{ width: BOARD_PX, height: BOARD_PX, background: '#DEB887', boxShadow: '0 2px 8px rgba(0,0,0,.3)' }}
            onMouseLeave={() => setHoverCell(null)}
          >
            <svg className="absolute" width={BOARD_PX} height={BOARD_PX} style={{ top: 0, left: 0 }}>
              {Array.from({ length: BOARD_SIZE }).map((_, i) => (
                <g key={i}>
                  <line x1={CELL / 2} y1={CELL / 2 + i * CELL} x2={BOARD_PX - CELL / 2} y2={CELL / 2 + i * CELL} stroke="#8B6914" strokeWidth={1} />
                  <line x1={CELL / 2 + i * CELL} y1={CELL / 2} x2={CELL / 2 + i * CELL} y2={BOARD_PX - CELL / 2} stroke="#8B6914" strokeWidth={1} />
                </g>
              ))}
              {[3, 7, 11].map((r) =>
                [3, 7, 11].map((c) => (
                  <circle key={`${r}-${c}`} cx={CELL / 2 + c * CELL} cy={CELL / 2 + r * CELL} r={3} fill="#8B6914" />
                )),
              )}
            </svg>
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isPlaced = placedMove?.row === r && placedMove?.col === c;
                const isHover = hoverCell?.row === r && hoverCell?.col === c;
                const showGhost = isHover && cell === 0 && status === 'playing' && isMyTurn && myColor != null
                  && !(myColor === 1 && forbiddenCells?.[r]?.[c]);

                return (
                  <div
                    key={`${r}-${c}`}
                    className="absolute cursor-pointer"
                    style={{ left: c * CELL, top: r * CELL, width: CELL, height: CELL }}
                    onClick={() => makeMove(r, c)}
                    onMouseEnter={() => setHoverCell({ row: r, col: c })}
                  >
                    {cell !== 0 && (
                      <StoneDot stone={cell} isLast={lastMove?.row === r && lastMove?.col === c} isNew={isPlaced} />
                    )}
                    {/* 착수 리플 이펙트 */}
                    {isPlaced && cell !== 0 && <RippleEffect stone={cell} />}
                    {/* 고스트 스톤 (미리보기) */}
                    {showGhost && <GhostStone color={myColor!} />}
                    {/* 금수 표시 (흑 차례 + 빈칸) */}
                    {cell === 0 && forbiddenCells?.[r]?.[c] && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-[9px] font-bold text-red-500/70 select-none">X</span>
                      </div>
                    )}
                  </div>
                );
              }),
            )}
          </div>

          {/* 렌주룰 안내 + 호버 금수 경고 */}
          {currentTurn === 1 && status === 'playing' && (
            <p className="text-[10px] text-red-400/60">
              {isHoverForbidden
                ? '금수 위치입니다! (착수 불가)'
                : '렌주룰: 흑 금수 (장목/삼삼/사사) 위치에 X 표시'}
            </p>
          )}

          {/* 기권 버튼 */}
          {status === 'playing' && !winner && (
            <div className="flex w-full items-center gap-2">
              {!showForfeitConfirm ? (
                <button
                  onClick={() => setShowForfeitConfirm(true)}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-red-400/70 hover:bg-red-400/10 transition-colors"
                >
                  <Flag size={12} />
                  기권
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-lg bg-red-400/10 px-3 py-1.5">
                  <span className="text-xs text-red-400">정말 기권하시겠습니까?</span>
                  <button
                    onClick={() => { forfeit(); setShowForfeitConfirm(false); }}
                    className="rounded bg-red-500 px-2 py-0.5 text-xs font-semibold text-white hover:bg-red-600"
                  >
                    확인
                  </button>
                  <button
                    onClick={() => setShowForfeitConfirm(false)}
                    className="rounded bg-white/[.1] px-2 py-0.5 text-xs text-text-secondary hover:bg-white/[.15]"
                  >
                    취소
                  </button>
                </div>
              )}
              <div className="flex-1" />
              <EmoteBar
                onEmote={sendEmote}
                show={showEmoteBar}
                onToggle={() => setShowEmoteBar(!showEmoteBar)}
              />
            </div>
          )}

          {/* 채팅 */}
          {(status === 'playing' || status === 'finished') && (
            <ChatBox messages={chatMessages} onSend={sendChat} myColor={myColor} />
          )}
        </div>
      )}
    </div>
  );
}
