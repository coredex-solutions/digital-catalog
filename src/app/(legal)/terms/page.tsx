import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Digital Catalog",
  description: "Terms of Service for Digital Catalog platform",
};

export default function TermsOfServicePage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p className="text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing and using the Digital Catalog platform ("Service"), you agree to be bound by these 
        Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        Digital Catalog is a software-as-a-service (SaaS) platform that allows businesses to create 
        and manage digital product catalogs, menus, and storefronts. The Service includes:
      </p>
      <ul>
        <li>Digital catalog creation and customization</li>
        <li>Product and category management</li>
        <li>QR code generation for catalog access</li>
        <li>Analytics and visitor tracking</li>
        <li>Integration with WhatsApp for orders</li>
      </ul>

      <h2>3. User Accounts</h2>
      <p>
        To use certain features of the Service, you must create an account. You agree to:
      </p>
      <ul>
        <li>Provide accurate and complete information</li>
        <li>Maintain the security of your account credentials</li>
        <li>Notify us immediately of any unauthorized access</li>
        <li>Accept responsibility for all activities under your account</li>
      </ul>

      <h2>4. Subscription and Payments</h2>
      <p>
        Access to the Service requires a paid subscription. Subscription terms include:
      </p>
      <ul>
        <li>Yearly subscriptions renew automatically unless cancelled</li>
        <li>Lifetime ("forever") subscriptions provide permanent access</li>
        <li>Custom term subscriptions are available upon request</li>
        <li>Refunds are provided at our discretion and in accordance with applicable law</li>
      </ul>

      <h2>5. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for any illegal purposes</li>
        <li>Upload content that infringes intellectual property rights</li>
        <li>Attempt to gain unauthorized access to the Service</li>
        <li>Interfere with or disrupt the Service</li>
        <li>Use automated systems to access the Service without permission</li>
        <li>Upload malicious content or attempt to harm other users</li>
      </ul>

      <h2>6. Content Ownership</h2>
      <p>
        You retain ownership of all content you upload to the Service. By uploading content, you grant us 
        a license to display and distribute that content as necessary to provide the Service.
      </p>

      <h2>7. Service Availability</h2>
      <p>
        We strive to maintain high availability but do not guarantee uninterrupted access. We may 
        temporarily suspend the Service for maintenance, updates, or security reasons.
      </p>

      <h2>8. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, 
        special, consequential, or punitive damages arising from your use of the Service.
      </p>

      <h2>9. Termination</h2>
      <p>
        We may suspend or terminate your access to the Service at any time for violation of these Terms. 
        Upon termination, your right to use the Service will immediately cease.
      </p>

      <h2>10. Changes to Terms</h2>
      <p>
        We reserve the right to modify these Terms at any time. We will notify users of significant 
        changes. Continued use of the Service after changes constitutes acceptance of the modified Terms.
      </p>

      <h2>11. Contact</h2>
      <p>
        For questions about these Terms, please contact us through the platform.
      </p>
    </>
  );
}

