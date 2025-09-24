'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center">
            <img
              src="/Jules_Logo_White_Final_NoOutline.png"
              alt="Jules"
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
              style={{ transform: 'scale(3.75) translateX(10px)', transformOrigin: 'center' }}
            />
          </div>
          <Link
            href="/"
            className="text-gray-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 sm:py-12">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 sm:p-12 border border-white/20">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8">Privacy Policy & GDPR Compliance</h1>
          <p className="text-gray-300 mb-8">Effective Date: January 15, 2025 | Last Updated: January 15, 2025</p>

          <div className="space-y-8 text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">1. Introduction & Data Controller</h2>
              <p className="mb-4">
                Jules Labs ("we," "our," "us") is the data controller for your personal information. We respect your privacy and are committed to protecting your personal data in accordance with the General Data Protection Regulation (GDPR) and other applicable privacy laws.
              </p>
              <p className="mb-4">
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered styling and lifestyle services across Jules Dating, Jules Style, and Jules Labs ("the Services").
              </p>
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-4">
                <h3 className="text-white font-semibold mb-2">Data Protection Officer</h3>
                <p>Email: <a href="mailto:privacy@juleslabs.com" className="text-blue-300 hover:text-blue-200 underline">privacy@juleslabs.com</a></p>
                <p>Address: Jules Labs, [Your Business Address]</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">2. Personal Data We Collect</h2>
              
              <h3 className="text-lg font-semibold text-white mb-3">2.1 Personal Information</h3>
              <ul className="space-y-2 mb-4">
                <li>• <strong className="text-white">Identity Data:</strong> Name, email address, profile photos</li>
                <li>• <strong className="text-white">Contact Data:</strong> Email address, postal code/city</li>
                <li>• <strong className="text-white">Profile Data:</strong> Body measurements, style preferences, lifestyle information, relationship status</li>
                <li>• <strong className="text-white">Content Data:</strong> Photos, chat messages, feedback, preferences you upload</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-3">2.2 Technical Data</h3>
              <ul className="space-y-2 mb-4">
                <li>• <strong className="text-white">Usage Data:</strong> App interactions, feature usage, session duration</li>
                <li>• <strong className="text-white">Device Data:</strong> IP address, browser type, device information, operating system</li>
                <li>• <strong className="text-white">Analytics Data:</strong> Page views, click patterns, performance metrics</li>
                <li>• <strong className="text-white">Cookies & Tracking:</strong> Session cookies, preference cookies, analytics cookies</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-3">2.3 Special Categories of Data</h3>
              <p className="mb-2">We may process special categories of personal data with your explicit consent:</p>
              <ul className="space-y-2">
                <li>• <strong className="text-white">Health-related data:</strong> Body measurements, fitness information (for styling advice)</li>
                <li>• <strong className="text-white">Biometric data:</strong> Profile photos for styling analysis</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">3. Legal Basis for Processing & How We Use Your Data</h2>
              
              <h3 className="text-lg font-semibold text-white mb-3">3.1 Legal Basis Under GDPR</h3>
              <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                <ul className="space-y-2">
                  <li>• <strong className="text-white">Contract Performance:</strong> Providing our services to you</li>
                  <li>• <strong className="text-white">Legitimate Interest:</strong> Improving our services, analytics, security</li>
                  <li>• <strong className="text-white">Consent:</strong> Marketing communications, special category data</li>
                  <li>• <strong className="text-white">Legal Obligation:</strong> Compliance with applicable laws</li>
                </ul>
              </div>

              <h3 className="text-lg font-semibold text-white mb-3">3.2 Purposes of Processing</h3>
              <ul className="space-y-2">
                <li>• <strong className="text-white">Service Delivery:</strong> Provide AI-powered styling and dating advice</li>
                <li>• <strong className="text-white">Personalization:</strong> Customize recommendations and user experience</li>
                <li>• <strong className="text-white">Communication:</strong> Send service updates, support responses</li>
                <li>• <strong className="text-white">Analytics:</strong> Improve app performance and user experience</li>
                <li>• <strong className="text-white">Security:</strong> Detect and prevent fraud, abuse, technical issues</li>
                <li>• <strong className="text-white">Legal Compliance:</strong> Meet regulatory requirements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">4. How We Share Information</h2>
              <ul className="space-y-3">
                <li>With service providers who support our operations (hosting, analytics, payment processing).</li>
                <li>For legal compliance, safety, and enforcement of our rights.</li>
                <li>In business transfers (merger, acquisition, reorganization).</li>
                <li><strong className="text-white">Never sold to third parties for advertising.</strong></li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">5. Data Retention & International Transfers</h2>
              
              <h3 className="text-lg font-semibold text-white mb-3">5.1 Data Retention Periods</h3>
              <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                <ul className="space-y-2">
                  <li>• <strong className="text-white">Account Data:</strong> Retained while your account is active + 3 years after deletion</li>
                  <li>• <strong className="text-white">Chat Logs:</strong> 2 years from last interaction</li>
                  <li>• <strong className="text-white">Analytics Data:</strong> 2 years from collection</li>
                  <li>• <strong className="text-white">Marketing Data:</strong> Until consent is withdrawn + 30 days</li>
                  <li>• <strong className="text-white">Legal/Compliance Data:</strong> As required by applicable laws</li>
                </ul>
              </div>

              <h3 className="text-lg font-semibold text-white mb-3">5.2 International Data Transfers</h3>
              <p className="mb-3">Your personal data may be transferred to and processed in countries outside the European Economic Area (EEA). We ensure adequate protection through:</p>
              <ul className="space-y-1 mb-4">
                <li>• Standard Contractual Clauses (SCCs) approved by the European Commission</li>
                <li>• Adequacy decisions by the European Commission</li>
                <li>• Appropriate safeguards as required by GDPR</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">6. Your Data Subject Rights (GDPR)</h2>
              
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-4">
                <h3 className="text-white font-semibold mb-2">Exercise Your Rights</h3>
                <p>Contact us at <a href="mailto:privacy@juleslabs.com" className="text-green-300 hover:text-green-200 underline">privacy@juleslabs.com</a> to exercise any of these rights. We will respond within 30 days.</p>
              </div>

              <h3 className="text-lg font-semibold text-white mb-3">6.1 Right of Access</h3>
              <p className="mb-3">You have the right to obtain confirmation of whether we process your personal data and access to that data, including:</p>
              <ul className="space-y-1 mb-4">
                <li>• Categories of personal data we process</li>
                <li>• Purposes of processing</li>
                <li>• Recipients of your data</li>
                <li>• Retention periods</li>
                <li>• Your rights regarding the data</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-3">6.2 Right to Rectification</h3>
              <p className="mb-4">You can request correction of inaccurate or incomplete personal data. You can update most information directly in your account settings.</p>

              <h3 className="text-lg font-semibold text-white mb-3">6.3 Right to Erasure ("Right to be Forgotten")</h3>
              <p className="mb-3">You can request deletion of your personal data when:</p>
              <ul className="space-y-1 mb-4">
                <li>• The data is no longer necessary for the original purpose</li>
                <li>• You withdraw consent and there's no other legal basis</li>
                <li>• The data has been unlawfully processed</li>
                <li>• You object to processing and there are no overriding legitimate grounds</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-3">6.4 Right to Data Portability</h3>
              <p className="mb-4">You can request a copy of your personal data in a structured, machine-readable format, or have it transferred to another service provider.</p>

              <h3 className="text-lg font-semibold text-white mb-3">6.5 Right to Restrict Processing</h3>
              <p className="mb-4">You can request that we limit how we use your personal data in certain circumstances.</p>

              <h3 className="text-lg font-semibold text-white mb-3">6.6 Right to Object</h3>
              <p className="mb-4">You can object to processing based on legitimate interests or for direct marketing purposes.</p>

              <h3 className="text-lg font-semibold text-white mb-3">6.7 Rights Related to Automated Decision-Making</h3>
              <p className="mb-4">You have the right not to be subject to automated decision-making, including profiling, that produces legal effects or significantly affects you.</p>

              <h3 className="text-lg font-semibold text-white mb-3">6.8 Right to Withdraw Consent</h3>
              <p className="mb-4">Where processing is based on consent, you can withdraw it at any time. Withdrawal does not affect the lawfulness of processing before withdrawal.</p>

              <h3 className="text-lg font-semibold text-white mb-3">6.9 Right to Lodge a Complaint</h3>
              <p>You have the right to lodge a complaint with your local data protection authority if you believe we have not complied with GDPR requirements.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">7. Security</h2>
              <p>We use reasonable safeguards to protect your data, but no system is 100% secure.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">8. Children's Privacy</h2>
              <p>The Service is not directed to individuals under 18. We do not knowingly collect personal data from children.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">9. Changes</h2>
              <p>We may update this Privacy Policy periodically. Updates will be posted with a new effective date.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">10. Consent Management</h2>
              <p className="mb-4">You can manage your consent preferences at any time:</p>
              <ul className="space-y-2 mb-4">
                <li>• <strong className="text-white">Account Settings:</strong> Update your profile and communication preferences</li>
                <li>• <strong className="text-white">Cookie Settings:</strong> Manage analytics and functional cookies</li>
                <li>• <strong className="text-white">Marketing Preferences:</strong> Opt in/out of promotional communications</li>
                <li>• <strong className="text-white">Data Processing:</strong> Control how your data is used for service improvement</li>
              </ul>
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                <p><strong className="text-white">Manage Your Data:</strong> Visit your account settings or contact us at <a href="mailto:privacy@juleslabs.com" className="text-blue-300 hover:text-blue-200 underline">privacy@juleslabs.com</a></p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">11. Contact Information</h2>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">Data Controller</h3>
                <p className="mb-2"><strong>Jules Labs</strong></p>
                <p className="mb-2">Email: <a href="mailto:privacy@juleslabs.com" className="text-blue-300 hover:text-blue-200 underline">privacy@juleslabs.com</a></p>
                <p className="mb-2">General Support: <a href="mailto:steve@juleslabs.com" className="text-blue-300 hover:text-blue-200 underline">steve@juleslabs.com</a></p>
                <p>Address: [Your Business Address]</p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-white/20">
            <Link
              href="/"
              className="inline-block bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
