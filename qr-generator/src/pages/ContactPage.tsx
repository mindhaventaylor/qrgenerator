import { Link } from 'react-router-dom';
import { QrCode, Mail, MessageCircle } from 'lucide-react';
import { useState } from 'react';

export function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-4 text-white">Contact Us</h1>
          <p className="text-xl text-center text-white/70 mb-12">We're here to help! Get in touch with our team.</p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-900/80 border border-white/10 backdrop-blur-sm rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6 text-white">Send us a message</h2>
              
              {submitted ? (
                <div className="bg-green-900/50 border border-green-500/50 rounded-lg p-6 text-center">
                  <p className="text-lg font-semibold mb-2 text-white">Thank you for your message!</p>
                  <p className="text-white/70">We'll get back to you as soon as possible.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">Message</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={5}
                      className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      placeholder="How can we help?"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-bold py-3 rounded-lg transition"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900/80 border border-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Mail className="w-8 h-8 text-cyan-400" />
                  <h3 className="text-xl font-bold text-white">Email Support</h3>
                </div>
                <p className="text-white/70">support@qr-generator.ai</p>
                <p className="text-sm text-white/50 mt-2">We typically respond within 24 hours</p>
              </div>

              <div className="bg-slate-900/80 border border-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <MessageCircle className="w-8 h-8 text-cyan-400" />
                  <h3 className="text-xl font-bold text-white">Live Chat</h3>
                </div>
                <p className="text-white/70">Available Monday-Friday</p>
                <p className="text-sm text-white/50 mt-2">9:00 AM - 5:00 PM EST</p>
              </div>

              <div className="bg-slate-900/80 border border-white/10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 text-white">Before contacting us...</h3>
                <p className="text-white/70 mb-4">Check our FAQ page for quick answers to common questions.</p>
                <Link to="/faq" className="inline-block bg-cyan-400 hover:bg-cyan-300 text-slate-900 px-6 py-2 rounded-lg font-semibold transition">
                  View FAQ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
