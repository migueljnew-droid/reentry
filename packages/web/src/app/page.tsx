import Link from 'next/link';
import { AdSlot } from '@/components/shared/AdSlot';

const stats = [
  { value: '700K', label: 'Released every year' },
  { value: '43%', label: 'Return to prison within 3 years' },
  { value: '8-15', label: 'Agencies to navigate alone' },
  { value: '$33.5B', label: 'Cost to taxpayers annually' },
];

const features = [
  {
    icon: '🎤',
    title: 'Voice-First',
    description:
      'Just speak. Tell us your situation in your own words. No typing required. No apps to learn.',
  },
  {
    icon: '📋',
    title: 'Your Personal Action Plan',
    description:
      'In under 60 seconds, get a step-by-step roadmap covering ID, benefits, housing, employment, and legal obligations — specific to YOUR state.',
  },
  {
    icon: '💰',
    title: 'Benefits You Qualify For',
    description:
      'We screen you for 100+ programs — SNAP, Medicaid, housing assistance, phone service, job training — and help you apply.',
  },
  {
    icon: '💼',
    title: 'Jobs That Hire You',
    description:
      'Matched to employers who hire people with records. Filtered by your skills, your conviction type, and your location.',
  },
  {
    icon: '⏰',
    title: 'Never Miss a Deadline',
    description:
      'Parole check-ins, court dates, benefits recertification — we remind you before every single one.',
  },
  {
    icon: '📴',
    title: 'Works Offline',
    description:
      "Your action plan is saved to your phone. No internet? You've still got your roadmap.",
  },
];

const steps = [
  {
    number: '1',
    title: 'Tell Us Your Situation',
    description: 'Voice or text — 10 minutes. State, conviction type, release date, what you need right now.',
  },
  {
    number: '2',
    title: 'Get Your Action Plan',
    description: 'AI generates your personalized, time-sequenced roadmap. First 72 hours. First week. First month. First year.',
  },
  {
    number: '3',
    title: 'Start Checking Things Off',
    description: 'Step-by-step instructions for every task. Documents you need. Where to go. What to say. Track your progress.',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 text-white">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center text-xl font-bold">
              R
            </div>
            <span className="text-xl font-bold tracking-tight">REENTRY</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/intake"
              className="btn-primary bg-white text-primary-900 hover:bg-gray-100"
            >
              Get Started
            </Link>
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-accent-500/20 text-accent-300 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
              Free. Private. Built by someone who lived it.
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
              You did your time.
              <br />
              <span className="text-primary-300">Now get your life back.</span>
            </h1>

            <p className="text-xl md:text-2xl text-primary-200 leading-relaxed mb-10 max-w-2xl">
              REENTRY is your AI-powered navigator through the maze of reentry.
              Tell us your situation — get a personalized action plan covering
              ID, benefits, housing, employment, and legal obligations.{' '}
              <strong className="text-white">Specific to your state.</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/intake" className="btn-primary text-center text-xl px-10 py-5">
                Start My Plan — It&apos;s Free
              </Link>
              <a href="#how-it-works" className="btn-secondary border-white/20 text-white hover:bg-white/10 text-center">
                How It Works
              </a>
            </div>

            <p className="mt-6 text-primary-400 text-sm">
              No account needed. No email required. Just your voice.
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-extrabold text-white">
                  {stat.value}
                </div>
                <div className="text-primary-300 text-sm mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-primary-950 mb-4">
              Three steps. That&apos;s it.
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              No forms. No accounts. No bureaucratic maze. Just answers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="card-elevated text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-700 text-2xl font-extrabold flex items-center justify-center mx-auto mb-6">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-primary-950 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-primary-950 mb-4">
              Everything you need. One place.
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              No more bouncing between 15 agencies. REENTRY brings it all together.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="card group">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-bold text-primary-950 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ad — between features and social proof */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <AdSlot slot="landing-mid" format="horizontal" />
      </div>

      {/* Social Proof / Impact */}
      <section className="py-20 md:py-28 bg-primary-950 text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
            The system failed you.
            <br />
            <span className="text-primary-300">This tool won&apos;t.</span>
          </h2>
          <p className="text-xl text-primary-200 max-w-3xl mx-auto mb-12 leading-relaxed">
            REENTRY was built by someone who fought through the justice system
            himself — as a self-represented father in federal court. This isn&apos;t
            a startup experiment. It&apos;s a tool built from lived experience, powered
            by AI that actually works.
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="p-6 rounded-2xl bg-white/5 backdrop-blur">
              <div className="text-4xl font-extrabold text-accent-400 mb-2">
                &lt;60s
              </div>
              <div className="text-primary-300">
                To generate your full action plan
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 backdrop-blur">
              <div className="text-4xl font-extrabold text-accent-400 mb-2">
                100+
              </div>
              <div className="text-primary-300">
                Benefits programs we screen for
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 backdrop-blur">
              <div className="text-4xl font-extrabold text-accent-400 mb-2">
                $0
              </div>
              <div className="text-primary-300">
                Always free for returning citizens
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-primary-950 mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            It takes 10 minutes. No account needed. Just tell us your situation.
          </p>
          <Link href="/intake" className="btn-primary text-xl px-12 py-5 inline-block">
            Start My Reentry Plan
          </Link>
          <p className="mt-6 text-gray-400 text-sm">
            Your information is private and encrypted. We never share your data.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">
                R
              </div>
              <span className="font-bold text-primary-950">REENTRY</span>
              <span className="text-gray-400 text-sm">
                by FathersCAN, Inc.
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-primary-600">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-primary-600">
                Terms
              </a>
              <a href="#" className="hover:text-primary-600">
                For Case Managers
              </a>
              <a href="#" className="hover:text-primary-600">
                Contact
              </a>
            </div>
          </div>
          <div className="mt-8 text-center text-xs text-gray-400">
            REENTRY is a project of FathersCAN, Inc., a 501(c)(3) nonprofit.
            &copy; {new Date().getFullYear()} FathersCAN, Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
