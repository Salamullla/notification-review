import { NextResponse } from 'next/server'

export async function GET(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if(!url || !key){
    return NextResponse.json({ guidelines: [], error: 'Supabase environment variables are missing.' }, { status: 500 })
  }

  const table = encodeURIComponent('جدول المعايير')
  const endpoint = `${url}/rest/v1/${table}?select=id,%D8%A7%D9%84%D8%AA%D8%B5%D9%86%D9%8A%D9%81,%D8%B1%D9%82%D9%85%20%D8%A7%D9%84%D9%85%D8%B9%D9%8A%D8%A7%D8%B1,%D8%A7%D9%84%D9%85%D8%B9%D9%8A%D8%A7%D8%B1&order=%D8%A7%D9%84%D8%AA%D8%B5%D9%86%D9%8A%D9%81.asc,%D8%B1%D9%82%D9%85%20%D8%A7%D9%84%D9%85%D8%B9%D9%8A%D8%A7%D8%B1.asc`

  const res = await fetch(endpoint, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    next: { revalidate: 60 }
  })

  if(!res.ok){
    return NextResponse.json({ guidelines: [], error: 'Failed to load guidelines.' }, { status: res.status })
  }

  const guidelines = await res.json()
  return NextResponse.json({ guidelines })
}
