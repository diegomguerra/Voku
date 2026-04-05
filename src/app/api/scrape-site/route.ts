import { NextResponse } from 'next/server'

export const maxDuration = 15

export async function POST(req: Request) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    const urlNorm = url.startsWith('http') ? url : `https://${url}`

    const ac = new AbortController()
    setTimeout(() => ac.abort(), 10000)
    const res = await fetch(urlNorm, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VokuBot/1.0)', Accept: 'text/html' },
      signal: ac.signal,
    })

    if (!res.ok) return NextResponse.json({ error: `HTTP ${res.status}`, content: '' })

    const html = await res.text()

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : ''

    // Extract meta description
    const descMatch = html.match(/<meta\s+(?:name|property)="(?:description|og:description)"[^>]*content="([^"]+)"/i)
      || html.match(/<meta\s+content="([^"]+)"[^>]*(?:name|property)="(?:description|og:description)"/i)
    const description = descMatch ? descMatch[1].trim() : ''

    // Extract h1, h2, h3 headings
    const headings: string[] = []
    const hRe = /<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi
    let hMatch
    while ((hMatch = hRe.exec(html)) !== null && headings.length < 10) {
      const text = hMatch[1].replace(/\s+/g, ' ').trim()
      if (text.length > 3 && text.length < 200) headings.push(text)
    }

    // Extract visible paragraphs (first 5 meaningful ones)
    const paragraphs: string[] = []
    const pRe = /<p[^>]*>([^<]{20,})<\/p>/gi
    let pMatch
    while ((pMatch = pRe.exec(html)) !== null && paragraphs.length < 5) {
      const text = pMatch[1].replace(/\s+/g, ' ').replace(/&[a-z]+;/gi, ' ').trim()
      if (text.length > 20) paragraphs.push(text.slice(0, 200))
    }

    // Extract meta keywords
    const kwMatch = html.match(/<meta\s+name="keywords"[^>]*content="([^"]+)"/i)
    const keywords = kwMatch ? kwMatch[1].trim() : ''

    return NextResponse.json({
      ok: true,
      title,
      description,
      headings,
      paragraphs,
      keywords,
      url: urlNorm,
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message, content: '' })
  }
}
