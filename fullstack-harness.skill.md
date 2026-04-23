# Fullstack Development Harness

> 실전 프로젝트에서 축적한 풀스택 개발 하네스.
> React + Supabase (또는 유사 BaaS/백엔드) 프로젝트에 범용 적용.
> 프로젝트 주제와 무관하게 **DB 설계, 인증/회원, 보안, 에러 처리, 상태 관리, 파일 업로드, 검증 루틴** 등을 체계화한다.

---

## 1. 불변 원칙 (MUST — 모든 프로젝트 공통)

1. **테이블/스키마 DROP/TRUNCATE 금지** (마이그레이션 제외) — 행 DELETE는 RLS 보호 하에 허용
2. **DB 쿼리 후 `{ data, error }` 체크 필수** — error를 무시하면 조용한 실패로 버그 추적 불가
3. **서비스 키(service_role_key) 프론트 사용 절대 금지** — 항상 anon key만 사용
4. **보안은 RLS, 프론트 권한 체크는 UX 목적** — 프론트에서 버튼을 숨겨도 API는 뚫림, RLS가 진짜 방패
5. **컴포넌트 분리는 응집도 기준** — 줄 수가 아니라 역할이 다를 때 분리 (억지 분리 금지)
6. **익명 데이터: author_id = NULL** — 세션 토큰으로 후속 접근, 관리자도 식별 불가 원칙

---

## 2. DB 설계 패턴

### 2-1. 테이블 기본 구조
```sql
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 비즈니스 컬럼
  title TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT '접수' CHECK (status IN ('접수','검토중','처리중','완료','보류')),
  category TEXT NOT NULL CHECK (category IN ('A','B','C')),
  -- 메타
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  team TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  anonymous BOOLEAN DEFAULT false,
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**핵심:**
- `CHECK (column IN (...))` — 도메인 값을 DB 레벨에서 강제
- `ON DELETE CASCADE` vs `SET NULL` — 부모 삭제 시 자식 처리 전략을 테이블 생성 시 결정
- `gen_random_uuid()` — PK는 UUID 자동 생성
- `DEFAULT now()` — 생성 시각 자동 기록

### 2-2. 자동 updated_at 트리거
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```
> 모든 테이블에 일괄 적용. 프론트에서 updated_at을 직접 넣지 않는다.

### 2-3. 자동 활동 기록 트리거
```sql
CREATE OR REPLACE FUNCTION log_item_activity()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_activities (user_id, team, activity_type, points, ref_id)
  VALUES (
    NEW.author_id,
    COALESCE(NEW.team, (SELECT team FROM profiles WHERE id = NEW.author_id)),
    'item_submit',
    1,
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_item_created
  AFTER INSERT ON items
  FOR EACH ROW EXECUTE FUNCTION log_item_activity();
```

**핵심:**
- `SECURITY DEFINER` — 트리거 함수가 생성자 권한으로 실행 (프론트 RLS 우회)
- `AFTER INSERT` — 본 테이블 INSERT 성공 후 부가 테이블에 기록
- `ref_id` — 원본 레코드 참조 (추적용)

### 2-4. 인덱싱 전략
```sql
-- 필터 컬럼
CREATE INDEX idx_items_team ON items(team);
CREATE INDEX idx_items_status ON items(status);
-- 정렬 컬럼
CREATE INDEX idx_items_created ON items(created_at DESC);
-- 복합 (자주 함께 조회)
CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);
-- 토큰 검색 (익명 후속 접근)
CREATE INDEX idx_items_session_token ON items(session_token);
```

**원칙:** WHERE에 쓰는 컬럼 + ORDER BY 컬럼 조합으로 인덱스 생성. 불필요한 인덱스는 INSERT 성능 저하.

