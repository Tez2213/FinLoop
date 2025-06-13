import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, UserCog, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how Finloop collects, uses, and protects your personal information. Your privacy is important to us.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPolicyPage() {
  const lastUpdatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-slate-200 py-8 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors group">
            <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>

        <article className="bg-slate-800/50 backdrop-blur-md shadow-2xl rounded-xl p-6 sm:p-10 border border-slate-700">
          <header className="mb-8 text-center">
            <ShieldCheck size={48} className="mx-auto mb-4 text-green-400" />
            <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-green-400 via-teal-400 to-blue-400 bg-clip-text text-transparent mb-2">
              Privacy Policy
            </h1>
            <p className="text-slate-400">Last Updated: {lastUpdatedDate}</p>
          </header>

          <div className="prose prose-invert prose-lg max-w-none 
                        prose-headings:text-slate-100 prose-headings:font-semibold 
                        prose-p:text-slate-300 prose-a:text-blue-400 prose-a:no-underline hover:prose-a:text-blue-300
                        prose-strong:text-slate-100 prose-ul:text-slate-300 prose-li:marker:text-green-400">

            <p>Welcome to Finloop! Your privacy is critically important to us. This Privacy Policy outlines how Finloop ("we," "us," or "our") collects, uses, shares, and protects your personal information when you use our mobile application and related services (collectively, the "Service").</p>
            <p>By using Finloop, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms, please do not access or use the Service.</p>

            <h2>1. Information We Collect</h2>
            <p>We collect information to provide and improve our Service to you. The types of information we may collect include:</p>
            
            <h3>a. Information You Provide Directly</h3>
            <ul>
              <li><strong>Account Information:</strong> When you create a Finloop account, we collect information such as your name, email address, phone number (optional), and a password.</li>
              <li><strong>Profile Information:</strong> You may choose to provide additional information for your profile, such as a profile picture or username.</li>
              <li><strong>Room and Transaction Data:</strong> Information related to the rooms you create or join, expenses you log, contributions you make, and UPI IDs you provide for transactions (note: we facilitate the recording of UPI transactions but do not process payments directly or store full bank account details).</li>
              <li><strong>Communications:</strong> If you contact us directly, we may receive additional information about you such as your name, email address, phone number, the contents of the message and/or attachments you may send us, and any other information you may choose to provide.</li>
            </ul>

            <h3>b. Information We Collect Automatically</h3>
            <ul>
              <li><strong>Usage Data:</strong> We may collect information about how you access and use the Service, such as your IP address, device type, operating system, browser type, pages viewed, and the dates/times of your visits.</li>
              <li><strong>Device Information:</strong> We may collect device-specific information, such as hardware model, operating system version, unique device identifiers, and mobile network information.</li>
              <li><strong>Cookies and Similar Technologies:</strong> We may use cookies and similar tracking technologies to track activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect for various purposes, including to:</p>
            <ul>
              <li>Provide, operate, and maintain our Service.</li>
              <li>Improve, personalize, and expand our Service.</li>
              <li>Understand and analyze how you use our Service.</li>
              <li>Develop new products, services, features, and functionality.</li>
              <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the Service, and for marketing and promotional purposes (with your consent where required).</li>
              <li>Process your transactions and manage your financial activities within rooms.</li>
              <li>Send you push notifications (if you have enabled them).</li>
              <li>Find and prevent fraud and ensure the security of our Service.</li>
              <li>Comply with legal obligations.</li>
            </ul>

            <h2>3. How We Share Your Information</h2>
            <p>We do not sell your personal information. We may share your information in the following situations:</p>
            <ul>
              <li><strong>With Other Users in Your Rooms:</strong> Information such as your name, profile picture (if provided), expenses, and contributions will be visible to other members of the rooms you participate in, as this is essential for the functionality of the Service.</li>
              <li><strong>Service Providers:</strong> We may share your information with third-party vendors and service providers that perform services on our behalf, such as cloud hosting (e.g., Supabase), analytics, customer support, and email delivery. These service providers will only have access to your information to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.</li>
              <li><strong>For Legal Reasons:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or a government agency). This includes to meet national security or law enforcement requirements.</li>
              <li><strong>Business Transfers:</strong> If Finloop is involved in a merger, acquisition, or asset sale, your personal information may be transferred. We will provide notice before your personal information is transferred and becomes subject to a different privacy policy.</li>
              <li><strong>With Your Consent:</strong> We may disclose your personal information for any other purpose with your consent.</li>
            </ul>

            <h2>4. Data Retention</h2>
            <p>We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations (for example, if we are required to retain your data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies.</p>
            <p>Usage Data is generally retained for a shorter period, except when this data is used to strengthen the security or to improve the functionality of our Service, or we are legally obligated to retain this data for longer time periods.</p>

            <h2>5. Security of Your Information</h2>
            <p>The security of your data is important to us. We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse. Any information disclosed online is vulnerable to interception and misuse by unauthorized parties.</p>

            <h2>6. Your Data Protection Rights</h2>
            <p>Depending on your location, you may have the following rights regarding your personal information:</p>
            <ul>
              <li><strong>The right to access</strong> – You have the right to request copies of your personal data.</li>
              <li><strong>The right to rectification</strong> – You have the right to request that we correct any information you believe is inaccurate or complete information you believe is incomplete.</li>
              <li><strong>The right to erasure</strong> – You have the right to request that we erase your personal data, under certain conditions.</li>
              <li><strong>The right to restrict processing</strong> – You have the right to request that we restrict the processing of your personal data, under certain conditions.</li>
              <li><strong>The right to object to processing</strong> – You have the right to object to our processing of your personal data, under certain conditions.</li>
              <li><strong>The right to data portability</strong> – You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions.</li>
            </ul>
            <p>If you make a request, we have one month to respond to you. If you would like to exercise any of these rights, please contact us at our contact information below.</p>

            <h2>7. Children's Privacy</h2>
            <p>Our Service does not address anyone under the age of 13 (or a higher age threshold if stipulated by local laws). We do not knowingly collect personally identifiable information from children under 13. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us. If we become aware that we have collected personal information from children without verification of parental consent, we take steps to remove that information from our servers.</p>

            <h2>8. Changes to This Privacy Policy</h2>
            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>
            <p>For material changes, we may also provide a more prominent notice (such as an in-app notification or email).</p>

            <h2>9. Contact Us</h2>
            <p>If you have any questions or concerns about this Privacy Policy or our data practices, please contact us:</p>
            <ul>
              <li>By email: <a href="mailto:privacy@finloop.app">privacy@finloop.app</a> (or support@finloop.app)</li>
              <li>By visiting this page on our website: <Link href="/contact">Contact Us</Link> (if applicable)</li>
            </ul>
          </div>

          <div className="mt-12 p-6 bg-yellow-600/20 border border-yellow-500/50 rounded-lg text-center">
            <UserCog size={32} className="mx-auto mb-3 text-yellow-400" />
            <h3 className="text-xl font-semibold text-slate-100 mb-2">Legal Disclaimer</h3>
            <p className="text-slate-300 text-sm">
              This Privacy Policy is a template and for informational purposes only. It is essential to consult with a qualified legal professional to create a privacy policy that is tailored to your specific data processing activities, complies with all applicable privacy laws (like GDPR, CCPA, etc.), and accurately reflects your business practices. Finloop is not liable for any legal issues arising from the use of this template.
            </p>
          </div>
        </article>

        <div className="mt-12 text-center">
          <Link href="/terms" className="text-blue-400 hover:text-blue-300 transition-colors group inline-flex items-center">
            Read our Terms of Service
            <ArrowLeft size={18} className="ml-2 group-hover:translate-x-1 transition-transform rotate-180" />
          </Link>
        </div>

      </div>
    </div>
  );
}