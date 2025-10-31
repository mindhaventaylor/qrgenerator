import { Link } from 'react-router-dom';
import { QrCode } from 'lucide-react';

export function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <QrCode className="w-8 h-8 text-purple-400" />
          <span className="text-2xl font-bold">QR generator.ai</span>
        </Link>
        <Link to="/" className="hover:text-purple-300 transition">Back to Home</Link>
      </nav>

      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <h1 className="text-5xl font-bold mb-8">Terms of Service</h1>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-4">Acceptance of Terms</h2>
            <p className="text-gray-300">
              By accessing and using QR Generator.ai, you accept and agree to be bound by the terms and provisions of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Use of Service</h2>
            <p className="text-gray-300 mb-2">You agree to use our service only for lawful purposes and in accordance with these Terms. You agree not to:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Use the service in any way that violates applicable laws</li>
              <li>Engage in any conduct that restricts or inhibits anyone's use of the service</li>
              <li>Attempt to gain unauthorized access to any portion of the service</li>
              <li>Use the service to transmit malicious code or harmful content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Subscription and Payments</h2>
            <p className="text-gray-300">
              Subscriptions are billed in advance on a recurring basis according to your chosen plan. You may cancel your subscription at any time, but refunds are not provided for unused portions of subscription periods.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Intellectual Property</h2>
            <p className="text-gray-300">
              The service and its original content, features, and functionality are owned by QR Generator.ai and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Limitation of Liability</h2>
            <p className="text-gray-300">
              In no event shall QR Generator.ai be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Changes to Terms</h2>
            <p className="text-gray-300">
              We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
            <p className="text-gray-300">
              For questions about these Terms, please contact us at legal@qr-generator.ai
            </p>
          </section>

          <p className="text-sm text-gray-400 mt-8">Last updated: October 31, 2025</p>
        </div>
      </div>
    </div>
  );
}