### 2-5. 조회수 중복 방지 (RPC)
```sql
CREATE OR REPLACE FUNCTION increment_view_count(
  table_name TEXT, record_id UUID
) RETURNS VOID AS $$
BEGIN
  EXECUTE format('UPDATE %I SET view_count = view_count + 1 WHERE id = $1', table_name)
  USING record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
프론트에서는 **세션 내 Set으로 중복 호출 방지:**
```typescript
const viewedRef = useRef(new Set<string>());
const incrementView = (id: string) => {
  if (viewedRef.current.has(id)) return;
  viewedRef.current.add(id);
  supabase.rpc('increment_view_count', { table_name: 'items', record_id: id });
};
```

---

## 3. RLS (Row Level Security) 패턴

### 3-1. 역할 기반 접근
```sql
-- 관리자/리더만 조회
CREATE POLICY "items_select_leader" ON items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'leader')
  ));

-- 본인 것만 조회
CREATE POLICY "items_select_own" ON items FOR SELECT
  USING (author_id = auth.uid());

-- 본인만 INSERT
CREATE POLICY "items_insert_own" ON items FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- 본인만 DELETE (+ .select('id') 필수)
CREATE POLICY "items_delete_own" ON items FOR DELETE
  USING (auth.uid() = author_id);

-- 팀 범위 제한 (리더는 자기 팀만)
CREATE POLICY "profiles_update_leader" ON profiles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles AS me
    WHERE me.id = auth.uid()
    AND (me.role = 'admin' OR (me.role = 'leader' AND profiles.team = me.team))
  ));
```

### 3-2. RLS 함정 — 조용한 실패
```
⚠️ DELETE/UPDATE에 RLS가 걸리면 에러가 아닌 "0행 영향"으로 돌아온다.
→ 반드시 .select('id') 체이닝 후 반환된 행 수로 성공 여부 판단.
```
```typescript
const { data, error } = await supabase
  .from('items')
  .delete()
  .eq('id', itemId)
  .select('id'); // ← 이게 없으면 실패해도 모른다

if (!data?.length) {
  setError('삭제 권한이 없거나 이미 삭제되었습니다.');
}
```

### 3-3. DELETE 기능 체크리스트
새로운 삭제 기능을 추가할 때 반드시 점검:
1. **RLS DELETE 정책 존재?** — 없으면 조용한 실패
2. **FK CASCADE 설정?** — 자식 테이블 데이터 정리 방식 확인
3. **익명(author_id=NULL) 삭제 가능?** — NULL은 `auth.uid() = NULL`이 항상 false → 삭제 불가 (의도된 동작인지 확인)
4. **알림/활동 로그 정리?** — 원본 삭제 시 참조하는 알림도 CASCADE 또는 수동 정리
5. **`.select('id')` 체이닝?** — 조용한 실패 방지

---

## 4. 인증 & 회원 관리

### 4-1. 회원가입 플로우
```
[초대코드 입력] → [코드 검증(RPC)] → [이메일/비밀번호] → [프로필 입력] → [signUp + 메타데이터]
                                                                              ↓
                                                              [DB 트리거: profiles 자동 생성]
                                                                              ↓
                                                              [초대코드 사용횟수 원자적 증가]
```

### 4-2. 초대코드 보안 검증 (RPC)
```sql
CREATE OR REPLACE FUNCTION validate_invite_code_secure(code_input TEXT)
RETURNS JSONB AS $$
DECLARE
  attempt_count INTEGER;
  cleaned TEXT;
  found RECORD;
