import Link from 'next/link'

export default function CTASection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border border-primary-500/30 rounded-3xl p-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Ready to Transform Your Career?
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Join 50,000+ learners. Start learning today and earn while you learn through our unique affiliate system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary text-lg px-8 py-4">Start Learning Free</Link>
            <Link href="/courses" className="btn-secondary text-lg px-8 py-4">Browse Courses</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
