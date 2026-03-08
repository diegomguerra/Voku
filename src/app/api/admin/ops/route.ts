import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = supabaseAdmin()

    // Fetch all orders once to compute aggregates in JS
    const { data: orders, error } = await db
      .from('orders')
      .select('id, order_number, product, status, currency, amount, created_at, delivered_at, delivery_deadline')

    if (error) throw error

    const allOrders = orders ?? []

    // total_orders
    const total_orders = allOrders.length

    // active_orders
    const active_orders = allOrders.filter(
      (o) => o.status === 'briefing' || o.status === 'in_production'
    ).length

    // delivered_orders
    const deliveredOrders = allOrders.filter((o) => o.status === 'delivered')
    const delivered_orders = deliveredOrders.length

    // revenue_usd / revenue_brl
    const revenue_usd = deliveredOrders
      .filter((o) => o.currency === 'USD')
      .reduce((sum, o) => sum + (Number(o.amount) || 0), 0)

    const revenue_brl = deliveredOrders
      .filter((o) => o.currency === 'BRL')
      .reduce((sum, o) => sum + (Number(o.amount) || 0), 0)

    // avg_delivery_hours
    const deliveryHours = deliveredOrders
      .filter((o) => o.delivered_at && o.created_at)
      .map((o) => {
        const created = new Date(o.created_at).getTime()
        const delivered = new Date(o.delivered_at).getTime()
        return (delivered - created) / (1000 * 60 * 60)
      })
    const avg_delivery_hours =
      deliveryHours.length > 0
        ? Math.round((deliveryHours.reduce((a, b) => a + b, 0) / deliveryHours.length) * 100) / 100
        : 0

    // product_mix
    const productMap: Record<string, number> = {}
    for (const o of allOrders) {
      const key = o.product ?? 'unknown'
      productMap[key] = (productMap[key] || 0) + 1
    }
    const product_mix = Object.entries(productMap).map(([product, count]) => ({
      product,
      count,
    }))

    // recent_orders (latest 10 by created_at)
    const recent_orders = [...allOrders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((o) => ({
        order_number: o.order_number,
        product: o.product,
        status: o.status,
        currency: o.currency,
        amount: o.amount,
        created_at: o.created_at,
        delivery_deadline: o.delivery_deadline,
      }))

    // monthly_revenue (last 6 months)
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const monthlyMap: Record<string, number> = {}

    // Initialise all 6 months so we always return them even if empty
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyMap[key] = 0
    }

    for (const o of deliveredOrders) {
      const d = new Date(o.created_at)
      if (d >= sixMonthsAgo) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (key in monthlyMap) {
          monthlyMap[key] += Number(o.amount) || 0
        }
      }
    }

    const monthly_revenue = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount: Math.round(amount * 100) / 100 }))

    return NextResponse.json({
      total_orders,
      active_orders,
      delivered_orders,
      revenue_usd: Math.round(revenue_usd * 100) / 100,
      revenue_brl: Math.round(revenue_brl * 100) / 100,
      avg_delivery_hours,
      product_mix,
      recent_orders,
      monthly_revenue,
    })
  } catch (err: unknown) {
    console.error('[admin/ops]', err)
    return NextResponse.json(
      { error: 'Failed to fetch ops data' },
      { status: 500 }
    )
  }
}
