import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest){
  const { channel, title = '', body = '' } = await req.json()

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
    if(!/^(أهلاً|عزيزنا المستخدم|مع التحية والتقدير)/.test(improvedBody)) improvedBody = `عزيزنا المستخدم،\n\n${improvedBody}`
    if(!/مع أطيب التحيات[\s\S]*اعتماد/.test(improvedBody)) improvedBody += '\n\nمع أطيب التحيات،\nاعتماد'
  }

  return NextResponse.json({ title: channel === 'sms' ? '' : improvedTitle, body: improvedBody })
}
