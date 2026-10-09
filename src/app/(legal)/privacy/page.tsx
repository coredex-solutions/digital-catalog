import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What Coredex collects from restaurant owners and their guests, why, and who processes it.",
};

const UPDATED = "9 October 2026";

export default function PrivacyPage() {
  return (
    <article>
      <h1>Privacy policy</h1>
      <p className="text-ui-muted">Last updated {UPDATED}</p>

      <p>
        Coredex provides digital QR menus for restaurants and cafés. This policy explains what we collect from
        restaurant owners who use Coredex (&ldquo;owners&rdquo;) and from people who open a restaurant&rsquo;s menu
        (&ldquo;guests&rdquo;), what we use it for, and who processes it for us. Questions:{" "}
        <a href="mailto:info@coredex.solutions">info@coredex.solutions</a>.
      </p>

      <h2>Restaurant owners</h2>
      <ul>
        <li><strong>Account:</strong> your name, email address and a password, which we store only as a one-way hash.</li>
        <li><strong>Email verification:</strong> a six-digit code we email you at signup. It expires after 10 minutes.</li>
        <li><strong>Menu content:</strong> everything you add to your menu: dishes, prices, exchange rate, photos, opening hours, branches, contact numbers, social links and FAQs. This content is public on your menu page.</li>
        <li><strong>Plan details:</strong> your plan, its dates and any upgrade requests. Payments are arranged directly with us; we do not store card details.</li>
      </ul>

      <h2>Guests</h2>
      <p>Guests do not need an account. When someone opens a menu:</p>
      <ul>
        <li><strong>Preferences on the device:</strong> the chosen language and light or dark mode are kept in cookies, and the current order is kept in the browser&rsquo;s local storage. They stay on the device.</li>
        <li><strong>Visit statistics:</strong> we count menu views and WhatsApp order taps for the restaurant&rsquo;s statistics. To estimate unique visitors we store an identifier derived from browser characteristics (such as browser type, language, screen size and time zone). We do not store names, phone numbers or IP addresses for these statistics.</li>
        <li><strong>Orders by WhatsApp:</strong> the order message, with the name, phone number, address or table number the guest types, is put together in the guest&rsquo;s browser and sent through WhatsApp directly to the restaurant. Coredex does not receive or store it. WhatsApp&rsquo;s own privacy policy applies to the message.</li>
        <li><strong>AI waiter (if the restaurant turned it on):</strong> questions typed or spoken to the AI waiter, and the menu they relate to, are sent to our AI provider to produce an answer. Spoken answers are produced by a text-to-speech provider. Please do not share sensitive personal information with it.</li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To run the service: show menus, let owners sign in and edit them, and send verification codes.</li>
        <li>To show owners statistics about their own menu.</li>
        <li>To keep the service secure, for example by limiting repeated sign-in attempts. For this we briefly record the IP address of requests; these records are deleted after about a day.</li>
      </ul>
      <p>We do not sell personal information and we do not use it for advertising.</p>

      <h2>Who processes it for us</h2>
      <ul>
        <li><strong>Turso</strong> hosts the database.</li>
        <li><strong>Cloudflare R2</strong> stores uploaded images.</li>
        <li>Our <strong>email provider</strong> sends verification emails.</li>
        <li><strong>Google (Gemini)</strong>, <strong>Groq</strong> and <strong>OpenAI</strong> provide AI features such as the AI waiter, text-to-speech, writing help and photo enhancement, only when those features are used.</li>
        <li>Our <strong>hosting provider</strong> runs the servers that serve the site.</li>
      </ul>
      <p>These providers may process data outside Lebanon.</p>

      <h2>How long we keep it</h2>
      <ul>
        <li>Account and menu content: while the account exists. Ask us to delete your account and we delete its content.</li>
        <li>Verification codes: replaced by the next code and invalid after 10 minutes.</li>
        <li>Visit statistics: while the restaurant&rsquo;s account exists.</li>
      </ul>

      <h2>Your choices</h2>
      <p>
        Owners can edit or remove their menu content at any time and can ask us for a copy of their data or for
        deletion. Guests can clear the cookies and local storage in their browser. For any request, email{" "}
        <a href="mailto:info@coredex.solutions">info@coredex.solutions</a>.
      </p>

      <h2>Changes</h2>
      <p>If we change this policy we will update the date above, and tell owners by email about significant changes.</p>
    </article>
  );
}
