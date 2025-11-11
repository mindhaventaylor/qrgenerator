import { Link } from 'react-router-dom';
import { QrCode } from 'lucide-react';

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <QrCode className="w-8 h-8 text-cyan-400" />
          <span className="text-2xl font-bold text-white">generatecodeqr</span>
        </Link>
        <Link to="/" className="text-white/70 hover:text-white transition">Back to Home</Link>
      </nav>

      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <h1 className="text-5xl font-bold mb-8 text-white">Privacy Policy</h1>
        
        <div className="bg-slate-900/80 border border-white/10 backdrop-blur-sm rounded-xl p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">Information We Collect</h2>
            <p className="text-white/70">
              We collect information you provide directly to us, including your name, email address, and any content you create using our service. We also automatically collect certain information about your device and usage of our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">How We Use Your Information</h2>
            <p className="text-white/70 mb-2">We use the information we collect to:</p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your transactions and send related information</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Monitor and analyze trends, usage, and activities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">Data Security</h2>
            <p className="text-white/70">
              We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">Your Rights</h2>
            <p className="text-white/70">
              You have the right to access, update, or delete your personal information at any time. You can do this through your account settings or by contacting us directly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">Contact Us</h2>
            <p className="text-white/70">
              If you have any questions about this Privacy Policy, please contact us at privacy@qr-generator.ai
            </p>
          </section>

          <p className="text-sm text-white/50 mt-8">Last updated: October 31, 2025</p>
        </div>
      </div>
    </div>
  );
}
