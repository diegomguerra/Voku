import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = supabaseAdmin()

    // Fetch media_posts and media_spend in parallel
    const [postsResult, spendResult] = await Promise.all([
      db
        .from('media_posts')
        .select('id, title, platform, likes, comments, shares, saves, reach, impressions, published_at'),
      db
        .from('media_spend')
        .select('id, amount, leads_generated, month'),
    ])

    if (postsResult.error) throw postsResult.error
    if (spendResult.error) throw spendResult.error

    const posts = postsResult.data ?? []
    const spends = spendResult.data ?? []

    // --- media_posts aggregates ---

    const total_posts = posts.length

    // posts_by_platform
    const platformMap: Record<string, number> = {}
    for (const p of posts) {
      const key = p.platform ?? 'unknown'
      platformMap[key] = (platformMap[key] || 0) + 1
    }
    const posts_by_platform = Object.entries(platformMap).map(([platform, count]) => ({
      platform,
      count,
    }))

    // total_reach / total_impressions
    const total_reach = posts.reduce((sum, p) => sum + (Number(p.reach) || 0), 0)
    const total_impressions = posts.reduce((sum, p) => sum + (Number(p.impressions) || 0), 0)

    // avg_engagement: average of (likes+comments+shares+saves)/impressions*100 where impressions > 0
    const engageablePosts = posts.filter((p) => Number(p.impressions) > 0)
    const avg_engagement =
      engageablePosts.length > 0
        ? Math.round(
            (engageablePosts.reduce((sum, p) => {
              const interactions =
                (Number(p.likes) || 0) +
                (Number(p.comments) || 0) +
                (Number(p.shares) || 0) +
                (Number(p.saves) || 0)
              return sum + (interactions / Number(p.impressions)) * 100
            }, 0) /
              engageablePosts.length) *
              100
          ) / 100
        : 0

    // top_posts: top 10 by (likes+comments+shares)
    const top_posts = [...posts]
      .sort((a, b) => {
        const scoreA =
          (Number(a.likes) || 0) + (Number(a.comments) || 0) + (Number(a.shares) || 0)
        const scoreB =
          (Number(b.likes) || 0) + (Number(b.comments) || 0) + (Number(b.shares) || 0)
        return scoreB - scoreA
      })
      .slice(0, 10)
      .map((p) => ({
        title: p.title,
        platform: p.platform,
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
        reach: p.reach,
        published_at: p.published_at,
      }))

    // weekly_growth: posts grouped by ISO week with sums per platform
    const weeklyMap: Record<string, Record<string, { likes: number; comments: number; shares: number }>> = {}
    for (const p of posts) {
      if (!p.published_at) continue
      const d = new Date(p.published_at)
      // ISO week start (Monday)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      const weekStart = new Date(d.getFullYear(), d.getMonth(), diff)
      const weekKey = weekStart.toISOString().slice(0, 10)
      const platform = p.platform ?? 'unknown'

      if (!weeklyMap[weekKey]) weeklyMap[weekKey] = {}
      if (!weeklyMap[weekKey][platform]) {
        weeklyMap[weekKey][platform] = { likes: 0, comments: 0, shares: 0 }
      }
      weeklyMap[weekKey][platform].likes += Number(p.likes) || 0
      weeklyMap[weekKey][platform].comments += Number(p.comments) || 0
      weeklyMap[weekKey][platform].shares += Number(p.shares) || 0
    }

    const weekly_growth = Object.entries(weeklyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, platforms]) => ({
        week,
        platforms: Object.entries(platforms).map(([platform, stats]) => ({
          platform,
          ...stats,
        })),
      }))

    // --- media_spend aggregates ---

    const total_spend =
      Math.round(spends.reduce((sum, s) => sum + (Number(s.amount) || 0), 0) * 100) / 100
    const total_leads = spends.reduce((sum, s) => sum + (Number(s.leads_generated) || 0), 0)

    // spend_by_month
    const spendMonthMap: Record<string, { amount: number; leads: number }> = {}
    for (const s of spends) {
      const key = s.month ?? 'unknown'
      if (!spendMonthMap[key]) spendMonthMap[key] = { amount: 0, leads: 0 }
      spendMonthMap[key].amount += Number(s.amount) || 0
      spendMonthMap[key].leads += Number(s.leads_generated) || 0
    }
    const spend_by_month = Object.entries(spendMonthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        amount: Math.round(data.amount * 100) / 100,
        leads: data.leads,
      }))

    return NextResponse.json({
      total_posts,
      posts_by_platform,
      total_reach,
      total_impressions,
      avg_engagement,
      top_posts,
      weekly_growth,
      total_spend,
      total_leads,
      spend_by_month,
    })
  } catch (err: unknown) {
    console.error('[admin/media]', err)
    return NextResponse.json(
      { error: 'Failed to fetch media data' },
      { status: 500 }
    )
  }
}
