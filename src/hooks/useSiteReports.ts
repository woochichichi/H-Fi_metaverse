import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { getCapturedLogsText } from '../lib/consoleCapture';
import { withTimeout } from '../lib/utils';
import { SITE_REPORT_DAILY_LIMIT } from '../lib/constants';
import type { SiteReport } from '../types/database';

function collectBrowserMeta() {
  return {
    user_agent: navigator.userAgent,
    screen_size: `${window.innerWidth}x${window.innerHeight} (dpr:${devicePixelRatio})`,
    current_url: window.location.href,
  };
}

export function useSiteReports() {
  const [reports, setReports] = useState<SiteReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuthStore();

  // 내 건의 목록 조회
  const fetchMyReports = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await withTimeout(
        supabase
          .from('site_reports')
          .select('*')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        8000,
        'site_reports_fetch',
      );
      if (fetchError) throw fetchError;
      setReports((data as SiteReport[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '조회 실패');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // 오늘 제출 건수 확인 (스팸 방지)
  const checkDailyLimit = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count, error: countError } = await supabase
      .from('site_reports')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', user.id)
      .gte('created_at', todayStart.toISOString());

    if (countError) return true; // 에러 시 허용
    return (count ?? 0) < SITE_REPORT_DAILY_LIMIT;
  }, [user?.id]);

  // 건의 제출
  const createReport = useCallback(
    async (input: { title: string; content: string; attachment_urls?: string[] }) => {
      if (!user?.id) return { data: null, error: '로그인이 필요합니다' };

      const withinLimit = await checkDailyLimit();
      if (!withinLimit) {
        return { data: null, error: `하루 최대 ${SITE_REPORT_DAILY_LIMIT}건까지 제출할 수 있습니다` };
      }

      const meta = collectBrowserMeta();
      const consoleLogs = getCapturedLogsText();

      const { data, error: insertError } = await supabase
        .from('site_reports')
        .insert({
          author_id: user.id,
          title: input.title,
          content: input.content,
          user_agent: meta.user_agent,
          screen_size: meta.screen_size,
          current_url: meta.current_url,
          console_logs: consoleLogs || null,
          attachment_urls: input.attachment_urls?.length ? input.attachment_urls : null,
        })
        .select()
        .single();

      if (insertError) {
        return { data: null, error: insertError.message };
      }

      // admin에게 알림 전송
      await supabase.from('notifications').insert({
        user_id: null, // broadcast — admin RLS로 필터
        type: 'site_report',
        urgency: '참고' as const,
        title: '새 사이트 건의',
        body: `${profile?.name ?? '사용자'}님이 건의를 등록했습니다: ${input.title}`,
        link: `/site-report/${(data as SiteReport).id}`,
        channel: 'inbox',
      });

      return { data: data as SiteReport, error: null };
    },
    [user?.id, profile?.name, checkDailyLimit],
  );

  return { reports, loading, error, fetchMyReports, createReport };
}
