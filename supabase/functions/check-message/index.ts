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

serve(async (req) => {
  // CORS 프리플라이트
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { message } = await req.json()

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

    const prompt = `당신은 사내 익명 메시지의 안전성을 판정하는 모더레이터입니다.
아래 메시지를 분석하고 JSON만으로 답변하세요. 다른 텍스트는 절대 포함하지 마세요.

판정 기준:
- 비방, 인격공격, 협박 → unsafe
- 특정 개인에 대한 악의적 험담이나 모함 → unsafe
- 성희롱·직장 내 괴롭힘에 해당하는 표현 → unsafe
- 건설적 비판, 업무 불만, 개선 요청 → safe
- 일상적 인사, 감사, 응원, 격려 → safe

메시지: "${maskedText}"

{"safe": true/false, "reason": "판정 사유(10자 이내)"}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 100 },
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
    const jsonMatch = raw.match(/\{[^}]+\}/)
    if (!jsonMatch) {
      return new Response(JSON.stringify({ safe: true, reason: 'parse_error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let result: { safe: boolean; reason?: string }
    try {
      result = JSON.parse(jsonMatch[0])
    } catch {
      return new Response(JSON.stringify({ safe: true, reason: 'parse_error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({ safe: !!result.safe, reason: result.reason ?? '' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch {
    return new Response(JSON.stringify({ safe: true, reason: 'error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
