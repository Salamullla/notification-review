import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest){
  const { channel, title = '', body = '' } = await req.json()
  const issues:any[] = []

  if(channel !== 'sms'){
    if(!title.trim()) issues.push({ level:'bad', title:'العنوان مفقود', text:'أضف عنوانًا مختصرًا يدخل مباشرة في صلب الموضوع.' })
    else if(title.length > 80) issues.push({ level:'warn', title:'العنوان طويل', text:'اختصر العنوان قدر المستطاع.' })
    if(/^إشعار\s+(ب|بـ|عن)/.test(title)) issues.push({ level:'warn', title:'العنوان عام', text:'ابدأ بالموضوع نفسه بدل «إشعار بـ…».' })
  }

  if(!body.trim()) issues.push({ level:'bad', title:'نص الإشعار مفقود', text:'أدخل نص الإشعار للمراجعة.' })
  else {
    if(body.length > 500) issues.push({ level:'warn', title:'النص طويل', text:'اختصر المحتوى وركّز على الخبر والتوجيه.' })
    if(/نود\s+(إفادتكم|إبلاغكم)|نفيدكم بأن/.test(body)) issues.push({ level:'warn', title:'مقدمة زائدة', text:'ابدأ مباشرة بالمعلومة المهمة.' })
    const tam = (body.match(/\bتم\b/g) || []).length
    if(tam > 1) issues.push({ level:'warn', title:'تكرار كلمة «تم»', text:`ظهرت ${tam} مرات.` })
    if(/اضغط\s+هنا|انقر\s+هنا/.test(body)) issues.push({ level:'bad', title:'صياغة رابط غير مفضلة', text:'اجعل الكلمة المفتاحية نفسها قابلة للنقر.' })
  }

  let score = 100
  issues.forEach(i => { if(i.level === 'bad') score -= 18; if(i.level === 'warn') score -= 8 })
  return NextResponse.json({ score: Math.max(0, Math.min(100, score)), issues })
}