BEGIN
  -- 입력 정규화: 공백/쉼표 제거, 대문자 변환
  cleaned := UPPER(REGEXP_REPLACE(TRIM(code_input), '[\s,]', '', 'g'));

  -- Rate limit: 15분 내 30회 초과 차단
  SELECT COUNT(*) INTO attempt_count
  FROM invite_attempt_log WHERE attempted_at > now() - interval '15 minutes';
  
  IF attempt_count >= 30 THEN
    RETURN jsonb_build_object('valid', false, 'error', '너무 많은 시도입니다. 잠시 후 다시 시도해주세요.');
  END IF;
  INSERT INTO invite_attempt_log (client_ip) VALUES (NULL);

  -- 검증: 존재 + 활성 + 만료 안 됨 + 사용횟수 미초과
  SELECT * INTO found FROM invite_codes WHERE code = cleaned;
  
  IF NOT FOUND THEN RETURN jsonb_build_object('valid', false, 'error', '유효하지 않은 초대 코드'); END IF;
  IF NOT found.active THEN RETURN jsonb_build_object('valid', false, 'error', '비활성화된 코드'); END IF;
  IF found.used_count >= found.max_uses THEN RETURN jsonb_build_object('valid', false, 'error', '사용 초과'); END IF;
  IF found.expires_at IS NOT NULL AND found.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', '만료된 코드');
  END IF;

  -- 코드 자체는 절대 반환하지 않음
  RETURN jsonb_build_object('valid', true, 'invite', jsonb_build_object(
    'id', found.id, 'team', found.team, 'role', found.role
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION validate_invite_code_secure(TEXT) TO anon;
```

**핵심:**
- `SECURITY DEFINER` — anon 사용자가 호출해도 내부는 DB 소유자 권한
- Rate limiting — 브루트포스 방지
- 입력 정규화 — 사용자 오타 최소화
- 코드 원문 미반환 — 보안

### 4-3. 원자적 사용횟수 증가
```sql
CREATE OR REPLACE FUNCTION increment_invite_usage(code_id UUID)
RETURNS BOOLEAN AS $$
DECLARE rows_affected INTEGER;
BEGIN
  UPDATE invite_codes
  SET used_count = used_count + 1
  WHERE id = code_id AND active = true
    AND used_count < max_uses
    AND (expires_at IS NULL OR expires_at > now());
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
> WHERE 조건에 모든 검증을 넣어 **race condition 방지** (동시 가입 시 초과 사용 불가)

### 4-4. 프로필 자동 생성 트리거
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, name, team, role, nickname)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'team',
    COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
    NEW.raw_user_meta_data->>'nickname'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**핵심:**
- `signUp({ options: { data: { name, team, role } } })` → `auth.users.raw_user_meta_data`에 저장
- 트리거가 `profiles` 행 자동 생성 → 프론트에서 별도 INSERT 불필요
- `COALESCE`로 기본값 처리

### 4-5. 인증 상태 관리 (Zustand 패턴)
```typescript
const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    set({ user: data.user });
    await get().fetchProfile(data.user.id);

    // 비즈니스 로직 검증 (퇴사자 차단 등)
    const profile = get().profile;
    if (profile?.status === 'inactive') {
      await supabase.auth.signOut();
      set({ user: null, profile: null });
      return { error: '비활성 계정입니다.' };
    }
    return { error: null };
  },

  initialize: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({ user: session.user });
        await get().fetchProfile(session.user.id);
      }
    } finally {
      set({ isLoading: false });
    }
    // 탭 복귀 시 세션 갱신
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') supabase.auth.getSession();
    });
    // 다중 탭 동기화
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        set({ user: session.user });
        if (!get().profile) await get().fetchProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, profile: null });
      }
    });
  },
}));
```

### 4-6. 실시간 프로필 구독
```typescript
function subscribeProfile(userId: string) {
  return supabase
    .channel('profile-self')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'profiles',
      filter: `id=eq.${userId}`,
    }, async () => {
      await useAuthStore.getState().fetchProfile(userId);
      // 관리자가 상태 변경 시 즉시 반영 (퇴사 처리 → 강제 로그아웃)
      if (useAuthStore.getState().profile?.status === 'inactive') {
        await supabase.auth.signOut();
      }
    })
    .subscribe();
}
```

---

## 5. 에러 처리 & 타임아웃

### 5-1. withTimeout 래퍼 (핵심 유틸)
```typescript
export function withTimeout<T>(
  queryOrFn: PromiseLike<T> | (() => PromiseLike<T>),
  ms = 8000,
  label = 'query',
): Promise<T> {
  const run = (attempt: number): Promise<T> => {
    const start = performance.now();
    const promise = typeof queryOrFn === 'function' ? queryOrFn() : queryOrFn;

    return Promise.race([
      Promise.resolve(promise).then(
        (result) => { console.warn(`[DB:${label}] ✅ ${(performance.now() - start).toFixed(0)}ms`); return result; },
        (err) => { console.error(`[DB:${label}] ❌`, err?.message); throw err; },
      ),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`요청 시간 초과 (${label})`)), ms),
      ),
    ]);
  };
  return run(1).catch(() => run(2)); // 1회 자동 재시도
}
```

**반드시 적용하는 곳:** 모든 Supabase select/insert/update/delete 훅

**사용:**
```typescript
const { data, error } = await withTimeout(
  () => supabase.from('items').select('*').eq('team', team),
  8000,
  'items-list'
);
```

### 5-2. 에러 처리 3단계
```typescript
// 1단계: 필수 — 결과를 사용자에게 보여주는 쿼리
const { data, error } = await withTimeout(buildQuery, 8000, 'label');
if (error) { setError(error.message); return; }

// 2단계: try/catch — 네트워크 에러까지 포함
try {
  const { data, error } = await withTimeout(buildQuery, 8000, 'label');
  if (error) throw error;
  setData(data);
} catch (err) {
  setError(err instanceof Error ? err.message : '알 수 없는 오류');
}

// 3단계: 비차단 — 알림/로그 등 실패해도 괜찮은 부가 작업
try { await supabase.from('notifications').insert(list); } catch { /* 무시 */ }
```

### 5-3. Panel → List 에러 전달 (필수)
```typescript
// Panel (부모)
const { data, error, isLoading, refetch } = useItems();
return <ItemList items={data} error={error} isLoading={isLoading} onRetry={refetch} />;

// List (자식) — error/onRetry props 누락하면 로딩 실패 시 빈 화면
if (error) return <ErrorMessage message={error} onRetry={onRetry} />;
if (isLoading) return <Skeleton />;
```
> **교훈:** Panel에서 에러를 잡아도 List에 전달하지 않으면 사용자는 "로딩 실패"를 영원히 본다.

---

## 6. 파일 업로드

### 6-1. Storage 규칙
- 파일 경로: **순수 ASCII** — `{bucket}/{timestamp}_{uuid8}.{ext}`
- 한글/특수문자 파일명: URL fragment에 저장 → `publicUrl#encodeURIComponent(originalName)`
- 파일명 복원: `decodeURIComponent(url.split('#')[1] || '파일')`

### 6-2. 업로드 훅 패턴
```typescript
function useFileUpload({ bucket, maxSize, maxFiles }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const upload = async (files: File[]) => {
    setUploading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 30000); // 30초 전역 타임아웃

    try {
      for (const file of files) {
        if (controller.signal.aborted) break;
        const ext = file.name.split('.').pop();
        const path = `${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;
        const { error } = await supabase.storage.from(bucket).upload(path, file);
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof DOMException && err.name === 'AbortError'
        ? '업로드 시간 초과' : (err as Error).message);
    } finally {
      clearTimeout(timeout);
      abortRef.current = null;
      setUploading(false);
    }
  };
  return { upload, uploading, error };
}
```

### 6-3. Storage 신규 기능 체크리스트
1. **버킷 존재 확인** — 없으면 생성 + RLS 정책 추가
2. **RLS 정책** — `INSERT`: 인증된 사용자, `SELECT`: public 또는 조건부
3. **용량 제한** — 버킷 레벨 또는 프론트 검증 (둘 다 권장)
4. **파일명 ASCII화** — UUID 경로 + fragment 원본명

---

## 7. 익명 데이터 처리

### 7-1. 익명 제출
```typescript
const sessionToken = input.anonymous ? crypto.randomUUID() : null;
const { data } = await supabase.from('items').insert({
  author_id: input.anonymous ? null : userId,  // NULL = 완전 익명
  anonymous: input.anonymous,
  session_token: sessionToken,                  // 후속 접근용
}).select().single();

