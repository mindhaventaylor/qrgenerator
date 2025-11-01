import { useState } from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Palette, BarChart3, Settings, Shield, Zap, Menu, X } from 'lucide-react';

export function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const qrTypes = [
    { name: 'Website', icon: '🌐', description: 'Link to any website URL' },
    { name: 'PDF', icon: '📄', description: 'Show a PDF' },
    { name: 'Images', icon: '🖼️', description: 'Share multiple images' },
    { name: 'Video', icon: '🎥', description: 'Show a video' },
    { name: 'WiFi', icon: '📶', description: 'Connect to a Wi-Fi network' },
    { name: 'Menu', icon: '🍽️', description: 'Create a restaurant menu' },
    { name: 'Business', icon: '💼', description: 'Share business information' },
    { name: 'vCard', icon: '👤', description: 'Share a digital business card' },
    { name: 'MP3', icon: '🎵', description: 'Share an audio file' },
    { name: 'Apps', icon: '📱', description: 'Redirect to an app store' },
    { name: 'List of Links', icon: '🔗', description: 'Share multiple links' },
    { name: 'Coupon', icon: '🎫', description: 'Share a coupon' },
    { name: 'Facebook', icon: '👥', description: 'Share your Facebook page' },
    { name: 'Instagram', icon: '📷', description: 'Share your Instagram' },
    { name: 'Social Media', icon: '🌟', description: 'Share your social channels' },
    { name: 'WhatsApp', icon: '💬', description: 'Get WhatsApp messages' }
  ];

  const features = [
    {
      icon: <Palette className="w-8 h-8" />,
      title: 'Advanced Customization',
      description: 'Custom colors, logos, frames, and styles'
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Real-time Analytics',
      description: 'Track scans with detailed statistics'
    },
    {
      icon: <Settings className="w-8 h-8" />,
      title: 'Dynamic QR Codes',
      description: 'Edit content after printing'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-4 md:px-6 md:py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <QrCode className="w-6 h-6 md:w-8 md:h-8 text-purple-400" />
          <span className="text-xl md:text-2xl font-bold">QR generator.ai</span>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <Link to="/faq" className="hover:text-purple-300 transition">FAQ</Link>
          <Link to="/login" className="hover:text-purple-300 transition">Log In</Link>
          <Link
            to="/signup"
            className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg transition"
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

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-purple-900/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 space-y-3">
            <Link 
              to="/faq" 
              className="block py-2 hover:text-purple-300 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </Link>
            <Link 
              to="/login" 
              className="block py-2 hover:text-purple-300 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="block bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg transition text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="container mx-auto px-4 md:px-6 py-12 md:py-20 text-center">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl p-3 md:p-4 mb-4 md:mb-6 inline-block">
          <span className="font-bold text-xs md:text-sm">✓ Honest Pricing • No Scams • No Hidden Fees</span>
        </div>
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 px-4">
          The Only QR Generator That Doesn't Scam You
        </h1>
        <p className="text-base md:text-lg lg:text-xl text-gray-300 mb-4 max-w-3xl mx-auto px-4">
          Unlike other QR generators with fake "free" trials and hidden charges, we charge a simple <strong className="text-white">$5/month</strong>.
          No surprises, no tricks, no scams. What you see is what you pay.
        </p>
        <p className="text-sm md:text-base lg:text-lg text-gray-400 mb-6 md:mb-8 max-w-3xl mx-auto px-4">
          Create dynamic QR codes with advanced analytics, customization, and tracking. 
          Perfect for businesses, marketing, and events.
        </p>
        <Link
          to="/signup"
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold text-base md:text-lg px-6 md:px-10 py-3 md:py-4 rounded-lg transition transform hover:scale-105 mb-3 md:mb-4"
        >
          Start generating QR codes - $5/month
        </Link>
        <p className="text-gray-400 text-sm md:text-base">Simple, honest pricing. Cancel anytime.</p>
      </section>

      {/* QR Code Types */}
      <section className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 md:mb-12 px-4">Create QR Codes With Our Step-by-Step System</h2>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2 md:gap-4 mb-12 md:mb-16">
          {qrTypes.map((type, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-2 md:p-4 text-center hover:bg-white/20 transition cursor-pointer"
            >
              <div className="text-2xl md:text-4xl mb-1 md:mb-2">{type.icon}</div>
              <div className="text-xs md:text-sm font-semibold break-words">{type.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why We're Different Section */}
      <section className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-4 px-4">Why We're Different</h2>
        <p className="text-center text-base md:text-lg text-gray-300 mb-8 md:mb-12 max-w-2xl mx-auto px-4">
          Most QR generators trick you with "free" trials that auto-bill you for hundreds of dollars. 
          We don't do that. We're honest about our $5/month fee upfront.
        </p>
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-4 md:p-8 mb-8 md:mb-12 max-w-4xl mx-auto">
          <h3 className="text-lg md:text-2xl font-bold text-red-900 mb-3 md:mb-4">❌ Other QR Generators Scam You</h3>
          <ul className="space-y-2 text-sm md:text-base text-red-800 mb-4">
            <li>• Fake "free" trials that auto-charge $99+ after</li>
            <li>• Hidden fees buried in terms</li>
            <li>• Confusing pricing tiers</li>
            <li>• Credit card required for "free" trial</li>
          </ul>
          <h3 className="text-lg md:text-2xl font-bold text-green-900 mb-3 md:mb-4 mt-6">✅ We're Honest & Transparent</h3>
          <ul className="space-y-2 text-sm md:text-base text-green-800">
            <li>• Simple $5/month - no surprises</li>
            <li>• No hidden fees - what you see is what you pay</li>
            <li>• Cancel anytime - no tricks</li>
            <li>• Clear pricing upfront - no scams</li>
          </ul>
        </div>

        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 md:mb-12 px-4">QR Codes to Boost Your Business</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 hover:bg-white/20 transition">
              <div className="text-purple-400 mb-3 md:mb-4">{feature.icon}</div>
              <h3 className="text-lg md:text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-sm md:text-base text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 md:mb-12 px-4">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 md:p-6">
            <h3 className="font-bold text-base md:text-lg mb-2">How does the QR code generator work?</h3>
            <p className="text-sm md:text-base text-gray-300">Our QR code generator is the easiest to use. Just select the type, enter your content, customize the design, and download.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 md:p-6">
            <h3 className="font-bold text-base md:text-lg mb-2">What makes this different from other QR generators?</h3>
            <p className="text-sm md:text-base text-gray-300 mb-2">We offer dynamic QR codes, advanced analytics, custom branding, and unlimited scans without watermarks.</p>
            <p className="text-sm md:text-base text-green-300 font-semibold">Most importantly: we're honest. No scams, no hidden fees - just $5/month.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 md:p-6">
            <h3 className="font-bold text-base md:text-lg mb-2">Why do you charge $5/month?</h3>
            <p className="text-sm md:text-base text-gray-300">Unlike "free" generators that make money by selling your data or tricking you with fake trials, we charge a fair, transparent price. $5/month covers our costs and keeps us honest - no need to scam our users.</p>
          </div>
          <Link to="/faq" className="block text-center text-purple-400 hover:text-purple-300 transition mt-4 md:mt-6">
            View all FAQs
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 md:px-6 py-12 md:py-20 text-center">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 px-4">Start generating QR codes now!</h2>
        <Link
          to="/signup"
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold text-base md:text-lg px-6 md:px-10 py-3 md:py-4 rounded-lg transition transform hover:scale-105"
        >
          Get Started Free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/pricing" className="hover:text-white transition">Pricing</Link></li>
                <li><Link to="/faq" className="hover:text-white transition">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/contact" className="hover:text-white transition">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Language</h4>
              <select className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white">
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>
          <div className="text-center mt-8 text-gray-400">
            © 2025 QR Generator.ai. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
