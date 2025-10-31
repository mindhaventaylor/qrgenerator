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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-4">Contact Us</h1>
          <p className="text-xl text-center text-gray-300 mb-12">We're here to help! Get in touch with our team.</p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
              
              {submitted ? (
                <div className="bg-green-500/20 border border-green-500 rounded-lg p-6 text-center">
                  <p className="text-lg font-semibold mb-2">Thank you for your message!</p>
                  <p className="text-gray-300">We'll get back to you as soon as possible.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={5}
                      className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="How can we help?"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Mail className="w-8 h-8 text-purple-400" />
                  <h3 className="text-xl font-bold">Email Support</h3>
                </div>
                <p className="text-gray-300">support@qr-generator.ai</p>
                <p className="text-sm text-gray-400 mt-2">We typically respond within 24 hours</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <MessageCircle className="w-8 h-8 text-purple-400" />
                  <h3 className="text-xl font-bold">Live Chat</h3>
                </div>
                <p className="text-gray-300">Available Monday-Friday</p>
                <p className="text-sm text-gray-400 mt-2">9:00 AM - 5:00 PM EST</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Before contacting us...</h3>
                <p className="text-gray-300 mb-4">Check our FAQ page for quick answers to common questions.</p>
                <Link to="/faq" className="inline-block bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-semibold transition">
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