// 세션 토큰 브라우저 저장 (sessionStorage = 탭 닫으면 소멸)
if (sessionToken && data) {
  const tokens = JSON.parse(sessionStorage.getItem('item_tokens') || '{}');
  tokens[data.id] = sessionToken;
  sessionStorage.setItem('item_tokens', JSON.stringify(tokens));
}
```

### 7-2. 익명 원칙
- `author_id = NULL` → `auth.uid() = NULL`은 항상 false → RLS에서 본인 확인 불가
- 관리자도 작성자 식별 불가 (DB 레벨 보장)
- 후속 접근(수정/삭제)은 session_token 매칭으로만 가능
- 브라우저 닫으면 토큰 소멸 → 재접근 불가 (의도된 동작)

---

## 8. 상태 관리 패턴

### 8-1. 타입 안전 enum
```typescript
export const CATEGORIES = ['A', 'B', 'C', 'D'] as const;
export type Category = (typeof CATEGORIES)[number]; // 'A' | 'B' | 'C' | 'D'

export const CATEGORY_LABELS: Record<Category, string> = {
  A: '카테고리 A', B: '카테고리 B', C: '카테고리 C', D: '카테고리 D',
};

// 중첩 enum
export const SUB_CATEGORIES: Record<Category, string[]> = {
  A: ['A-1', 'A-2'], B: ['B-1', 'B-2'], C: ['C-1'], D: ['D-1', 'D-2', 'D-3'],
};
```

### 8-2. 컨텍스트 전환 시 상태 초기화
```typescript
// 선택 항목이 바뀌면 편집/UI 임시 상태를 반드시 리셋
useEffect(() => {
  setIsEditing(false);
  setShowMenu(false);
  setDraft('');
}, [selectedItem?.id]); // ← ID 변경 감지
```
> **교훈:** 이전 아이템의 편집 상태가 다음 아이템에 잔류하면 UX 혼란 + 데이터 오염

### 8-3. Zustand 스토어 분리
```
stores/
├── authStore.ts      — user, profile, login/logout
├── uiStore.ts        — 모달, 사이드바, 테마
└── featureStore.ts   — 도메인별 실시간 상태 (채팅, 위치 등)
```
> 도메인별 분리. 하나의 God Store 금지.

---

## 9. 수정 후 자체 검증 루틴 (3-Phase)

### Phase 1: 위험성 리뷰 (수정 파일 전체 재독)
| # | 체크 항목 | 확인 방법 |
|---|----------|----------|
| 1 | 이벤트 충돌 | 새 키보드/마우스 핸들러가 기존과 겹치지 않는지 |
| 2 | 상태 누수 | 언마운트/삭제 후 이전 state 잔류 여부 |
| 3 | 모달/드롭다운 닫기 | ESC, 바깥 클릭 정상 동작 + 중첩 순서 |
| 4 | 타입 시그니처 | Props 인터페이스 ↔ 실제 전달 값 일치 |
| 5 | 참조 데이터 동기화 | 생성/수정 후 관련 조회가 갱신되는지 |
| 6 | 기존 피드백 위반 | memory/ 피드백 메모리(타임아웃, 포탈 등) 위반 여부 |

### Phase 2: 실효성 검증
1. **빌드 검증** — `npx tsc -b --noEmit` → 0 에러
2. **영향도 분석** — 수정한 함수/타입/훅을 import하는 모든 파일 Grep → 호환성 확인
3. **RLS/보안** — DB 쿼리 변경 시 RLS 정책 충돌 없는지, anon key 범위 내인지
4. **런타임 로직 추적** — 의도대로 동작하는지 흐름 추적 (데드코드/unreachable 없는지)
5. **회귀 방지** — 기존 기능 깨짐 여부 (관련 컴포넌트/훅 호출 흐름)

### Phase 3: 즉시 수정 → 재검증
- Phase 1~2에서 문제 발견 → **즉시 수정** → Phase 2 재실행
- **0건까지 반복** — "나중에 고치겠다" 허용 안 함

---

## 10. 시행착오에서 추출한 철칙

### 10-1. DB/인프라
| 교훈 | 상세 |
|------|------|
| **fetch에 타임아웃 필수** | 네트워크 지연 시 무한 대기 → `withTimeout(query, 8000)` 래퍼 |
| **RLS 변경 = 프론트 동기화** | DB에서 INSERT 정책 추가해도 프론트 guard가 막으면 동작 안 함 (역도 마찬가지) |
| **Management API + 한글 = 깨짐** | curl로 한글 SQL 직접 전송 금지 → `--data-binary @file.json` 또는 Node.js fetch 사용 |
| **DELETE = .select('id') 필수** | RLS 미통과 시 에러 대신 0행 반환 → 결과 확인 안 하면 "삭제 성공"으로 착각 |
| **인프라 먼저, 코드 나중** | Storage 버킷, RLS 정책, DB 테이블이 존재해야 코드가 동작 |

### 10-2. 프론트엔드
| 교훈 | 상세 |
|------|------|
| **backdrop-filter + fixed = 깨짐** | 오버레이 UI는 `createPortal(document.body)` 필수 |
| **컨텍스트 전환 시 상태 리셋** | 선택 항목 변경 시 editing/menu 등 임시 상태 초기화 useEffect |
| **비ASCII는 URL 경로에 금지** | 한글 파일명 → 90+ 문자 인코딩 → 경로 길이 초과 400 에러 |
| **Panel→List error 전달** | 부모에서 에러 잡아도 자식에 전달 안 하면 빈 화면 |
| **confirm() → 커스텀 다이얼로그** | 브라우저 confirm()은 스타일 불가 + 모바일 UX 열악 |
| **버튼 순서 통일** | 확인(왼쪽) / 취소(오른쪽) 전체 프로젝트 일관성 |

### 10-3. 프로세스
| 교훈 | 상세 |
|------|------|
| **검증 스킵 → 다음 버그 증폭** | 빠른 수정 → 커밋 → 검증 생략 → 다음 버그가 더 심각해짐 |
| **MUST 규칙은 자동화** | 문서만으로는 압박 상황에서 스킵됨 → PreToolUse 훅 등으로 강제 |
| **시행착오 즉시 기록** | 해결 직후가 아니면 맥락을 잊음 → 자동 기록 습관화 |
| **프롬프트 기록** | 요청 히스토리가 남아야 의사결정 추적 가능 |

---

## 11. Realtime 구독 패턴

```typescript
// 기본 패턴
const channel = supabase
  .channel('feature-name')
  .on('postgres_changes', {
    event: '*',           // INSERT | UPDATE | DELETE | *
    schema: 'public',
    table: 'items',
    filter: 'team=eq.증권', // 행 레벨 필터 (선택)
  }, (payload) => {
    // payload.new, payload.old, payload.eventType
    refetch(); // 또는 낙관적 업데이트
  })
  .subscribe();

