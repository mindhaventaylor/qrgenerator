import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  Palette,
  BarChart3,
  Settings,
  Shield,
  Zap,
  Sparkles,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

export function HomePage() {
  useSEO({
    title: 'generatecodeqr - Create Dynamic QR Codes with Advanced Analytics | $5/Month',
    description:
      'Generate dynamic QR codes with real-time analytics, advanced customization, and tracking. Simple $5/month pricing with no hidden fees or scams. Create QR codes for websites, vCard, WiFi, social media, and more.',
    keywords:
      'qr code generator, dynamic qr codes, qr code analytics, qr code creator, business qr codes, qr code tracking, qr code maker, free qr code, honest pricing',
    url: 'https://qrgenerator-liart.vercel.app/'
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: Palette,
      title: 'Advanced customization',
      description: 'Custom colors, frames, gradients, CTAs, and branded templates ready to go.'
    },
    {
      icon: BarChart3,
      title: 'Real-time analytics',
      description: 'Understand who scans, when, and where with dashboards that auto-update.'
    },
    {
      icon: Settings,
      title: 'Dynamic content',
      description: 'Edit destinations after printing and switch campaigns without reprinting a code.'
    },
    {
      icon: Shield,
      title: 'Secure & reliable',
      description: 'Enterprise-grade infrastructure with uptime monitoring and privacy-first tracking.'
    }
  ];

  const workflow = [
    {
      step: '01',
      title: 'Pick the perfect template',
      copy: 'Start from WiFi, vCard, menus, coupons, or build from scratch. Every experience is mobile-ready.'
    },
    {
      step: '02',
      title: 'Customize in minutes',
      copy: 'Add your logo, pick the colors, drop in media, and preview on desktop and mobile instantly.'
    },
    {
      step: '03',
      title: 'Launch and track',
      copy: 'Share the code anywhere and watch analytics roll in with detailed engagement insights.'
    }
  ];

  const useCases = [
    'Restaurants & menus',
    'Events & ticketing',
    'Retail coupons & promos',
    'Business cards & networking',
    'Product packaging',
    'Real estate listings'
  ];

  const testimonials = [
    {
      quote:
        '“We replaced four different QR tools with generatecodeqr. It took 10 minutes to launch branded menus with analytics that made sense.”',
      author: 'Melissa Carter',
      role: 'Marketing Lead @ GreenFork Hospitality'
    },
    {
      quote:
        '“The $5 plan is unbelievably fair compared to everyone else. Unlimited scans plus the live landing pages make our campaigns feel high end.”',
      author: 'James Nakamura',
      role: 'Founder @ UrbanFit Studios'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-900 text-white">
      <nav className="container mx-auto px-4 py-4 md:px-6 md:py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <QrCode className="w-6 h-6 md:w-8 md:h-8 text-purple-300" />
          <span className="text-xl md:text-2xl font-bold tracking-tight">generatecodeqr</span>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <Link to="/faq" className="hover:text-purple-200 transition">
            FAQ
          </Link>
          <Link to="/login" className="hover:text-purple-200 transition">
            Log In
          </Link>
          <Link
            to="/signup"
            className="bg-purple-500 hover:bg-purple-600 px-6 py-2 rounded-lg transition text-white font-semibold"
          >
            Sign Up
          </Link>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white p-2"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 space-y-3">
            <Link
              to="/faq"
              className="block py-2 hover:text-purple-200 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </Link>
            <Link
              to="/login"
              className="block py-2 hover:text-purple-200 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="block bg-purple-500 hover:bg-purple-600 px-6 py-2 rounded-lg transition text-center font-semibold"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}

      <section className="container mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-400/30 rounded-full px-4 py-2 text-xs md:text-sm uppercase tracking-wide text-purple-100">
              <Sparkles className="w-4 h-4" />
              Honest pricing • Unlimited scans • Real analytics
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-200 via-blue-200 to-cyan-200">
              Launch premium QR experiences without enterprise pricing
            </h1>
            <p className="text-base md:text-lg text-slate-200 max-w-xl mx-auto md:mx-0">
              Build branded QR codes with polished landing pages, update content any time, and understand every scan. Just <strong className="text-white">$5/month</strong>, cancel whenever you want.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold text-base md:text-lg px-6 md:px-8 py-3 rounded-lg transition"
              >
                Start building now
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/faq"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold text-base md:text-lg px-6 md:px-8 py-3 rounded-lg transition border border-white/10"
              >
                See how it works
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-left">
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <p className="text-3xl font-bold text-purple-200">5 min</p>
                <p className="text-sm text-slate-200">Average time to publish your first QR landing page</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <p className="text-3xl font-bold text-purple-200">∞ scans</p>
                <p className="text-sm text-slate-200">Unlimited scans, edits, and redirects included in every plan</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <p className="text-3xl font-bold text-purple-200">24/7</p>
                <p className="text-sm text-slate-200">Real-time analytics and alerts for every campaign</p>
              </div>
            </div>
          </div>
          <div className="hidden md:flex justify-center">
            <div className="w-full max-w-xl h-[420px] rounded-3xl border-4 border-white/10 bg-gradient-to-br from-purple-500/40 via-blue-500/30 to-cyan-400/20 shadow-[0_30px_80px_-20px_rgba(64,51,255,0.45)] relative overflow-hidden">
              <div className="absolute inset-4 rounded-2xl bg-black/40 backdrop-blur-sm border border-white/10 p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-purple-100">Live campaign overview</span>
                    <span className="text-xs text-slate-200">Today</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white/5 rounded-xl py-4">
                      <p className="text-2xl font-bold text-purple-200">3.2k</p>
                      <p className="text-xs text-slate-200">Scans</p>
                    </div>
                    <div className="bg-white/5 rounded-xl py-4">
                      <p className="text-2xl font-bold text-purple-200">72%</p>
                      <p className="text-xs text-slate-200">Mobile</p>
                    </div>
                    <div className="bg-white/5 rounded-xl py-4">
                      <p className="text-2xl font-bold text-purple-200">38%</p>
                      <p className="text-xs text-slate-200">CTA Clicks</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-sm text-slate-200 mb-2">Top QR experiences</p>
                  <div className="space-y-2 text-xs text-slate-100/90">
                    <div className="flex justify-between">
                      <span>Summer campaign menu</span>
                      <span>1.4k</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VIP event check-in</span>
                      <span>980</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Retail promo flyer</span>
                      <span>812</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 pb-12 md:pb-20">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-10 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <h3 className="text-lg md:text-xl font-semibold text-red-200 flex items-center gap-2">
                <Shield className="w-6 h-6 text-red-100" />
                Spot the scams
              </h3>
              <ul className="space-y-2 text-sm md:text-base text-slate-100/80">
                <li>• Fake trials that auto-bill $99+</li>
                <li>• Locked features behind surprise paywalls</li>
                <li>• Forced yearly contracts with no refunds</li>
              </ul>
            </div>
            <div className="space-y-3 md:border-x md:border-white/10 md:px-8">
              <h3 className="text-lg md:text-xl font-semibold text-green-200 flex items-center gap-2">
                <Zap className="w-6 h-6 text-green-100" />
                What you get here
              </h3>
              <ul className="space-y-2 text-sm md:text-base text-slate-100/80">
                <li>• Transparent $5/month pricing</li>
                <li>• Unlimited scans & edits included</li>
                <li>• Landing pages tailored to each QR type</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg md:text-xl font-semibold text-purple-200 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-100" />
                Built for modern teams
              </h3>
              <ul className="space-y-2 text-sm md:text-base text-slate-100/80">
                <li>• Collaborative workspace & guest access</li>
                <li>• Post-scan analytics that tell a story</li>
                <li>• Works with Stripe, Supabase, and PostHog</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-lg">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/20 border border-purple-400/40 mb-4">
                  <Icon className="w-6 h-6 text-purple-200" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-sm text-slate-100/80">{description}</p>
              </div>
            ))}
          </div>
          <div className="hidden lg:flex justify-center">
            <div className="w-full max-w-lg h-[420px] rounded-3xl border-4 border-white/10 bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-fuchsia-500/30 shadow-[0_25px_70px_-25px_rgba(147,51,234,0.55)] relative overflow-hidden">
              <div className="absolute inset-5 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-slate-200">Active campaigns</p>
                    <p className="text-2xl font-semibold text-white">8 running</p>
                  </div>
                  <div className="text-xs text-purple-100 bg-purple-500/30 px-3 py-1 rounded-full border border-purple-400/40">
                    Updated 2m ago
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-sm text-slate-200">Conversion funnel</p>
                    <div className="mt-3 space-y-2 text-xs text-slate-100/80">
                      <div className="flex items-center justify-between">
                        <span>Scans</span>
                        <span>100%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Landing views</span>
                        <span>84%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Button clicks</span>
                        <span>42%</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-100/80">
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-purple-100 text-sm font-semibold">Top source</p>
                      <p className="text-lg text-white">POS displays</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-purple-100 text-sm font-semibold">Best performer</p>
                      <p className="text-lg text-white">Event check-in</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="bg-white/5 border border-white/10 rounded-3xl px-6 md:px-10 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">Launch in minutes, not weeks</h2>
              <p className="text-base md:text-lg text-slate-200 max-w-2xl">
                Our guided builder, live preview, and ready-made experiences keep you shipping fast—no designer or developer required.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-100 px-4 py-2 rounded-full border border-purple-400/30">
              <Zap className="w-5 h-5" />
              No tech team needed
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {workflow.map((item) => (
              <div key={item.step} className="relative bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="absolute -top-4 left-6 w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center font-semibold text-white text-lg">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mt-6 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-200">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">Perfect for every industry</h2>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-5 py-3 rounded-lg transition"
            >
              Create your QR space
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <p className="text-base text-slate-200 max-w-3xl mb-6">
            Spin up digital menus, link-in-bio hubs, coupon offers, onboarding flows, and more. generatecodeqr gives you the polish of an agency build with the speed of a DIY editor.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {useCases.map((useCase) => (
              <div key={useCase} className="bg-white/10 border border-white/10 rounded-2xl px-5 py-6 text-center text-sm font-semibold tracking-wide text-slate-100 uppercase">
                {useCase}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-12">
          Teams love the speed and clarity
        </h2>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          {testimonials.map((testimonial) => (
            <div key={testimonial.author} className="bg-white/10 border border-white/10 rounded-3xl p-6 md:p-8">
              <p className="text-sm md:text-base text-slate-100/90 mb-4">{testimonial.quote}</p>
              <div className="text-sm font-semibold text-white">{testimonial.author}</div>
              <div className="text-xs uppercase tracking-wide text-slate-300">{testimonial.role}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 py-12 md:py-20 text-center">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">
          Join today and launch your first QR experience in minutes
        </h2>
        <p className="text-base md:text-lg text-slate-200 max-w-2xl mx-auto mb-6">
          Everything is included for $5/month. Unlimited scans, live editing, full analytics, and no contracts.
        </p>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold text-base md:text-lg px-6 md:px-10 py-3 md:py-4 rounded-lg transition"
        >
          Get started for $5
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      <footer className="border-t border-white/10 py-10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-300">
                <li>
                  <Link to="/pricing" className="hover:text-white transition">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="hover:text-white transition">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-300">
                <li>
                  <Link to="/privacy" className="hover:text-white transition">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-white transition">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-300">
                <li>
                  <Link to="/contact" className="hover:text-white transition">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Language</h4>
              <select className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white w-full">
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>
          <div className="text-center mt-8 text-slate-400 text-sm">
            © 2025 generatecodeqr. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
