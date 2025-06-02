export default function TermsOfServicePage() {
  return (
    <div className="prose prose-slate max-w-3xl mx-auto py-12">
      <h1>Terms of Service for Finloop</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <p>Please read these Terms of Service (&quot;Terms&quot;, &quot;Terms of Service&quot;) carefully before using the Finloop application (the &quot;Service&quot;) operated by us.</p>
      <p>Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who access or use the Service.</p>
      <p>By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.</p>

      <h2>1. Accounts</h2>
      <p>When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>

      <h2>2. Use of Service</h2>
      <p>You agree not to use the Service for any unlawful purpose or any purpose prohibited under this clause. You agree not to use the Service in any way that could damage the Service, the reputation of Finloop, or the general business of Finloop.</p>
      {/* Add more sections as needed: Intellectual Property, Termination, Limitation of Liability, Governing Law, Changes, Contact Us, etc. */}

      <p className="mt-8 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
        <strong>Note:</strong> This is a placeholder Terms of Service. You should consult with a legal professional to create comprehensive and compliant Terms of Service for your specific application and region.
      </p>
    </div>
  );
}