// 클린업 (언마운트 시 필수)
return () => { supabase.removeChannel(channel); };
```

**주의:**
- 채널 이름 중복 금지 (같은 이름 → 기존 채널 교체)
- 구독 전 기존 채널 제거: `if (channelRef.current) supabase.removeChannel(channelRef.current);`
- Presence 채널은 별도 (`channel.track({ user_id, status })`)

---

## 12. 배포 체크리스트

### SPA 배포 (Cloudflare Pages 등)
- [ ] `public/_redirects` → `/* /index.html 200` (SPA 라우팅)
- [ ] 환경변수: `NODE_VERSION=22` (미설정 시 MIME 에러)
- [ ] `.env.local`은 gitignore — 배포 플랫폼에 별도 설정

### DB 마이그레이션 배포
- [ ] SQL 파일 인코딩: UTF-8 BOM 없음
- [ ] 한글 포함 시 Node.js fetch 사용 (curl 금지)
- [ ] CHECK 제약조건 hex 검증 (한글/이모지 깨짐 확인)
- [ ] RLS 정책 + 트리거 + 인덱스 순서로 적용
- [ ] `full_setup.sql` 동기화 (수동 관리 시)

---

## 13. 코딩 규칙

### SHOULD
- Tailwind 우선, 커스텀 CSS 최소화
- 로딩 → 스켈레톤, 에러 → 인라인 메시지, 빈 상태 → 이모지+텍스트
- 터치 타겟 44x44px 이상 (모바일 필수)
- `cursor-pointer` 인터랙티브 요소에 명시
- `transition-colors duration-200` 기본 트랜지션
- 낙관적 업데이트 (투표, 읽음 표시 등)

### MUST NOT
- `service_role_key` 프론트 사용
- confirm() 브라우저 기본 다이얼로그 (커스텀 사용)
- 비ASCII 문자 URL 경로
- 타임아웃 없는 fetch
- Panel에서 잡은 에러를 List에 미전달
- 응집도 무시한 컴포넌트 분리 (줄 수 기준 분리 금지)
