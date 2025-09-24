'use client';

import Link from 'next/link';

export default function TermsOfUsePage() {
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
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8">Terms of Use</h1>
          <p className="text-gray-300 mb-8">Effective Date: 8/27/2025</p>

          <div className="space-y-8 text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p>By accessing or using Jules, you agree to these Terms of Use and our Privacy Policy. If you do not agree, do not use the Service.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">2. Eligibility</h2>
              <p>You must be at least 18 years old to use the Service.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">3. License to Use</h2>
              <p>We grant you a limited, non-transferable, revocable license to access and use Jules for personal, non-commercial purposes.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">4. User Content</h2>
              <p>You retain ownership of content you submit (photos, text, etc.), but you grant Jules Labs a non-exclusive, worldwide license to use, host, store, reproduce, and display that content for the purpose of operating and improving the Service.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">5. Prohibited Conduct</h2>
              <p>You agree not to:</p>
              <ul className="space-y-2 mt-3">
                <li>• Use the Service for unlawful or abusive purposes.</li>
                <li>• Upload content that infringes others' rights.</li>
                <li>• Interfere with or disrupt the Service.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">6. Intellectual Property</h2>
              <p>All intellectual property in Jules (software, branding, design, content) belongs to Jules Labs or its licensors. You may not copy, modify, or distribute it without permission.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">7. Disclaimers</h2>
              <p>The Service is provided "as is." Jules Labs disclaims all warranties, express or implied, including fitness for a particular purpose. Style advice and guidance are informational only.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
              <p>To the maximum extent permitted by law, Jules Labs will not be liable for indirect, incidental, or consequential damages arising from your use of the Service.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">9. Termination</h2>
              <p>We may suspend or terminate your access at any time if you violate these Terms.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">10. Governing Law</h2>
              <p>These Terms are governed by the laws of the State of Oregon, without regard to conflict of laws principles.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">11. Changes</h2>
              <p>We may update these Terms at any time. Continued use after changes means you accept the new Terms.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">12. Contact</h2>
              <p>Questions? Email <a href="mailto:steve@juleslabs.com" className="text-blue-300 hover:text-blue-200 underline">steve@juleslabs.com</a></p>
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
