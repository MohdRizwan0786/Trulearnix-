'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SalesRootPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/sales/dashboard') }, [])
  return null
}
