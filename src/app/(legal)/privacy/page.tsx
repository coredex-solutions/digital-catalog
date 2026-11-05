import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What Coredex collects from business owners and their customers, why, and who processes it.",
};

const UPDATED = "4 November 2026";

export default function PrivacyPage() {
  return (
    <article>
      <h1>Privacy policy</h1>
      <p className="text-ui-muted">Last updated {UPDATED}</p>

      <p>
        Coredex lets restaurants, cafés, shops and service businesses publish an online page (a menu, a store or a
        list of services) and receive orders, bookings and appointment requests. This policy explains what we collect
        from business owners who use Coredex (&ldquo;owners&rdquo;) and from people who open a business&rsquo;s page
        (&ldquo;customers&rdquo;), what we use it for, and who processes it for us. Questions:{" "}
        <a href="mailto:info@coredex.solutions">info@coredex.solutions</a>.
      </p>

      <h2>Business owners</h2>
      <ul>
        <li><strong>Account:</strong> your name, email address and a password, which we store only as a one-way hash.</li>
        <li><strong>Email verification:</strong> a six-digit code we email you at signup. It expires after 10 minutes.</li>
        <li><strong>Page content:</strong> everything you add to your page: dishes, products or services, prices, exchange rate, photos, opening hours, branches, contact numbers, social links and FAQs. This content is public on your page. Stock counts and SKUs are not shown to customers.</li>
        <li><strong>Plan details:</strong> your plan, its dates and any upgrade requests. Payments are arranged directly with us; we do not store card details.</li>
      </ul>

      <h2>Customers</h2>
      <p>Customers do not need an account. When someone opens a business&rsquo;s page:</p>
      <ul>
        <li><strong>Preferences on the device:</strong> the chosen language and light or dark mode are kept in cookies, and the current order is kept in the browser&rsquo;s local storage. They stay on the device.</li>
        <li><strong>Visit statistics:</strong> we count page views and order taps for the business&rsquo;s statistics. To estimate unique visitors we store an identifier derived from browser characteristics (such as browser type, language, screen size and time zone). We do not store names, phone numbers or IP addresses for these statistics.</li>
        <li><strong>Orders, bookings and requests:</strong> when a customer sends one, we save it for that business: the name and phone number they type, the items, the order type and, where the business asks for them, a table number, a delivery or visit address, a preferred date and time, the number of people and a note. The business sees it in its dashboard and uses it to prepare the order and contact the customer. The customer can then send the same details to the business on WhatsApp; WhatsApp&rsquo;s own privacy policy applies to that message.</li>
        <li><strong>AI assistant (if the business turned it on):</strong> questions typed or spoken to the AI assistant, and the menu they relate to, are sent to our AI provider to produce an answer. Spoken answers are produced by a text-to-speech provider. Please do not share sensitive personal information with it.</li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To run the service: show pages, let owners sign in and edit them, and send verification codes.</li>
        <li>To pass customers&rsquo; orders, bookings and requests to the business they chose.</li>
        <li>To show owners statistics about their own page.</li>
        <li>To keep the service secure, for example by limiting repeated sign-in attempts and repeated orders. For this we briefly record the IP address of requests and, for orders, the phone number entered; these records are deleted after about a day.</li>
      </ul>
      <p>We do not sell personal information and we do not use it for advertising.</p>

      <h2>Who processes it for us</h2>
      <ul>
        <li><strong>Turso</strong> hosts the database.</li>
        <li><strong>Cloudflare R2</strong> stores uploaded images.</li>
        <li>Our <strong>email provider</strong> sends verification emails.</li>
        <li>When an owner turns on order notifications, the browser&apos;s <strong>push service</strong> (Google, Apple, Mozilla or Microsoft, depending on the device) delivers them. The notification&apos;s content is encrypted for that device.</li>
        <li><strong>Google (Gemini and Cloud Text-to-Speech)</strong>, <strong>Groq</strong> and <strong>OpenAI</strong> provide AI features such as the AI assistant, its spoken replies, writing help and photo enhancement, only when those features are used. If spoken replies aren&apos;t set up, the customer&apos;s own phone reads them aloud.</li>
        <li>Our <strong>hosting provider</strong> runs the servers that serve the site.</li>
      </ul>
      <p>These providers may process data outside Lebanon.</p>

      <h2>How long we keep it</h2>
      <ul>
        <li>Account and page content: while the account exists. Ask us to delete your account and we delete its content.</li>
        <li>Orders, bookings and requests: while the business&rsquo;s account exists, unless the business or the customer asks us to delete them sooner.</li>
        <li>Verification codes: replaced by the next code and invalid after 10 minutes.</li>
        <li>Visit statistics: while the business&rsquo;s account exists.</li>
      </ul>

      <h2>Your choices</h2>
      <p>
        Owners can edit or remove their page content at any time and can ask us for a copy of their data or for
        deletion. Customers can clear the cookies and local storage in their browser, and can ask the business, or
        us, to delete an order or request they sent. For any request, email{" "}
        <a href="mailto:info@coredex.solutions">info@coredex.solutions</a>.
      </p>

      <h2>Changes</h2>
      <p>If we change this policy we will update the date above, and tell owners by email about significant changes.</p>
    </article>
  );
}
