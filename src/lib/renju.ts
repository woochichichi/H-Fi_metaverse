/**
 * 렌주룰 (Renju) 금수 판정
 * - 흑(1)에만 적용: 장목(6+), 삼삼(3-3), 사사(4-4)
 * - 정확히 5목은 항상 허용 (금수 아님)
 * - 백(2)은 제한 없음 (5+ 모두 승리)
 */

type Stone = 0 | 1 | 2;
const BOARD_SIZE = 15;
const DIRS: [number, number][] = [[0, 1], [1, 0], [1, 1], [1, -1]];

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

/** 한 방향으로 연속된 같은 돌 개수 (시작점 제외) */
function countDir(b: Stone[][], r: number, c: number, stone: Stone, dr: number, dc: number): number {
  let count = 0;
  let nr = r + dr, nc = c + dc;
  while (inBounds(nr, nc) && b[nr][nc] === stone) {
    count++;
    nr += dr;
    nc += dc;
  }
  return count;
}

/** (r,c) 포함 양방향 연속 돌 수 */
function lineLen(b: Stone[][], r: number, c: number, stone: Stone, dr: number, dc: number): number {
  return 1 + countDir(b, r, c, stone, dr, dc) + countDir(b, r, c, stone, -dr, -dc);
}

/** 정확히 5목이 있는지 */
function hasExactFive(b: Stone[][], r: number, c: number, stone: Stone): boolean {
  return DIRS.some(([dr, dc]) => lineLen(b, r, c, stone, dr, dc) === 5);
}

/** 장목(6+)이 있는지 */
function hasOverline(b: Stone[][], r: number, c: number, stone: Stone): boolean {
  return DIRS.some(([dr, dc]) => lineLen(b, r, c, stone, dr, dc) >= 6);
}

/** 특정 방향에서 사(四)가 있는지: 윈도우5에 돌4+빈1, 빈칸 채우면 정확히 5 */
function hasFourInDir(b: Stone[][], r: number, c: number, stone: Stone, dr: number, dc: number): boolean {
  for (let s = -4; s <= 0; s++) {
    let stones = 0, empties = 0, er = -1, ec = -1, valid = true;
    for (let j = 0; j < 5; j++) {
      const nr = r + (s + j) * dr, nc = c + (s + j) * dc;
      if (!inBounds(nr, nc)) { valid = false; break; }
      if (b[nr][nc] === stone) stones++;
      else if (b[nr][nc] === 0) { empties++; er = nr; ec = nc; }
      else { valid = false; break; }
    }
    if (!valid || stones !== 4 || empties !== 1) continue;
    b[er][ec] = stone;
    const len = lineLen(b, er, ec, stone, dr, dc);
    b[er][ec] = 0;
    if (len === 5) return true;
  }
  return false;
}

/** 특정 방향에서 활사(open four)인지: 5목 완성 위치가 2곳 이상 */
function isOpenFourInDir(b: Stone[][], r: number, c: number, stone: Stone, dr: number, dc: number): boolean {
  let completions = 0;
  for (let s = -4; s <= 0; s++) {
    let stones = 0, empties = 0, er = -1, ec = -1, valid = true;
    for (let j = 0; j < 5; j++) {
      const nr = r + (s + j) * dr, nc = c + (s + j) * dc;
      if (!inBounds(nr, nc)) { valid = false; break; }
      if (b[nr][nc] === stone) stones++;
      else if (b[nr][nc] === 0) { empties++; er = nr; ec = nc; }
      else { valid = false; break; }
    }
    if (!valid || stones !== 4 || empties !== 1) continue;
    b[er][ec] = stone;
    const len = lineLen(b, er, ec, stone, dr, dc);
    b[er][ec] = 0;
    if (len === 5) completions++;
  }
  return completions >= 2;
}

/** 간이 금수 판정 (삼삼 재귀 방지용): 장목 + 사사만 체크 */
function isForbiddenLight(b: Stone[][], r: number, c: number, stone: Stone): boolean {
  if (hasExactFive(b, r, c, stone)) return false;
  if (hasOverline(b, r, c, stone)) return true;
  let fours = 0;
  for (const [dr, dc] of DIRS) {
    if (hasFourInDir(b, r, c, stone, dr, dc)) fours++;
  }
  return fours >= 2;
}

/** 특정 방향에서 활삼(open three)이 있는지 */
function hasOpenThreeInDir(b: Stone[][], r: number, c: number, stone: Stone, dr: number, dc: number): boolean {
  for (let i = -5; i <= 5; i++) {
    const nr = r + dr * i, nc = c + dc * i;
    if (!inBounds(nr, nc) || b[nr][nc] !== 0) continue;

    b[nr][nc] = stone;
    const forbidden = isForbiddenLight(b, nr, nc, stone);
    const openFour = !forbidden && isOpenFourInDir(b, nr, nc, stone, dr, dc);
    b[nr][nc] = 0;

    if (openFour) return true;
  }
  return false;
}

/** 금수 판정 (흑돌 전용) */
export function isForbidden(board: Stone[][], row: number, col: number): boolean {
  const stone: Stone = 1;
  const b = board.map((r) => [...r]);
  b[row][col] = stone;

  // 정확히 5목이면 금수 아님
  if (hasExactFive(b, row, col, stone)) return false;

  // 장목 (6+)
  if (hasOverline(b, row, col, stone)) return true;

  // 사사 (4-4)
  let fours = 0;
  for (const [dr, dc] of DIRS) {
    if (hasFourInDir(b, row, col, stone, dr, dc)) fours++;
  }
  if (fours >= 2) return true;

  // 삼삼 (3-3)
  let threes = 0;
  for (const [dr, dc] of DIRS) {
    if (hasOpenThreeInDir(b, row, col, stone, dr, dc)) threes++;
  }
  if (threes >= 2) return true;

  return false;
}

/** 5목 체크 (렌주룰): 흑은 정확히 5, 백은 5이상 */
export function checkWinRenju(board: Stone[][], row: number, col: number, stone: Stone): boolean {
  if (stone === 1) {
    return DIRS.some(([dr, dc]) => lineLen(board, row, col, stone, dr, dc) === 5);
  }
  return DIRS.some(([dr, dc]) => lineLen(board, row, col, stone, dr, dc) >= 5);
}

/** 보드에서 흑의 금수 위치 계산 */
export function computeForbiddenCells(board: Stone[][]): boolean[][] {
  const result = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 0) {
        result[r][c] = isForbidden(board, r, c);
      }
    }
  }
  return result;
}
