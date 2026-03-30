-- =============================================
-- Sprint 4+5+6 시드 데이터
-- 아이디어 보드 + 공지(시급성 3단계) + KPI
-- 수동 실행: Supabase SQL Editor에서 실행
-- =============================================

-- ═══ 아이디어 (ideas) ═══

INSERT INTO ideas (id, author_id, title, description, category, status, created_at) VALUES
  ('idea-001', NULL, '월간 팀 교류 보드게임 대회', '매달 마지막 금요일에 팀 간 보드게임 대회를 개최하여 자연스러운 교류를 만들어요. 우승팀에게 커피 쿠폰 제공!', '이벤트', '채택', NOW() - INTERVAL '5 days'),
  ('idea-002', NULL, '업무 자동화 스크립트 공유 위키', '각 팀에서 만든 업무 자동화 스크립트를 위키에 모아서 공유하면 전체 생산성이 올라갈 것 같습니다.', '업무개선', '검토', NOW() - INTERVAL '3 days'),
  ('idea-003', NULL, '신입사원 버디 프로그램', '타팀 신입사원끼리 버디를 매칭해서 한 달간 점심을 함께 하는 프로그램. 조직 적응과 네트워킹에 도움!', '인적교류', '제안', NOW() - INTERVAL '1 day');

-- ═══ 아이디어 투표 (idea_votes) ═══
-- 참고: user_id는 실제 유저 UUID가 필요합니다. 아래는 예시용 더미입니다.
-- 실제 환경에서는 profiles 테이블의 실제 id를 사용하세요.

