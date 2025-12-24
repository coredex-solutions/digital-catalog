import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Digital Catalog",
  description: "Privacy Policy for Digital Catalog platform",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>

      <h2>1. Introduction</h2>
      <p>
        This Privacy Policy explains how Digital Catalog ("we", "us", "our") collects, uses, and 
        protects information when you use our platform ("Service"). We are committed to protecting 
        your privacy and ensuring the security of your data.
      </p>

      <h2>2. Information We Collect</h2>
      
      <h3>2.1 Account Information</h3>
      <p>When you create an account, we collect:</p>
      <ul>
        <li>Email address</li>
        <li>Name</li>
        <li>Password (stored securely using industry-standard hashing)</li>
      </ul>

      <h3>2.2 Catalog Content</h3>
      <p>When you create catalogs, we store:</p>
      <ul>
        <li>Business information (name, description, contact details)</li>
        <li>Product and category information</li>
        <li>Images you upload</li>
        <li>Operating hours and location data</li>
      </ul>

      <h3>2.3 Analytics Data</h3>
      <p>We collect anonymous analytics including:</p>
      <ul>
        <li>Page views and unique visitors (using browser fingerprinting, not personal data)</li>
        <li>Button clicks (WhatsApp orders, booking confirmations)</li>
        <li>Geographic region (country-level only)</li>
      </ul>

      <h3>2.4 Technical Data</h3>
      <p>We automatically collect:</p>
      <ul>
        <li>IP address (for security and rate limiting)</li>
        <li>Browser type and version</li>
        <li>Device information</li>
        <li>Access times and dates</li>
      </ul>

      <h2>3. How We Use Your Information</h2>
      <p>We use collected information to:</p>
      <ul>
        <li>Provide and maintain the Service</li>
        <li>Process subscriptions and payments</li>
        <li>Send important notifications about your account</li>
        <li>Provide analytics and insights about your catalog performance</li>
        <li>Improve and optimize the Service</li>
        <li>Detect and prevent fraud or abuse</li>
        <li>Comply with legal obligations</li>
      </ul>

      <h2>4. Data Storage and Security</h2>
      <p>
        We implement industry-standard security measures to protect your data:
      </p>
      <ul>
        <li>All data is encrypted in transit using TLS/SSL</li>
        <li>Passwords are hashed using bcrypt</li>
        <li>Access to data is restricted to authorized personnel</li>
        <li>Regular security audits and updates</li>
      </ul>

      <h2>5. Data Sharing</h2>
      <p>We do not sell your personal data. We may share data with:</p>
      <ul>
        <li>Service providers who help operate the platform (hosting, storage)</li>
        <li>Law enforcement when legally required</li>
        <li>Third parties with your explicit consent</li>
      </ul>

      <h2>6. Data Retention</h2>
      <p>
        We retain your data for as long as your account is active or as needed to provide the Service. 
        If you delete your account, we will delete your data within 30 days, except where retention 
        is required by law.
      </p>

      <h2>7. Your Rights</h2>
      <p>Depending on your location, you may have the right to:</p>
      <ul>
        <li>Access your personal data</li>
        <li>Correct inaccurate data</li>
        <li>Delete your data</li>
        <li>Export your data in a portable format</li>
        <li>Object to certain processing</li>
        <li>Withdraw consent</li>
      </ul>

      <h2>8. Cookies and Tracking</h2>
      <p>
        We use minimal cookies necessary for the Service to function. We use browser fingerprinting 
        for analytics purposes, which does not identify individuals but helps count unique visitors.
      </p>

      <h2>9. Children's Privacy</h2>
      <p>
        The Service is not intended for children under 16. We do not knowingly collect data from 
        children. If you believe a child has provided us with personal data, please contact us.
      </p>

      <h2>10. International Data Transfers</h2>
      <p>
        Your data may be processed in countries other than your own. We ensure appropriate safeguards 
        are in place for any international transfers.
      </p>

      <h2>11. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy periodically. We will notify you of significant changes 
        via email or through the Service.
      </p>

      <h2>12. Contact Us</h2>
      <p>
        For privacy-related questions or to exercise your rights, please contact us through the platform.
      </p>
    </>
  );
}

