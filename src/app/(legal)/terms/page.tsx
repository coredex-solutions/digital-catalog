import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The terms for restaurants and cafés using Coredex digital menus.",
};

const UPDATED = "9 October 2026";

export default function TermsPage() {
  return (
    <article>
      <h1>Terms of service</h1>
      <p className="text-ui-muted">Last updated {UPDATED}</p>

      <p>
        These terms apply to restaurants, cafés and other businesses (&ldquo;you&rdquo;) that create a menu with
        Coredex. By creating an account you agree to them. Questions:{" "}
        <a href="mailto:info@coredex.solutions">info@coredex.solutions</a>.
      </p>

      <h2>The service</h2>
      <p>
        Coredex lets you publish a digital menu at a web address and QR code, in Arabic and English. Guests can send you orders and reservation requests through WhatsApp. Coredex passes the
        message to WhatsApp; it does not take, confirm or track orders, and it does not process payments from guests.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>Give accurate details and keep your password private. You are responsible for what is done with your account.</li>
        <li>One account per business, unless we agree otherwise.</li>
      </ul>

      <h2>Your menu content</h2>
      <ul>
        <li>You own your content: dishes, prices, photos, descriptions and other information.</li>
        <li>You let us store and display it so your menu works, including on your public menu page and in search engines.</li>
        <li>You are responsible for its accuracy, including prices, the exchange rate you set, allergens and availability, and for having the rights to the photos you upload.</li>
        <li>Content must be lawful and must not mislead guests.</li>
      </ul>

      <h2>AI features</h2>
      <p>
        AI features (such as the AI waiter, writing help and photo enhancement) can make mistakes. Check AI-written
        text and AI-edited photos before you publish them. Photos changed by AI should still show the dish as it is served.
      </p>

      <h2>Plans and trial</h2>
      <ul>
        <li>New accounts start with a free 2-day trial.</li>
        <li>Plans are paid yearly, at the prices shown on our website when you subscribe. Payment is arranged directly with us.</li>
        <li>Each plan has limits, for example on the number of dishes and categories, and some features are only in higher plans.</li>
        <li>When a trial or plan ends, your menu stays online for 7 more days so you can renew. After that, the menu stops being shown to guests and editing is paused until you renew. Your content is kept.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>
        Do not use Coredex to break the law, to send spam, to try to access other accounts or to disrupt the service.
        We may suspend accounts that do.
      </p>

      <h2>Availability</h2>
      <p>
        We work to keep Coredex available and secure, but we cannot promise it will never be interrupted. We may
        change or improve features over time.
      </p>

      <h2>Liability</h2>
      <p>
        Coredex is provided as is. To the extent the law allows, we are not liable for indirect losses, such as lost
        orders or profits, and our total liability is limited to the amount you paid us in the 12 months before the claim.
      </p>

      <h2>Ending the service</h2>
      <p>
        You can stop using Coredex at any time and ask us to delete your account. We may end or suspend an account
        that breaks these terms, after notice where reasonable.
      </p>

      <h2>Changes</h2>
      <p>If we change these terms we will update the date above and tell owners by email about significant changes.</p>
    </article>
  );
}
