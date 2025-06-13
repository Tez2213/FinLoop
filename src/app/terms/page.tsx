import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, FileText, ShieldAlert, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the Terms of Service for using the Finloop application. Understand your rights and responsibilities when using our platform.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsOfServicePage() {
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
            <FileText size={48} className="mx-auto mb-4 text-purple-400" />
            <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Terms of Service
            </h1>
            <p className="text-slate-400">Last Updated: {lastUpdatedDate}</p>
          </header>

          <div className="prose prose-invert prose-lg max-w-none 
                        prose-headings:text-slate-100 prose-headings:font-semibold 
                        prose-p:text-slate-300 prose-a:text-blue-400 prose-a:no-underline hover:prose-a:text-blue-300
                        prose-strong:text-slate-100 prose-ul:text-slate-300 prose-li:marker:text-purple-400">

            <p>Welcome to Finloop! These Terms of Service ("Terms") govern your use of the Finloop application and its related services (collectively, the "Service"), operated by the Finloop Team ("us", "we", or "our").</p>
            <p>Please read these Terms carefully. By accessing or using our Service, you agree to be bound by these Terms and our <Link href="/privacy">Privacy Policy</Link>. If you do not agree with any part of these Terms, you may not access or use the Service.</p>

            <h2>1. Your Account</h2>
            <p>To use certain features of our Service, you may need to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete. We reserve the right to suspend or terminate your account if any information provided is found to be inaccurate, not current, or incomplete.</p>

            <h2>2. Using Our Service</h2>
            <p>You agree to use the Service only for lawful purposes and in accordance with these Terms. You will not use the Service:</p>
            <ul>
              <li>In any way that violates any applicable national or international law or regulation.</li>
              <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way.</li>
              <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter," "spam," or any other similar solicitation.</li>
              <li>To impersonate or attempt to impersonate Finloop, a Finloop employee, another user, or any other person or entity.</li>
              <li>In any way that infringes upon the rights of others, or in any way is illegal, threatening, fraudulent, or harmful, or in connection with any unlawful, illegal, fraudulent, or harmful purpose or activity.</li>
              <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service, or which, as determined by us, may harm or offend Finloop or users of the Service or expose them to liability.</li>
            </ul>

            <h2>3. Intellectual Property Rights</h2>
            <p>The Service and its original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of Finloop and its licensors. The Service is protected by copyright, trademark, and other laws of both [Your Country/Jurisdiction] and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Finloop.</p>
            <p>You grant Finloop a worldwide, non-exclusive, royalty-free license to use, reproduce, adapt, publish, translate and distribute any content you submit or make available through the Service, solely for the purpose of providing and improving the Service.</p>


            <h2>4. User Content</h2>
            <p>You are responsible for any content, including information, data, text, photographs, graphics, messages, or other materials ("User Content") that you upload, post, email, transmit, or otherwise make available via the Service. You represent and warrant that you own or have the necessary licenses, rights, consents, and permissions to your User Content.</p>
            <p>We do not claim ownership of your User Content. However, by submitting User Content, you grant us a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to use, reproduce, distribute, prepare derivative works of, display, and perform the User Content in connection with the Service and Finloop's (and its successors' and affiliates') business.</p>


            <h2>5. Termination</h2>
            <p>We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.</p>
            <p>If you wish to terminate your account, you may simply discontinue using the Service or contact us to request account deletion.</p>
            <p>All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.</p>

            <h2>6. Disclaimer of Warranties</h2>
            <p>The Service is provided on an "AS IS" and "AS AVAILABLE" basis. Finloop makes no representations or warranties of any kind, express or implied, as to the operation of their services, or the information, content, or materials included therein. You expressly agree that your use of these services, their content, and any services or items obtained from us is at your sole risk.</p>
            <p>Neither Finloop nor any person associated with Finloop makes any warranty or representation with respect to the completeness, security, reliability, quality, accuracy, or availability of the services. </p>

            <h2>7. Limitation of Liability</h2>
            <p>EXCEPT AS PROHIBITED BY LAW, YOU WILL HOLD US AND OUR OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS HARMLESS FOR ANY INDIRECT, PUNITIVE, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGE, HOWEVER IT ARISES (INCLUDING ATTORNEYS' FEES AND ALL RELATED COSTS AND EXPENSES OF LITIGATION AND ARBITRATION), WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE, OR OTHER TORTIOUS ACTION, OR ARISING OUT OF OR IN CONNECTION WITH THIS AGREEMENT, INCLUDING WITHOUT LIMITATION ANY CLAIM FOR PERSONAL INJURY OR PROPERTY DAMAGE, ARISING FROM THIS AGREEMENT AND ANY VIOLATION BY YOU OF ANY FEDERAL, STATE, OR LOCAL LAWS, STATUTES, RULES, OR REGULATIONS, EVEN IF FINLOOP HAS BEEN PREVIOUSLY ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. </p>

            <h2>8. Governing Law</h2>
            <p>These Terms shall be governed and construed in accordance with the laws of [Your Country/State/Jurisdiction], without regard to its conflict of law provisions.</p>
            <p>Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.</p>

            <h2>9. Changes to Terms</h2>
            <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>
            <p>By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you are no longer authorized to use the Service.</p>

            <h2>10. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us:</p>
            <ul>
              <li>By email: <a href="mailto:support@finloop.app">support@finloop.app</a></li>
              <li>By visiting this page on our website: <Link href="/contact">Contact Us</Link> (assuming you have a contact page)</li>
            </ul>
          </div>

          <div className="mt-12 p-6 bg-purple-600/20 border border-purple-500/50 rounded-lg text-center">
            <ShieldAlert size={32} className="mx-auto mb-3 text-purple-400" />
            <h3 className="text-xl font-semibold text-slate-100 mb-2">Important Legal Notice</h3>
            <p className="text-slate-300 text-sm">
              This Terms of Service document is a template and provided for informational purposes only. It is crucial to consult with a qualified legal professional to ensure these terms are comprehensive, accurate, and compliant with all applicable laws and regulations for your specific application, services, and jurisdiction. Finloop is not responsible for any legal issues arising from the use of this template.
            </p>
          </div>
        </article>

        <div className="mt-12 text-center">
          <Link href="/privacy" className="text-blue-400 hover:text-blue-300 transition-colors group inline-flex items-center">
            Read our Privacy Policy
            <ArrowLeft size={18} className="ml-2 group-hover:translate-x-1 transition-transform rotate-180" />
          </Link>
        </div>

      </div>
    </div>
  );
}