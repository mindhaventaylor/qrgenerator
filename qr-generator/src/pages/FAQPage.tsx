import { Link } from 'react-router-dom';
import { QrCode, ChevronDown, ArrowRight, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { useSEO } from '../hooks/useSEO';
import { useAuth } from '../contexts/AuthContext';

const FAQS = [
  {
    question: 'How does the QR code generator work?',
    answer: 'Our QR code generator is the easiest to use. Simply select the type of QR code you want to create, enter your content, customize the design with colors and logos, and download your QR code in your preferred format.'
  },
  {
    question: 'What formats can I download my QR codes in?',
    answer: 'You can download your QR codes in JPG, PNG, and SVG formats. SVG is recommended for print materials as it scales without quality loss.'
  },
  {
    question: 'Do I need any special skills to use this generator?',
    answer: 'No! Our QR code generator is designed to be user-friendly and requires no technical skills. The step-by-step process guides you through creation.'
  },
  {
    question: 'What makes this different from free QR generators?',
    answer: 'We offer dynamic QR codes (editable after printing), advanced analytics, custom branding without watermarks, unlimited scans, multiple download formats, and premium customer support.'
  },
  {
    question: 'Do you offer a free trial?',
    answer: 'No. We believe in honest, transparent pricing from day one. Just $5/month - no trials, no tricks, no scams. What you see is what you pay. Ready to get started? Check out our subscription page for full details.'
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time from your account dashboard. Your access will continue until the end of your current billing period.'
  },
  {
    question: 'What are dynamic QR codes?',
    answer: 'Dynamic QR codes allow you to edit the destination URL and content even after the QR code has been printed. They also provide scan tracking and analytics.'
  },
  {
    question: 'Can I customize my QR codes?',
    answer: 'Yes! You can customize colors, add your logo, choose frames, and adjust the design to match your brand.'
  },
  {
    question: 'Is there a scan limit?',
    answer: 'No, all our plans include unlimited scans. Your QR codes can be scanned as many times as needed.'
  },
  {
    question: 'How does analytics tracking work?',
    answer: 'Our platform tracks every scan with detailed information including location, device type, operating system, browser, and timestamp. You can view real-time analytics in your dashboard.'
  }
];

export function FAQPage() {
  useSEO({
    title: 'FAQ - Frequently Asked Questions | generatecodeqr',
    description: 'Get answers to common questions about generatecodeqr. Learn about pricing, features, dynamic QR codes, and more.',
    url: 'https://qrgenerator-liart.vercel.app/faq'
  });
  
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <QrCode className="w-8 h-8 text-cyan-400" />
          <span className="text-2xl font-bold text-white">generatecodeqr</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Link to="/login" className="text-white/70 hover:text-white transition">Log In</Link>
          <Link to="/signup" className="bg-cyan-400 hover:bg-cyan-300 text-slate-900 px-6 py-2 rounded-lg transition">
            Sign Up
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-16">
        <h1 className="text-5xl font-bold text-center mb-4 text-white">Frequently Asked Questions</h1>
        <p className="text-xl text-center text-white/70 mb-12">Find answers to common questions about our QR code generator</p>

        <div className="max-w-3xl mx-auto space-y-4">
          {FAQS.map((faq, index) => (
            <div key={index} className="bg-slate-900/80 border border-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/10 transition"
              >
                <span className="font-semibold text-lg text-white">{faq.question}</span>
                <ChevronDown className={`w-5 h-5 transition-transform text-white/70 ${openIndex === index ? 'rotate-180' : ''}`} />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 text-white/70">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Subscription CTA Section */}
        <div className="max-w-3xl mx-auto mt-16 mb-12">
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-8 md:p-12 text-center shadow-2xl">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-cyan-400" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Ready to Get Started?</h2>
            <p className="text-lg md:text-xl text-white/70 mb-6 max-w-2xl mx-auto">
              Join thousands of users creating professional QR codes with advanced analytics. 
              Simple $5/month pricing - no hidden fees, cancel anytime.
            </p>
            {user ? (
              <Link 
                to="/billing" 
                className="inline-flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-slate-900 px-8 py-4 rounded-lg font-bold text-lg transition transform hover:scale-105 shadow-lg"
              >
                <CreditCard className="w-5 h-5" />
                View Subscription & Pricing
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  to="/billing" 
                  className="inline-flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-slate-900 px-8 py-4 rounded-lg font-bold text-lg transition transform hover:scale-105 shadow-lg"
                >
                  <CreditCard className="w-5 h-5" />
                  View Pricing
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link 
                  to="/signup" 
                  className="inline-flex items-center gap-2 bg-transparent border border-white/30 hover:bg-white/10 text-white px-8 py-4 rounded-lg font-bold text-lg transition transform hover:scale-105 shadow-lg"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-white/70 mb-4">Ready to get started?</p>
          <Link to="/signup" className="inline-block bg-cyan-400 hover:bg-cyan-300 text-slate-900 px-8 py-3 rounded-lg font-semibold transition">
            Sign Up Now
          </Link>
        </div>
      </div>
    </div>
  );
}
