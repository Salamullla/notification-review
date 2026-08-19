'use client'

import { useEffect, useMemo, useState } from 'react'

type Channel = 'email' | 'sms' | 'push'
type Guideline = { id:number; التصنيف:string; 'رقم المعيار':number; المعيار:string }
type Issue = { level:'ok'|'warn'|'bad'; title:string; text:string }

const labels: Record<Channel,string> = { email:'البريد الإلكتروني', sms:'رسالة نصية', push:'إشعار Push' }

export default function Home(){
  const [channel,setChannel]=useState<Channel>('email')
  const [title,setTitle]=useState('')
  const [body,setBody]=useState('')
  const [guidelines,setGuidelines]=useState<Guideline[]>([])
  const [loadingGuidelines,setLoadingGuidelines]=useState(true)
  const [issues,setIssues]=useState<Issue[]>([])
  const [score,setScore]=useState<number|null>(null)
  const [improved,setImproved]=useState<{title:string;body:string}|null>(null)

  useEffect(()=>{
    fetch('/api/guidelines').then(r=>r.json()).then(data=>{
      setGuidelines(data.guidelines ?? [])
    }).catch(()=>setGuidelines([])).finally(()=>setLoadingGuidelines(false))
  },[])

  useEffect(()=>{ if(channel==='sms') setTitle('') },[channel])

  const grouped = useMemo(()=>{
    return guidelines.reduce<Record<string,Guideline[]>>((acc,g)=>{
      const key=g['التصنيف'] || 'غير مصنف'; (acc[key] ||= []).push(g); return acc
    },{})
  },[guidelines])

  function review(){
    const result:Issue[]=[]
    if(channel!=='sms'){
      if(!title.trim()) result.push({level:'bad',title:'العنوان مفقود',text:'أضف عنوانًا مختصرًا يدخل مباشرة في صلب الموضوع.'})
      else if(title.length>80) result.push({level:'warn',title:'العنوان طويل',text:'اختصر العنوان قدر المستطاع.'})
      else result.push({level:'ok',title:'العنوان واضح',text:'طول العنوان مناسب مبدئيًا.'})
      if(/^إشعار\s+(ب|بـ|عن)/.test(title)) result.push({level:'warn',title:'العنوان عام',text:'ابدأ بالموضوع نفسه بدل «إشعار بـ…».'})
    }
    if(!body.trim()) result.push({level:'bad',title:'نص الإشعار مفقود',text:'أدخل نص الإشعار للمراجعة.'})
    else {
      if(body.length>500) result.push({level:'warn',title:'النص طويل',text:'اختصر المحتوى وركّز على الخبر والتوجيه.'})
      else result.push({level:'ok',title:'طول النص مناسب',text:'النص مختصر بشكل مبدئي.'})
      if(/نود\s+(إفادتكم|إبلاغكم)|نفيدكم بأن/.test(body)) result.push({level:'warn',title:'مقدمة زائدة',text:'ابدأ مباشرة بالمعلومة المهمة.'})
      const tam=(body.match(/\bتم\b/g)||[]).length
      if(tam>1) result.push({level:'warn',title:'تكرار كلمة «تم»',text:`ظهرت ${tam} مرات. استخدمها فقط عند الحاجة.`})
      if(/اضغط\s+هنا|انقر\s+هنا/.test(body)) result.push({level:'bad',title:'صياغة رابط غير مفضلة',text:'اجعل الكلمة المفتاحية نفسها قابلة للنقر.'})
      if(/#[^\s.,،؛:!?]*[\u0600-\u06FF]/.test(body)) result.push({level:'bad',title:'اسم متغير بالعربية',text:'اكتب اسم القيمة المتغيرة بالإنجليزية حتى في النسخة العربية.'})
      if(channel==='email'){
        if(!/^(أهلاً|عزيزنا المستخدم|مع التحية والتقدير)/.test(body.trim())) result.push({level:'warn',title:'العبارة الترحيبية غير واضحة',text:'استخدم عبارة ترحيبية مناسبة حسب نوع المخاطب.'})
        if(!/مع أطيب التحيات[\s\S]*اعتماد/.test(body)) result.push({level:'warn',title:'الخاتمة تحتاج مراجعة',text:'استخدم الخاتمة المعتمدة عند الحاجة.'})
      }
      if(body.split(/\n+/).some(p=>p.length>220)) result.push({level:'warn',title:'فقرة طويلة',text:'قسّم المحتوى إلى قطع صغيرة يسهل مسحها بصريًا.'})
    }
    let value=100
    result.forEach(i=>{ if(i.level==='bad') value-=18; if(i.level==='warn') value-=8 })
    setIssues(result); setScore(Math.max(0,Math.min(100,value)))
  }

  function improve(){
    let nextTitle=title.trim().replace(/^إشعار\s+(ب|بـ|عن)\s*/,'').replace(/\s+/g,' ')
    if(nextTitle.length>80) nextTitle=nextTitle.slice(0,77).trim()+'…'
    let nextBody=body.trim()
      .replace(/^(نود\s+(إفادتكم|إبلاغكم)\s+بأن|نفيدكم\s+بأن)\s*/,'')
      .replace(/\bتم\s+([^\n.،]+)/g,'$1')
      .replace(/اضغط\s+هنا/g,'انتقل إلى الرابط')
      .replace(/انقر\s+هنا/g,'انتقل إلى الرابط')
      .replace(/[ \t]+/g,' ')
      .replace(/\n{3,}/g,'\n\n')
      .replace(/نأمل منكم/g,'نأمل منك')
      .replace(/يرجى منكم/g,'يرجى منك')
      .replace(/يمكنكم/g,'يمكنك')
    if(channel==='email'){
      if(!/^(أهلاً|عزيزنا المستخدم|مع التحية والتقدير)/.test(nextBody)) nextBody='عزيزنا المستخدم،\n\n'+nextBody
      if(!/مع أطيب التحيات[\s\S]*اعتماد/.test(nextBody)) nextBody+='\n\nمع أطيب التحيات،\nاعتماد'
    }
    setImproved({title:channel==='sms'?'':nextTitle,body:nextBody})
  }

  const scoreLabel = score===null ? 'لم تتم المراجعة بعد' : score>=85 ? 'ملتزم بدرجة عالية' : score>=65 ? 'يحتاج بعض التحسينات' : 'يحتاج مراجعة'

  return <div className="shell">
    <aside className="sidebar">
      <div className="logo">مراجع الإشعارات</div>
      <div className="logoSub">منصة لمراجعة وتحسين الإشعارات وفق المعايير المعتمدة.</div>
      <nav className="nav">
        <div className="navItem active">مراجعة إشعار</div>
        <div className="navItem">السجل</div>
        <div className="navItem">المعايير</div>
        <div className="navItem">الإعدادات</div>
      </nav>
    </aside>

    <main className="main">
      <div className="topbar">
        <div>
          <h1 className="title">مراجعة إشعار</h1>
          <div className="subtitle">اكتب الإشعار، راجعه مقابل المعايير، ثم حسّن الصياغة إذا احتجت.</div>
        </div>
        <div className="status">{loadingGuidelines?'جاري تحميل المعايير…':`${guidelines.length} معيار من Supabase`}</div>
      </div>

      <div className="workspace">
        <section className="card">
          <h2>محرر الإشعار</h2>
          <div className="channelTabs">
            {(Object.keys(labels) as Channel[]).map(c=><button key={c} className={`tab ${channel===c?'active':''}`} onClick={()=>setChannel(c)}>{labels[c]}</button>)}
          </div>

          {channel!=='sms' && <div className="field">
            <div className="label"><span>العنوان</span><span className="counter">{title.length} حرف</span></div>
            <input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="مثال: طلب حذف المشروع رقم #ProjectNumber" />
          </div>}

          <div className="field">
            <div className="label"><span>نص الإشعار</span><span className="counter">{body.length} حرف</span></div>
            <textarea className="textarea" value={body} onChange={e=>setBody(e.target.value)} placeholder="اكتب نص الإشعار هنا…" />
          </div>
          <div className="actions">
            <button className="primary" onClick={review}>مراجعة الإشعار</button>
            <button className="secondary" onClick={improve}>تحسين الصياغة</button>
          </div>
        </section>

        <div>
          <section className="card">
            <h2>المعاينة</h2>
            <div className="previewBox">
              {channel!=='sms' && <div className="previewHead">{title || 'عنوان الإشعار'}</div>}
              <div className="previewBody">{body || 'سيظهر نص الإشعار هنا.'}</div>
            </div>
          </section>

          <section className="card sectionGap">
            <h2>نتيجة المراجعة</h2>
            <div className="resultHeader">
              <div className="score">{score===null?'—':`${score}%`}</div>
              <div className="resultText"><strong>{scoreLabel}</strong><span className="muted">{score===null?'ستظهر الملاحظات هنا بعد المراجعة.':`${issues.length} نقطة تمت مراجعتها.`}</span></div>
            </div>
            <div className="issues">
              {issues.map((i,idx)=><div key={idx} className={`issue ${i.level}`}><div className="issueTitle">{i.title}</div><div className="issueText">{i.text}</div></div>)}
            </div>
          </section>
        </div>
      </div>

      {improved && <section className="card sectionGap">
        <h2>قبل / بعد</h2>
        <div className="beforeAfter">
          <div className="comparePane"><h3>النص الحالي</h3><div className="compareText">{channel!=='sms' && title ? `${title}\n\n`:''}{body}</div></div>
          <div className="comparePane"><h3>الصياغة المحسّنة</h3><div className="compareText">{channel!=='sms' && improved.title ? `${improved.title}\n\n`:''}{improved.body}</div></div>
        </div>
        <div className="actions"><button className="primary" onClick={()=>{setTitle(improved.title);setBody(improved.body);setImproved(null)}}>استخدام الصياغة المحسّنة</button></div>
      </section>}

      <section className="card guidelines" id="guidelines">
        <h2>المعايير المعتمدة</h2>
        <div className="muted">تُحمّل مباشرة من Supabase، بحيث تنعكس أي تعديلات على المصدر دون تغيير الواجهة.</div>
        {Object.entries(grouped).map(([cat,items])=><div className="guidelineGroup" key={cat}><h3>{cat}</h3><ol>{items.map(g=><li key={g.id}>{g['المعيار']}</li>)}</ol></div>)}
      </section>
    </main>
  </div>
}
