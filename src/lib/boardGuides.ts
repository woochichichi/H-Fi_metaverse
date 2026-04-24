/**
 * 보드별 가이드 문구 단일 소스.
 *
 * - headline: 페이지 헤더 아래 한 줄 설명 (회색)
 * - placeholder: 입력창 placeholder (예시 형태 권장)
 * - emptyTitle: 빈 상태 메시지
 * - emptyDesc: 빈 상태 보조 설명
 * - anonymous: 익명으로 저장되는 보드 (UI에 "익명으로 작성됩니다" 배지 노출)
 *
 * 팀장 피드백 260424: "계속 쓰게끔 진입 장벽을 낮추자" — 예시 포함 플레이스홀더 우선.
 */

export interface BoardGuide {
  headline: string;
  placeholder: string;
  emptyTitle: string;
  emptyDesc?: string;
  anonymous?: boolean;
}

export const BOARD_GUIDES: Record<'voc' | 'idea' | 'notice' | 'note' | 'budget', BoardGuide> = {
  voc: {
    headline: '팀에 바라는 점, 불편한 점을 익명으로 남겨주세요',
    placeholder: '예) 회의실 예약이 너무 복잡해요 / 커피머신 자주 고장나요',
    emptyTitle: '아직 VOC가 없어요',
    emptyDesc: '첫 번째 목소리가 되어보세요 🙋',
    anonymous: true,
  },
  idea: {
    headline: '업무를 더 낫게 만들 아이디어를 공유해요',
    placeholder: '예) 주간회의를 격주로 줄이면 어떨까요?',
    emptyTitle: '아직 제안이 없어요',
    emptyDesc: '작은 아이디어도 환영해요 💡',
  },
  notice: {
    headline: '팀 전체가 알아야 할 소식이에요 (리더 권한)',
    placeholder: '제목 / 본문',
    emptyTitle: '최근 공지가 없어요 📢',
    emptyDesc: '필터를 바꾸거나, 새 공지를 작성해 보세요.',
  },
  note: {
    headline: '누구에게든 익명으로 한 줄 전해보세요 — 칭찬·감사·고민',
    placeholder: '예) 어제 도와주셔서 감사했어요',
    emptyTitle: '아직 받은 쪽지가 없어요 ✉️',
    anonymous: true,
  },
  budget: {
    headline: '우리 팀이 주로 어디에 쓰는지 한눈에',
    placeholder: '',
    emptyTitle: '이번 달 사용 내역이 없어요',
    emptyDesc: '매일 오전 7시에 자동 수집됩니다. 첫 수집이 완료되면 이곳에 현황이 표시돼요.',
  },
};
