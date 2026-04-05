import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    const urlNorm = url.startsWith('http') ? url : `https://${url}`

    // Fetch the raw HTML
    const ac = new AbortController()
    setTimeout(() => ac.abort(), 10000)
    const res = await fetch(urlNorm, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VokuBot/1.0)', Accept: 'text/html' },
      signal: ac.signal,
    })

    if (!res.ok) return NextResponse.json({ error: `HTTP ${res.status}` })

    const html = await res.text()

    // Strip scripts, styles, SVGs to reduce token count — keep only visible text
    const cleaned = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 6000) // max ~6k chars for Claude

    // Also extract structured data from meta tags (always reliable)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const descMatch = html.match(/<meta\s+(?:name|property)="(?:description|og:description)"[^>]*content="([^"]+)"/i)
      || html.match(/<meta\s+content="([^"]+)"[^>]*(?:name|property)="(?:description|og:description)"/i)

    const metaTitle = titleMatch ? titleMatch[1].trim() : ''
    const metaDesc = descMatch ? descMatch[1].trim() : ''

    // Use Haiku to analyze the site content (fast, cheap)
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Analyze this website and extract business information. Return ONLY a JSON object.

URL: ${urlNorm}
META TITLE: ${metaTitle}
META DESCRIPTION: ${metaDesc}

VISIBLE TEXT FROM SITE:
${cleaned}

Return this exact JSON structure (fill what you can find, leave empty string if not found):
{
  "business_name": "company/brand name",
  "business_type": "what the company does in 1 sentence",
  "products_services": "main products or services offered",
  "target_audience": "who the company serves",
  "value_proposition": "main value proposition or tagline",
  "tone": "perceived brand tone (professional/casual/premium/scientific/etc)",
  "industry": "industry sector",
  "key_phrases": ["3-5 key phrases from the site that define the brand"]
}

Use the ACTUAL text from the site. Do NOT invent or assume anything not present in the text.
Return ONLY valid JSON.`,
      }],
    })

    const analysisText = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
    let analysis: any
    try {
      analysis = JSON.parse(analysisText.replace(/```json\n?/g, '').replace(/```/g, '').trim())
    } catch {
      analysis = { business_name: metaTitle, business_type: metaDesc }
    }

    return NextResponse.json({
      ok: true,
      url: urlNorm,
      title: metaTitle,
      description: metaDesc,
      analysis,
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message })
  }
}
