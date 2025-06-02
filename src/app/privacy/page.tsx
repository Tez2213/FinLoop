export default function PrivacyPolicyPage() {
  return (
    <div className="prose prose-slate max-w-3xl mx-auto py-12">
      <h1>Privacy Policy for Finloop</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <p>Welcome to Finloop! This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.</p>

      <h2>1. Information We Collect</h2>
      <p>We may collect personal information that you voluntarily provide to us when you register on the application, express an interest in obtaining information about us or our products and services, when you participate in activities on the application, or otherwise when you contact us.</p>
      <p>The personal information that we collect depends on the context of your interactions with us and the application, the choices you make, and the products and features you use. The personal information we collect may include the following:</p>
      <ul>
        <li>Name and Contact Data (e.g., email address)</li>
        <li>Credentials (e.g., passwords, password hints)</li>
        <li>Payment Data (e.g., UPI ID - though we don&apos;t process payments directly)</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>We use personal information collected via our application for a variety of business purposes described below...</p>
      {/* Add more sections as needed: Sharing Your Information, Security of Your Information, Your Data Rights, Contact Us, etc. */}
      <p className="mt-8 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
        <strong>Note:</strong> This is a placeholder privacy policy. You should consult with a legal professional to create a comprehensive and compliant privacy policy for your specific application and region.
      </p>
    </div>
  );
}