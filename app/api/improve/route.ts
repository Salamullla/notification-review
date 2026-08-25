import { NextRequest, NextResponse } from 'next/server'

function normalizeGreeting(body: string, language: 'ar' | 'en' = 'ar') {
  const lines = body.split('\n')
  const firstNonEmpty = lines.findIndex(line => line.trim().length > 0)
  if (firstNonEmpty === -1) return body

  const first = lines[firstNonEmpty].trim()
  const parameterMatch = first.match(/#([A-Za-z][A-Za-z0-9_]*)/)
  const looksLikeGreeting = /^(أهلًا|أهلاً|عزيزي(?:\/عزيزتي)?|عزيزتي|عزيزنا المستخدم|مرحبًا|مرحبا|Hello|Dear)\b/i.test(first)

  if (parameterMatch && looksLikeGreeting) {
    const param = `#${parameterMatch[1]}`
    lines[firstNonEmpty] = language === 'en' ? `Hello, ${param}` : `أهلًا، ${param}`
  }

  return lines.join('\n')
}

function hasClosing(body: string) {
  const trimmed = body.trim()
  return /(?:مع أطيب التحيات،?|Best regards,?)\s*\n+[^\n]+\.?\s*$/i.test(trimmed)
}

export async function POST(req: NextRequest){
  const { channel, title = '', body = '', language = 'ar' } = await req.json()

  let improvedTitle = title.trim().replace(/^إشعار\s+(ب|بـ|عن)\s*/, '').replace(/\s+/g, ' ')
  if(improvedTitle.length > 80) improvedTitle = improvedTitle.slice(0, 77).trim() + '…'

  let improvedBody = body.trim()
    .replace(/^(نود\s+(إفادتكم|إبلاغكم)\s+بأن|نفيدكم\s+بأن)\s*/, '')
    .replace(/\bتم\s+([^\n.،]+)/g, '$1')
    .replace(/اضغط\s+هنا/g, 'انتقل إلى الرابط')
    .replace(/انقر\s+هنا/g, 'انتقل إلى الرابط')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')

  if(channel === 'email'){
    improvedBody = normalizeGreeting(improvedBody, language === 'en' ? 'en' : 'ar')

    const firstNonEmpty = improvedBody.split('\n').find(line => line.trim())?.trim() || ''
    const hasGreeting = /^(أهلًا|أهلاً|عزيزي(?:\/عزيزتي)?|عزيزتي|عزيزنا المستخدم|مرحبًا|مرحبا|Hello|Dear)\b/i.test(firstNonEmpty)

    if(!hasGreeting) {
      improvedBody = language === 'en'
        ? `Hello,\n\n${improvedBody}`
        : `عزيزنا المستخدم،\n\n${improvedBody}`
    }

    // نحافظ على الخاتمة واسم الجهة الموجودين في النص ولا نضيف «اعتماد» تلقائيًا.
    if(!hasClosing(improvedBody) && language === 'en') {
      // لا نضيف جهة افتراضية إذا لم تكن معروفة.
    }
  }

  return NextResponse.json({ title: channel === 'sms' ? '' : improvedTitle, body: improvedBody })
}
