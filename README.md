# ITO 메타버스

금융ITO 4개 팀의 조직문화 활동·KPI·공지·VOC·아이디어를 게더타운 스타일 메타버스 UI로 통합 관리하는 웹앱.

## 기술 스택

- React 18 + Vite + TypeScript + Tailwind CSS v4
- Zustand (상태관리) + React Router v6
- Supabase (Auth + PostgreSQL + Realtime + Storage)
- Cloudflare Pages (호스팅)

## 로컬 개발

```bash
npm install
npm run dev
```

## 환경 변수

`.env.local` 파일에 Supabase 정보를 설정하세요:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```
