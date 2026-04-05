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

    // Extract additional meta tags (og:type, og:site_name, keywords)
    const ogSiteName = html.match(/<meta\s+property="og:site_name"[^>]*content="([^"]+)"/i)?.[1] || ''
    const kwMatch = html.match(/<meta\s+name="keywords"[^>]*content="([^"]+)"/i)?.[1] || ''

    // OPTIMIZATION: If meta tags give us enough info, skip Haiku call (~2s saved)
    if (metaTitle && metaDesc && metaDesc.length > 30) {
      // Extract brand name from title (before | or - or :)
      const brandName = metaTitle.split(/[|\-–:]/)[0].trim()
      const quickAnalysis = {
        business_name: ogSiteName || brandName,
        business_type: metaDesc,
        products_services: '',
        target_audience: '',
        value_proposition: metaTitle,
        tone: '',
        industry: '',
        key_phrases: kwMatch ? kwMatch.split(',').map((k: string) => k.trim()).slice(0, 5) : [],
        _source: 'meta_tags_only',
      }

      // Only call Haiku if we need deeper analysis (visible text has content)
      if (cleaned.length < 200) {
        return NextResponse.json({ ok: true, url: urlNorm, title: metaTitle, description: metaDesc, analysis: quickAnalysis })
      }
    }

    // Full Haiku analysis for rich sites with visible text
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      temperature: 0.2, // Factual — don't invent
      messages: [{
        role: 'user',
        content: `Analyze this website and extract business information. Return ONLY a JSON object.

URL: ${urlNorm}
META TITLE: ${metaTitle}
META DESCRIPTION: ${metaDesc}
${ogSiteName ? `SITE NAME: ${ogSiteName}` : ''}
${kwMatch ? `KEYWORDS: ${kwMatch}` : ''}

VISIBLE TEXT FROM SITE:
${cleaned}

RULES:
1. business_name: Use og:site_name or the first part of the title (before | or -)
2. business_type: Use the meta description LITERALLY. Do NOT rephrase or "improve" it.
3. products_services: List only what you can FIND in the text. If unclear, leave empty.
4. target_audience: Infer from the text. If unclear, leave empty.
5. value_proposition: Use the headline or tagline from the visible text.
6. tone: Based on word choice in the text (formal/casual/scientific/premium).
7. key_phrases: Extract 3-5 ACTUAL phrases from the text, verbatim.
8. NEVER invent information not present in the text.

Return JSON:
{
  "business_name": "", "business_type": "", "products_services": "",
  "target_audience": "", "value_proposition": "", "tone": "",
  "industry": "", "key_phrases": []
}

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
