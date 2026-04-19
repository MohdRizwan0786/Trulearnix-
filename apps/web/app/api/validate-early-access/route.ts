import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ valid: false })

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://api.trulearnix.com'
    const res = await fetch(`${apiUrl}/api/public/validate-early-access?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
    const data = await res.json()
    return NextResponse.json({ valid: !!data.valid })
  } catch {
    return NextResponse.json({ valid: false })
  }
}
