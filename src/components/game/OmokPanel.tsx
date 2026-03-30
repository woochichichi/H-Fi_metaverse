import { useState } from 'react';
import { X, RotateCcw, User, Trophy } from 'lucide-react';
import { useOmokGame, BOARD_SIZE, type OmokPlayer } from '../../hooks/useOmokGame';
import { useOmokRanking } from '../../hooks/useOmokRanking';
import { useAuthStore } from '../../stores/authStore';

const CELL = 24;
const BOARD_PX = CELL * (BOARD_SIZE - 1) + CELL;

function StoneDot({ stone, isLast }: { stone: 1 | 2; isLast: boolean }) {
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
      <div className="mt-4 rounded-lg bg-white/[.04] p-4 text-xs text-text-muted leading-relaxed">
        <p>규칙: 흑돌과 백돌을 번갈아 놓아</p>
        <p>가로·세로·대각선으로 5개 연속 놓으면 승리!</p>
      </div>
    </div>
  );
}

function ResultCard({ iWon, opponent, onReset }: { iWon: boolean; opponent?: OmokPlayer; onReset: () => void }) {
  return (
    <div className="w-full rounded-xl border border-white/[.08] bg-white/[.04] p-4">
      <div className="mb-3 text-center text-lg font-bold">
        {iWon ? <span className="text-accent">승리!</span> : <span className="text-red-400">패배</span>}
      </div>
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
  const { board, status, currentTurn, myColor, players, winner, lastMove, makeMove, resetGame } = useOmokGame();
  const [tab, setTab] = useState<'game' | 'ranking'>('game');

  const myName = profile?.nickname || profile?.name || '나';
  const opponentName = players.find((p) => p.id !== profile?.id)?.name || '상대방';

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 + 탭 */}
      <div className="border-b border-white/[.06]">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="font-heading text-base font-bold text-text-primary">⚫ 오목</h2>
          <button
            onClick={onClose}
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
      ) : (
        <div className="flex flex-1 flex-col items-center gap-3 overflow-y-auto p-4">
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

          {/* 턴/결과 */}
          {status === 'finished' ? (
            <ResultCard
              iWon={winner === myColor}
              opponent={players.find((p) => p.id !== profile?.id)}
              onReset={resetGame}
            />
          ) : (
            <div className="text-sm font-medium">
              <span className={currentTurn === myColor ? 'text-green-400' : 'text-text-muted'}>
                {currentTurn === myColor ? '내 차례' : `${opponentName} 차례`}
                {currentTurn === 1 ? ' (흑)' : ' (백)'}
              </span>
            </div>
          )}

          {/* 오목판 */}
          <div className="relative rounded" style={{ width: BOARD_PX, height: BOARD_PX, background: '#DEB887', boxShadow: '0 2px 8px rgba(0,0,0,.3)' }}>
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
              row.map((cell, c) => (
                <div key={`${r}-${c}`} className="absolute cursor-pointer" style={{ left: c * CELL, top: r * CELL, width: CELL, height: CELL }} onClick={() => makeMove(r, c)}>
                  {cell !== 0 && <StoneDot stone={cell} isLast={lastMove?.row === r && lastMove?.col === c} />}
                </div>
              )),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
