/** DB 스키마 기반 TypeScript 타입 (supabase gen types 전 수동 정의) */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id'>>;
        Relationships: [];
      };
      invite_codes: {
        Row: InviteCode;
        Insert: Omit<InviteCode, 'id' | 'created_at' | 'used_count'>;
        Update: Partial<Omit<InviteCode, 'id'>>;
        Relationships: [];
      };
      vocs: {
        Row: Voc;
        Insert: Omit<Voc, 'id' | 'created_at' | 'updated_at' | 'status'>;
        Update: Partial<Omit<Voc, 'id'>>;
        Relationships: [];
      };
      ideas: {
        Row: Idea;
        Insert: Omit<Idea, 'id' | 'created_at' | 'status'>;
        Update: Partial<Omit<Idea, 'id'>>;
        Relationships: [];
      };
      idea_votes: {
        Row: IdeaVote;
        Insert: IdeaVote;
        Update: Record<string, never>;
        Relationships: [];
      };
      notices: {
        Row: Notice;
        Insert: Omit<Notice, 'id' | 'created_at'>;
        Update: Partial<Omit<Notice, 'id'>>;
        Relationships: [];
      };
      notice_reads: {
        Row: NoticeRead;
        Insert: NoticeRead;
        Update: Record<string, never>;
        Relationships: [];
      };
      kpi_items: {
        Row: KpiItem;
        Insert: Omit<KpiItem, 'id' | 'created_at'>;
        Update: Partial<Omit<KpiItem, 'id'>>;
        Relationships: [];
      };
      kpi_records: {
        Row: KpiRecord;
        Insert: Omit<KpiRecord, 'id' | 'created_at'>;
        Update: Partial<Omit<KpiRecord, 'id'>>;
        Relationships: [];
      };
      activities: {
        Row: Activity;
        Insert: Omit<Activity, 'id' | 'created_at'>;
        Update: Partial<Omit<Activity, 'id'>>;
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at' | 'read'>;
        Update: Partial<Omit<Notification, 'id'>>;
        Relationships: [];
      };
      anonymous_notes: {
        Row: AnonymousNote;
        Insert: Omit<AnonymousNote, 'id' | 'created_at' | 'updated_at' | 'status'>;
        Update: Partial<Omit<AnonymousNote, 'id'>>;
        Relationships: [];
      };
      message_threads: {
        Row: MessageThread;
        Insert: Omit<MessageThread, 'id' | 'created_at'>;
        Update: Record<string, never>;
        Relationships: [];
      };
      user_activities: {
        Row: UserActivity;
        Insert: Omit<UserActivity, 'id' | 'created_at'>;
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: {
      idea_with_votes: {
        Row: IdeaWithVotes;
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
  };
}

// ===== Row Types =====

export interface Profile {
  id: string;
  emp_no: string | null;
  name: string;
  team: '증권ITO' | '생명ITO' | '손보ITO' | '한금서';
  role: 'admin' | 'leader' | 'member';
  unit: '조직' | '품질' | '전략' | 'AX' | null;
  avatar_color: string;
  avatar_emoji: string;
  avatar_url: string | null;
  status: 'online' | 'offline' | '재택';
  mood_emoji: string | null;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
}

export interface InviteCode {
  id: string;
  code: string;
  created_by: string | null;
  team: string | null;
  role: string;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

export interface Voc {
  id: string;
  author_id: string | null;
  anonymous: boolean;
  category: '불편' | '요청' | '칭찬' | '개선' | '기타';
  title: string;
  content: string;
  team: string;
  target_area: '업무환경' | '성장' | '관계' | '기타' | null;
  status: '접수' | '검토중' | '처리중' | '완료' | '보류';
  assignee_id: string | null;
  resolution: string | null;
  attachment_urls: string[] | null;
  session_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Idea {
  id: string;
  author_id: string | null;
  title: string;
  description: string;
  category: '이벤트' | '인적교류' | '업무개선' | '기타' | null;
  status: '제안' | '검토' | '채택' | '진행중' | '완료' | '반려';
  created_at: string;
}

export interface IdeaVote {
  idea_id: string;
  user_id: string;
  created_at: string;
}

export interface IdeaWithVotes extends Idea {
  vote_count: number;
}

export interface Notice {
  id: string;
  author_id: string | null;
  title: string;
  content: string;
  urgency: '긴급' | '할일' | '참고';
  category: '일반' | '이벤트' | '활동보고';
  pinned: boolean;
  unit: string | null;
  team: string | null;
  attachment_urls: string[] | null;
  created_at: string;
}

export interface NoticeRead {
  notice_id: string;
  user_id: string;
  read_at: string;
}

export interface KpiItem {
  id: string;
  unit: string;
  title: string;
  description: string | null;
  max_score: number;
  quarter: string;
  created_at: string;
}

export interface KpiRecord {
  id: string;
  kpi_item_id: string;
  user_id: string;
  month: string;
  score: number | null;
  evidence: string | null;
  created_at: string;
}

export interface Activity {
  id: string;
  unit: string;
  task: string | null;
  title: string;
  description: string | null;
  date: string;
  participants: number;
  evidence_url: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  type: string;
  urgency: '긴급' | '할일' | '참고';
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  channel: string;
  created_at: string;
}

export interface AnonymousNote {
  id: string;
  sender_id: string | null;
  anonymous: boolean;
  recipient_role: 'leader' | 'admin' | 'team_leaders';
  recipient_team: string | null;
  category: '건의' | '질문' | '감사' | '불편' | '기타' | null;
  title: string;
  content: string;
  team: string;
  status: '미읽음' | '읽음' | '답변완료';
  session_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageThread {
  id: string;
  ref_type: 'voc' | 'note';
  ref_id: string;
  sender_role: 'author' | 'manager';
  message: string;
  created_at: string;
}

export interface UserActivity {
  id: string;
  user_id: string | null;
  team: string;
  activity_type:
    | 'voc_submit'
    | 'idea_submit'
    | 'idea_vote'
    | 'notice_read'
    | 'event_join'
    | 'note_send'
    | 'exchange_join';
  points: number;
  ref_id: string | null;
  created_at: string;
}
