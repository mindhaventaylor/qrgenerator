import { Link } from 'react-router-dom';
import { QrCode, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useSEO } from '../hooks/useSEO';

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
    answer: 'No. We believe in honest, transparent pricing from day one. Just $5/month - no trials, no tricks, no scams. What you see is what you pay.'
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
    title: 'FAQ - Frequently Asked Questions | QR Generator AI',
    description: 'Get answers to common questions about QR Generator AI. Learn about pricing, features, dynamic QR codes, and more.',
    url: 'https://qrgenerator-liart.vercel.app/faq'
  });
  
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <QrCode className="w-8 h-8 text-purple-400" />
          <span className="text-2xl font-bold">QR generator.ai</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Link to="/login" className="hover:text-purple-300 transition">Log In</Link>
          <Link to="/signup" className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg transition">
            Sign Up
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-16">
        <h1 className="text-5xl font-bold text-center mb-4">Frequently Asked Questions</h1>
        <p className="text-xl text-center text-gray-300 mb-12">Find answers to common questions about our QR code generator</p>

        <div className="max-w-3xl mx-auto space-y-4">
          {FAQS.map((faq, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/20 transition"
              >
                <span className="font-semibold text-lg">{faq.question}</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${openIndex === index ? 'rotate-180' : ''}`} />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 text-gray-300">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-300 mb-4">Still have questions?</p>
          <Link to="/contact" className="inline-block bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded-lg font-semibold transition">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
