import Navbar from '@/components/layout/Navbar'
import HeroSection from '@/components/shared/HeroSection'
import StatsSection from '@/components/shared/StatsSection'
import FeaturedCourses from '@/components/shared/FeaturedCourses'
import HowItWorks from '@/components/shared/HowItWorks'
import TestimonialsSection from '@/components/shared/TestimonialsSection'
import PricingSection from '@/components/shared/PricingSection'
import CTASection from '@/components/shared/CTASection'
import Footer from '@/components/layout/Footer'

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturedCourses />
      <HowItWorks />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  )
}