-- idea-001에 투표 5건 (인기 아이디어)
INSERT INTO idea_votes (idea_id, user_id, created_at) VALUES
  ('idea-001', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '4 days'),
  ('idea-001', '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '4 days'),
  ('idea-001', '00000000-0000-0000-0000-000000000003', NOW() - INTERVAL '3 days'),
  ('idea-001', '00000000-0000-0000-0000-000000000004', NOW() - INTERVAL '2 days'),
  ('idea-001', '00000000-0000-0000-0000-000000000005', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- idea-002에 투표 2건
INSERT INTO idea_votes (idea_id, user_id, created_at) VALUES
  ('idea-002', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 days'),
  ('idea-002', '00000000-0000-0000-0000-000000000003', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;


-- ═══ 공지사항 (notices) ═══

-- 긴급 공지 1건 (고정)
INSERT INTO notices (id, author_id, title, content, urgency, category, pinned, unit, team, attachment_urls, created_at) VALUES
  ('notice-001', NULL, '[긴급] 3/31(월) 전산센터 네트워크 점검 안내',
   '안녕하세요. 금융ITO 관리팀입니다.\n\n아래와 같이 전산센터 네트워크 정기 점검이 예정되어 있습니다.\n\n■ 일시: 2026-03-31(월) 22:00 ~ 04:00 (6시간)\n■ 영향: VPN 접속 불가, 개발서버 일시 중단\n■ 조치: 점검 전 작업 저장 필수\n\n문의사항은 인프라팀으로 연락 부탁드립니다.',
   '긴급', '일반', TRUE, NULL, NULL, NULL, NOW() - INTERVAL '2 hours');

-- 할일 공지 2건
INSERT INTO notices (id, author_id, title, content, urgency, category, pinned, unit, team, attachment_urls, created_at) VALUES
  ('notice-002', NULL, '[할일] 2026 1분기 활동보고서 제출 안내',
   '각 유닛별 1분기 활동보고서를 4/7(월)까지 제출해 주세요.\n\n■ 양식: 공유 드라이브 > ITO활동 > 템플릿\n■ 제출: 각 유닛 리더에게 전달\n■ 포함 내용: 주요 활동, KPI 달성 현황, 차분기 계획',
   '할일', '활동보고', FALSE, NULL, NULL, NULL, NOW() - INTERVAL '1 day'),
  ('notice-003', NULL, '[할일] 4월 조직문화 이벤트 참가 신청',
   '4월 11일(금) 예정된 "ITO 볼링 대회" 참가 신청을 받습니다.\n\n■ 일시: 4/11(금) 18:00~\n■ 장소: 여의도 볼링센터\n■ 신청: 3/31까지 각 팀 리더에게 신청\n■ 비용: 회사 지원 (식사 포함)',
   '할일', '이벤트', FALSE, NULL, NULL, NULL, NOW() - INTERVAL '3 days');

-- 참고 공지 2건
INSERT INTO notices (id, author_id, title, content, urgency, category, pinned, unit, team, attachment_urls, created_at) VALUES
  ('notice-004', NULL, '[참고] 사내 카페 메뉴 변경 안내',
   '4월부터 사내 카페 메뉴가 일부 변경됩니다.\n\n■ 신규: 딸기 라떼, 자몽 에이드\n■ 종료: 겨울 한정 메뉴 (팥 라떼, 고구마 라떼)\n\n많은 이용 부탁드립니다 ☕',
   '참고', '일반', FALSE, NULL, NULL, NULL, NOW() - INTERVAL '5 days'),
  ('notice-005', NULL, '[참고] 재택근무 가이드라인 업데이트',
   '재택근무 관련 가이드라인이 소폭 업데이트되었습니다.\n\n■ 변경: 주 2회 → 주 3회 재택 가능 (팀장 승인 시)\n■ 필수 출근일: 월요일 (전체 미팅)\n■ 적용: 4월 1일부터\n\n자세한 내용은 인사팀 공지를 참고해 주세요.',
   '참고', '일반', FALSE, NULL, NULL, NULL, NOW() - INTERVAL '7 days');


-- ═══ KPI 항목 (kpi_items) ═══

INSERT INTO kpi_items (id, unit, title, description, max_score, quarter, created_at) VALUES
  ('kpi-001', '조직', '조직문화 활동 참여율', '이벤트/교류 활동 참여 비율 (목표 80%)', 3, '2026-Q1', NOW() - INTERVAL '30 days'),
  ('kpi-002', '조직', 'VOC 응답 만족도', 'VOC 처리 후 만족도 평가 평균 (목표 4.0/5.0)', 3, '2026-Q1', NOW() - INTERVAL '30 days'),
  ('kpi-003', '조직', '아이디어 제안 건수', '분기별 아이디어 제안 목표 달성률', 3, '2026-Q1', NOW() - INTERVAL '30 days'),
  ('kpi-004', '조직', '공지 확인율', '긴급/할일 공지 확인율 (목표 95%)', 3, '2026-Q1', NOW() - INTERVAL '30 days');


-- ═══ KPI 실적 (kpi_records) — 각 항목 3개월치 ═══

-- kpi-001: 조직문화 활동 참여율
INSERT INTO kpi_records (kpi_item_id, user_id, month, score, evidence, created_at) VALUES
  ('kpi-001', '00000000-0000-0000-0000-000000000001', '2026-01', 2.1, '1월 신년회 참여 63/80명 (79%)', NOW() - INTERVAL '60 days'),
  ('kpi-001', '00000000-0000-0000-0000-000000000001', '2026-02', 2.4, '2월 설맞이 행사 참여 68/80명 (85%)', NOW() - INTERVAL '30 days'),
  ('kpi-001', '00000000-0000-0000-0000-000000000001', '2026-03', 2.7, '3월 볼링대회 참여 72/80명 (90%)', NOW());

-- kpi-002: VOC 응답 만족도
INSERT INTO kpi_records (kpi_item_id, user_id, month, score, evidence, created_at) VALUES
  ('kpi-002', '00000000-0000-0000-0000-000000000001', '2026-01', 1.8, '1월 VOC 만족도 3.6/5.0', NOW() - INTERVAL '60 days'),
  ('kpi-002', '00000000-0000-0000-0000-000000000001', '2026-02', 2.1, '2월 VOC 만족도 3.8/5.0', NOW() - INTERVAL '30 days'),
  ('kpi-002', '00000000-0000-0000-0000-000000000001', '2026-03', 2.5, '3월 VOC 만족도 4.2/5.0', NOW());

-- kpi-003: 아이디어 제안 건수
INSERT INTO kpi_records (kpi_item_id, user_id, month, score, evidence, created_at) VALUES
  ('kpi-003', '00000000-0000-0000-0000-000000000001', '2026-01', 1.5, '1월 아이디어 3건 제안 (목표 5건)', NOW() - INTERVAL '60 days'),
  ('kpi-003', '00000000-0000-0000-0000-000000000001', '2026-02', 2.0, '2월 아이디어 5건 제안 (목표 달성)', NOW() - INTERVAL '30 days'),
  ('kpi-003', '00000000-0000-0000-0000-000000000001', '2026-03', 2.3, '3월 아이디어 6건 제안 (초과 달성)', NOW());

-- kpi-004: 공지 확인율
INSERT INTO kpi_records (kpi_item_id, user_id, month, score, evidence, created_at) VALUES
  ('kpi-004', '00000000-0000-0000-0000-000000000001', '2026-01', 2.4, '1월 긴급/할일 공지 확인율 88%', NOW() - INTERVAL '60 days'),
  ('kpi-004', '00000000-0000-0000-0000-000000000001', '2026-02', 2.7, '2월 긴급/할일 공지 확인율 93%', NOW() - INTERVAL '30 days'),
  ('kpi-004', '00000000-0000-0000-0000-000000000001', '2026-03', 2.9, '3월 긴급/할일 공지 확인율 97%', NOW());
