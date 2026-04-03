import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function maskPersonalInfo(text: string): string {
  // 한국어 이름+직급 패턴 (2~4글자+직급)
  text = text.replace(/[가-힣]{2,4}(팀장|대리|과장|부장|사원|차장|상무|전무)/g, '[직원A]')
  // 한국어 이름+님/씨 패턴
  text = text.replace(/[가-힣]{2,4}(님|씨)/g, '[인물B]')
  // 전화번호 패턴
  text = text.replace(/\d{2,3}[-.\s]?\d{3,4}[-.\s]?\d{4}/g, '[전화번호]')
  // 이메일 패턴
  text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[이메일]')
  return text
}

async function logModeration(channel: string, maskedContent: string, reason: string, safe: boolean) {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/moderation_logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ channel, masked_content: maskedContent, reason, safe }),
    })
  } catch {
    // 로그 실패해도 판정 결과에 영향 없음
  }
}

serve(async (req) => {
  // CORS 프리플라이트
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { message, channel = 'unknown' } = await req.json()

    // 빈 메시지 즉시 safe 반환
    const trimmed = message?.trim?.() ?? ''
    if (!trimmed) {
      return new Response(JSON.stringify({ safe: true, reason: 'empty' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ safe: true, reason: 'no_api_key' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const maskedText = maskPersonalInfo(trimmed)

    const prompt = `당신은 한국 직장 내 메시지 안전성 분류기입니다.

[UNSAFE 예시 - safe: false]
- 무능한 놈 당장 짤려야 해
- 저 사람은 회사에 해가 되는 인간이야
- 성과도 없으면서 자리만 차지하고 있잖아

[SAFE 예시 - safe: true]
- 안녕하세요 좋은 하루 보내세요
- 업무 프로세스 개선이 필요할 것 같습니다
- 오늘 회의 수고하셨습니다

판정 기준: 특정인/집단을 향한 비방·인격공격·협박·성희롱·괴롭힘이면 false, 그 외 일반적 직장 메시지면 true.

아래 메시지를 판정하세요:
${maskedText}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 50,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'object',
              properties: {
                safe: { type: 'boolean' },
                reason: { type: 'string' },
              },
              required: ['safe', 'reason'],
            },
          },
        }),
      }
    )

    if (!response.ok) {
      return new Response(JSON.stringify({ safe: true, reason: 'api_error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const geminiData = await response.json()
    const raw: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // JSON 파싱 — 실패 시 safe: true 폴백
    let result: { safe: boolean; reason?: string }
    try {
      result = JSON.parse(raw)
    } catch {
      return new Response(JSON.stringify({ safe: true, reason: 'parse_error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const isSafe = !!result.safe
    const reason = result.reason ?? ''

    // unsafe 판정 시 moderation_logs에 기록 (비동기, 실패해도 무관)
    if (!isSafe) {
      logModeration(channel, maskedText, reason, isSafe)
    }

    return new Response(
      JSON.stringify({ safe: isSafe, reason }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch {
    return new Response(JSON.stringify({ safe: true, reason: 'error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
