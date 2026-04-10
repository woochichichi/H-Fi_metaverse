import { useState } from 'react';
import { X, HelpCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

interface FaqCategory {
  label: string;
  emoji: string;
  items: FaqItem[];
}

const FAQ_DATA: FaqCategory[] = [
  {
    label: '이게 뭐야?',
    emoji: '📖',
    items: [
      {
        q: '한울타리가 뭔가요?',
        a: '금융ITO 4팀(증권ITO·생명ITO·손보ITO·한금서)이 함께 만들어가는 조직문화 플랫폼이에요. 업무 외 소통이 부족한 우리 팀의 연결고리를 만들기 위해 시작했습니다. 메타버스 공간에서 자유롭게 돌아다니며 VOC·아이디어·모임·미니게임 등을 즐길 수 있어요.',
      },
      {
        q: '왜 메타버스 형태인가요?',
        a: '딱딱한 게시판보다 가볍게 접근할 수 있도록, 게더타운 같은 메타버스 공간으로 만들었어요. 캐릭터를 꾸미고 돌아다니면서 자연스럽게 팀 활동에 참여하는 경험을 목표로 합니다.',
      },
      {
        q: '꼭 써야 하나요?',
        a: '의무는 아닙니다! 하지만 팀 공지 확인, VOC 전달, 아이디어 제안, 동료에게 감사 표현 등 유용한 기능이 많으니 한번 둘러봐 주세요.',
      },
    ],
  },
  {
    label: '어떻게 쓰나요?',
    emoji: '🎮',
    items: [
      {
        q: '캐릭터는 어떻게 움직여요?',
        a: 'PC에서는 키보드 방향키(↑↓←→) 또는 WASD로 이동합니다. 모바일에서는 화면 하단에 터치 조이패드가 자동으로 나타나요.',
      },
      {
        q: '왼쪽 메뉴는 뭔가요?',
        a: '방 목록과 기능 바로가기입니다. 내 팀 방에서는 로비·KPI·공지에 접근하고, 중앙 광장에서는 VOC·아이디어·모임·미니게임을 이용할 수 있어요. 하단의 "마음의 편지"와 "수집함"은 어디서든 사용 가능합니다.',
      },
      {
        q: '"마음의 편지"가 뭐예요?',
        a: '동료에게 감사·응원·격려의 쪽지를 보내는 기능이에요. 익명으로도 보낼 수 있어서 부담 없이 마음을 전할 수 있습니다. 보낸 편지는 상대방의 "수집함"에 도착해요.',
      },
      {
        q: '모임은 어떻게 만들거나 참여하나요?',
        a: '중앙 광장 → 모임방에서 개설된 모임을 확인하고 참여 버튼을 누르면 됩니다. 직접 모임을 만들 수도 있어요. 점심 모임, 스터디, 운동 등 자유롭게 활용해 보세요.',
      },
      {
        q: '미니게임은 어떤 게 있어요?',
        a: '줄넘기(타이밍 맞추기), 오목(동료와 1:1 대전), 반응속도 테스트 3종이 있습니다. 중앙 광장 메뉴에서 바로 플레이할 수 있어요. 가벼운 휴식 시간에 즐겨 보세요!',
      },
      {
        q: 'VOC와 아이디어는 뭐가 달라요?',
        a: 'VOC는 업무 현장에서 느끼는 불편·개선점을 전달하는 공간이고, 아이디어는 새로운 제안을 자유롭게 공유하는 공간이에요. VOC는 익명 작성이 가능해서 솔직한 의견을 낼 수 있습니다.',
      },
      {
        q: '다른 팀 방에 갈 수 있나요?',
        a: '일반 사용자는 자기 팀 방과 중앙 광장을 이용할 수 있어요. 타 팀의 KPI·공지는 해당 팀 전용이라 접근이 제한됩니다. 관리자는 모든 방에 접근 가능합니다.',
      },
      {
        q: '모바일에서도 되나요?',
        a: '네! 모바일 브라우저에서도 사용할 수 있도록 반응형으로 설계되어 있어요. 화면이 작으면 터치 조이패드가 자동으로 나타납니다.',
      },
    ],
  },
  {
    label: '익명·보안',
    emoji: '🔒',
    items: [
      {
        q: '익명 VOC를 쓰면 누가 썼는지 정말 모르나요?',
        a: '네, 완전한 익명입니다. 익명 VOC는 작성자 정보를 아예 저장하지 않습니다(DB에 NULL). 관리자도, 개발자도 누가 썼는지 확인할 수 없는 구조예요. 솔직한 의견을 편하게 남겨 주세요.',
      },
      {
        q: '익명 쪽지도 추적 불가능한가요?',
        a: '네. 익명 쪽지의 발신자 ID는 저장되지 않습니다. 받는 사람은 "익명"이라는 표시만 보게 되고, 시스템 어디에서도 발신자를 알 수 없어요.',
      },
      {
        q: '관리자가 내 활동을 볼 수 있나요?',
        a: '관리자는 공지 등록·KPI 관리 등 운영 기능만 사용합니다. 개인 쪽지 내용, 익명 글의 작성자 등은 관리자도 확인할 수 없어요. 보안 정책(RLS)으로 본인 데이터만 본인이 볼 수 있도록 보호됩니다.',
      },
      {
        q: '내 개인정보는 안전한가요?',
        a: '모든 데이터는 클라우드에 암호화 저장되고, 보안 정책(Row Level Security)으로 본인 데이터만 조회할 수 있도록 보호돼요. 비밀번호는 해시 처리되어 원본이 저장되지 않습니다.',
      },
      {
        q: '어떤 이메일로 가입할 수 있나요?',
        a: '@hanwha 계열 이메일만 가입 가능합니다. 우리 조직 구성원만 이용할 수 있도록 도메인을 제한하고 있어요.',
      },
      {
        q: '비밀번호를 잊어버렸어요.',
        a: '로그인 화면에서 "비밀번호 찾기"를 클릭하면 가입한 이메일로 재설정 링크가 발송됩니다.',
      },
    ],
  },
  {
    label: '문제 해결',
    emoji: '🛠️',
    items: [
      {
        q: '사이트가 느리거나 오류가 나요.',
        a: '새로고침(F5)을 먼저 시도해 주세요. 계속되면 왼쪽 하단의 "사이트 건의"를 통해 증상을 알려주세요. 스크린샷을 함께 붙여넣으면(Ctrl+V) 더 빠르게 확인할 수 있어요.',
      },
      {
        q: '"사이트 건의"는 뭔가요?',
        a: '버그·불편사항·개선 요청 등을 관리자에게 직접 전달하는 기능이에요. 궁금해요 버튼 바로 아래에 있습니다. 브라우저 정보와 콘솔 로그가 자동으로 첨부되어 문제 해결에 도움이 됩니다.',
      },
      {
        q: 'KPI가 안 보여요.',
        a: 'KPI 공간은 현재 공사중입니다. 새로운 기능을 준비하고 있으니 조금만 기다려 주세요!',
      },
    ],
  },
];

interface FaqPanelProps {
  onClose: () => void;
}

export default function FaqPanel({ onClose }: FaqPanelProps) {
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const keyword = search.trim().toLowerCase();

  const filtered = keyword
    ? FAQ_DATA.map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.q.toLowerCase().includes(keyword) ||
            item.a.toLowerCase().includes(keyword),
        ),
      })).filter((cat) => cat.items.length > 0)
    : FAQ_DATA;

  const toggle = (key: string) =>
    setOpenIndex((prev) => (prev === key ? null : key));

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <HelpCircle size={16} className="text-accent" />
          <h2 className="font-heading text-base font-bold text-text-primary">궁금해요</h2>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
        >
          <X size={16} />
        </button>
      </div>

      {/* 검색 */}
      <div className="px-4 pt-3 pb-1">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="질문 검색..."
            className="w-full rounded-lg bg-white/[.06] pl-9 pr-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {/* Q&A 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filtered.length === 0 ? (
          <p className="text-center text-xs text-text-muted py-8">
            검색 결과가 없습니다
          </p>
        ) : (
          filtered.map((cat) => (
            <div key={cat.label}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-sm">{cat.emoji}</span>
                <span className="text-xs font-bold text-text-secondary">{cat.label}</span>
                <span className="text-[10px] text-text-muted">({cat.items.length})</span>
              </div>
              <div className="space-y-1.5">
                {cat.items.map((item, idx) => {
                  const key = `${cat.label}-${idx}`;
                  const isOpen = openIndex === key;
                  return (
                    <div
                      key={key}
                      className="rounded-xl bg-white/[.04] border border-white/[.06] overflow-hidden"
                    >
                      <button
                        onClick={() => toggle(key)}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
                      >
                        <span className="text-xs font-medium text-accent">Q.</span>
                        <span className="flex-1 text-xs font-medium text-text-primary">
                          {item.q}
                        </span>
                        {isOpen ? (
                          <ChevronUp size={14} className="text-text-muted shrink-0" />
                        ) : (
                          <ChevronDown size={14} className="text-text-muted shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="border-t border-white/[.06] px-3 py-2.5">
                          <div className="flex gap-2">
                            <span className="text-xs font-medium text-info shrink-0">A.</span>
                            <p className="text-xs text-text-secondary leading-relaxed">
                              {item.a}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
