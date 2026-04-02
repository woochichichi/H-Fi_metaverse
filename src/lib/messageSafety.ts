import { supabase } from './supabase'

interface SafetyResult {
  safe: boolean
  reason: string
}

export async function checkMessageSafety(message: string): Promise<SafetyResult> {
  const trimmed = message?.trim()
  if (!trimmed) return { safe: true, reason: 'empty' }
  try {
    const { data, error } = await supabase.functions.invoke('check-message', {
      body: { message: trimmed },
    })
    if (error || !data) return { safe: true, reason: 'invoke_error' }
    return data as SafetyResult
  } catch {
    return { safe: true, reason: 'network_error' }
  }
}
