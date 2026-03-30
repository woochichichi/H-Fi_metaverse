-- 테스트용 VOC 시드 데이터 (수동 실행)
-- 주의: 실제 auth.users가 있어야 author_id 참조 가능
-- 익명 VOC는 author_id=NULL로 삽입

INSERT INTO vocs (anonymous, category, title, content, team, target_area, status, session_token) VALUES
(true, '불편', 'VPN 접속 지연 문제', '재택근무 시 VPN 접속이 자주 끊기고, 연결까지 평균 5분 이상 소요됩니다. 업무 효율이 크게 떨어지고 있어 개선이 필요합니다.', '증권ITO', '업무환경', '접수', 'seed-token-001'),
(true, '요청', '팀 간 교류 프로그램 신설 요청', '현재 같은 층에서 근무하지만 다른 팀과의 교류가 거의 없습니다. 월 1회 정도 랜덤 커피챗이나 합동 점심 프로그램이 있으면 좋겠습니다.', '생명ITO', '관계', '검토중', 'seed-token-002'),
(false, '칭찬', '신규 온보딩 프로세스 개선 감사', '이번에 새로 합류한 팀원 온보딩 과정이 체계적으로 잘 정리되어 있어서 적응이 빨랐습니다. 준비해주신 분들께 감사드립니다.', '손보ITO', '성장', '완료', NULL),
(true, '개선', '회의실 예약 시스템 개선', '현재 회의실 예약이 수동으로 진행되어 중복 예약이 자주 발생합니다. 자동화된 예약 시스템 도입을 제안합니다.', '한금서', '업무환경', '처리중', 'seed-token-004'),
(false, '기타', '사무실 공기 관리 건의', '오후 시간대에 사무실 환기가 부족한 것 같습니다. CO2 모니터링이나 정기 환기 스케줄이 있으면 좋겠습니다.', '증권ITO', '업무환경', '접수', NULL);

-- 테스트용 대화 스레드 (2번째 VOC에 대한 대화)
-- 실행 전 위 INSERT의 id를 확인하여 ref_id에 넣어야 합니다
-- 아래는 예시이며, 실제로는 VOC id를 확인 후 실행하세요
-- INSERT INTO message_threads (ref_type, ref_id, sender_role, message) VALUES
-- ('voc', '<voc-id-here>', 'manager', '좋은 제안 감사합니다. 검토 후 답변드리겠습니다.'),
-- ('voc', '<voc-id-here>', 'author', '감사합니다. 빠른 검토 부탁드립니다.');
