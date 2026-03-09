import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = supabaseAdmin()

    const { data: messages, error: msgErr } = await db
      .from('platform_messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (msgErr) throw msgErr

    const { data: configs, error: cfgErr } = await db
      .from('automation_config')
      .select('*')
      .order('platform')

    if (cfgErr) throw cfgErr

    const all = messages ?? []
    const total = all.length
    const leads = all.filter((m) => m.message_type === 'lead').length
    const inbound = all.filter((m) => m.direction === 'inbound').length
    const outbound = all.filter((m) => m.direction === 'outbound').length
    const repliesSent = all.filter((m) => m.reply_sent).length
    const unreplied = all.filter((m) => m.direction === 'inbound' && !m.reply_sent).length

    const platformBreakdown: Record<string, number> = {}
    for (const m of all) {
      platformBreakdown[m.platform] = (platformBreakdown[m.platform] || 0) + 1
    }

    const typeBreakdown: Record<string, number> = {}
    for (const m of all) {
      typeBreakdown[m.message_type] = (typeBreakdown[m.message_type] || 0) + 1
    }

    return NextResponse.json({
      total,
      leads,
      inbound,
      outbound,
      replies_sent: repliesSent,
      unreplied,
      platform_breakdown: Object.entries(platformBreakdown).map(([platform, count]) => ({ platform, count })),
      type_breakdown: Object.entries(typeBreakdown).map(([type, count]) => ({ type, count })),
      messages: all.slice(0, 50),
      automation_configs: configs ?? [],
    })
  } catch (err: unknown) {
    console.error('[admin/inbox]', err)
    return NextResponse.json(
      { error: 'Failed to fetch inbox data' },
      { status: 500 }
    )
  }
}
