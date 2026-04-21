import Navbar from '@/components/layout/Navbar'
import HeroSection from '@/components/shared/HeroSection'
import AchievementsSection from '@/components/shared/AchievementsSection'
import StatsSection from '@/components/shared/StatsSection'
import LiveClassesSection from '@/components/shared/LiveClassesSection'
import FeaturedCourses from '@/components/shared/FeaturedCourses'
import WhyLiveSection from '@/components/shared/WhyLiveSection'
import EarningsProofSection from '@/components/shared/EarningsProofSection'
import EarningMilestonesSection from '@/components/shared/EarningMilestonesSection'
import HowItWorks from '@/components/shared/HowItWorks'
import TestimonialsSection from '@/components/shared/TestimonialsSection'
import WallOfLove from '@/components/shared/WallOfLove'
import PricingSection from '@/components/shared/PricingSection'
import CTASection from '@/components/shared/CTASection'
import Footer from '@/components/layout/Footer'

async function fetchLeaderboard() {
  try {
    const res = await fetch(`${process.env.INTERNAL_API_URL || 'http://localhost:5010'}/api/affiliate/leaderboard`, { next: { revalidate: 1800 } })
    const data = await res.json()
    return data.leaderboard?.slice(0, 6) || []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const earners = await fetchLeaderboard()
  return (
    <main>
      <Navbar />
      <HeroSection />
      <AchievementsSection />
      <StatsSection />
      <LiveClassesSection />
      <FeaturedCourses />
      <WhyLiveSection />
      <EarningsProofSection initialEarners={earners} />
      <EarningMilestonesSection />
      <HowItWorks />
      <TestimonialsSection />
      <WallOfLove />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  )
}
