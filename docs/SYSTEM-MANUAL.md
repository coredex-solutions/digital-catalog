# Core Commerce: System Manual

As of 19 November 2026. Live, editable copy: https://claude.ai/artifact/N6cNK36efMs4q4gEe9hQBW

## What Core Commerce is

The product is built and tested; what remains before selling is putting it on the server, filling in a few business details, and testing on real phones.

Core Commerce, by Coredex Solutions, gives a Lebanese business its own page that customers open from a QR code, a link or Instagram. On that page customers can browse, order, book or reserve, in Arabic or English. Orders reach the owner on WhatsApp and are also saved in the owner's dashboard.

It serves five kinds of business:

- Restaurants
- Cafés and bakeries
- Shops
- Services such as salons and clinics
- Stays such as chalets and guesthouses

The business pays a yearly plan and Core Commerce takes no commission on orders.

## What the customer sees

Customers need no app or account. They open the business page on their phone, in Arabic (right to left) or English.

| Feature | What it does | Business types |
| --- | --- | --- |
| Business page | Photos, prices in USD and LBP, categories, search, opening hours, branches, FAQs | All |
| Basket and checkout | Pickup, delivery or dine-in. Delivery areas have their own fee, minimum order and free-delivery amount | Restaurant, café, shop |
| Payment choice | Cash, card on delivery, Whish or OMT. Whish shows the owner's number and the amount to send | All that take orders |
| WhatsApp order | The order is sent to the owner's WhatsApp, already written out | All that take orders |
| Order status page | A link where the customer sees whether the order is received, ready or on its way | All that take orders |
| Booking times | Only free times are shown. The customer can pick a staff member or "Anyone", and no time can be booked twice | Services, table bookings |
| Waiting list | If the chosen day is full, the customer joins a waiting list and is told when a time opens | Services |
| Stays | Check-in and check-out dates, free units only, weekend prices, deposits | Stays |
| Coupons and loyalty | Discount codes, plus a loyalty reward after a set number of finished orders | All that take orders |
| AI assistant | Answers questions about the menu and the business in Arabic or English | Essential plan and above |

## What the business owner gets

The owner signs up, picks a business type and runs everything from a dashboard that works on a phone. The menu adapts to the business type; for example, Calendar shows only for services and stays.

| Dashboard section | What the owner does there |
| --- | --- |
| Orders | Sees every order, changes its status (with undo), marks it paid, prints an 80 mm kitchen ticket, and messages the customer on WhatsApp in one tap |
| Calendar | Services: a day view per staff member, phone bookings, weekly repeat bookings, reminders and the waiting list. Stays: who is in which unit on which night |
| Customers | A list built from orders: visits, total spent, last order, WhatsApp and call buttons, CSV export |
| Offers | Coupons and the loyalty card |
| Items and categories | Adds products, prices, photos, stock, sizes and extras. AI can enhance photos and import a menu from a photo or file |
| Publish | Edits stay in a draft until published; earlier versions can be restored |
| About, hours, FAQs, branches | Business details shown on the page |
| AI assistant | What the AI assistant knows and how it answers |
| Analytics | Visits and order clicks |
| QR codes | Printable QR codes for tables, the counter or flyers |
| Settings | Delivery areas, payment methods, booking times, staff, deposits, Meta Pixel, Google Analytics, Google review link |
| Team | Adds staff logins with roles (owner, editor, viewer) |
| Billing | Current plan and renewal, paid by Whish or OMT |

New-order alerts can sound a chime and send a phone notification, so the owner does not have to keep the dashboard open.

## Plans and prices

Every new business starts on a free 14-day trial with Essential features, then picks a yearly plan. The source of truth is [lib/plans.ts](../lib/plans.ts).

| Plan | Price (USD per year) | Items | Categories | AI photos per month | Orders and bookings | AI assistant |
| --- | --- | --- | --- | --- | --- | --- |
| Free trial | 0, for 14 days | 200 | 20 | 5 | Yes | Yes |
| Starter | 49 | 100 | 15 | 0 | No, menu page only | No |
| Essential | 99 | 200 | 20 | 5 | Yes | Yes |
| Pro | 299 | 1,000 | 50 | 20 | Yes | Yes |
| Enterprise | 399 | 10,000 | 200 | 100 | Yes | Yes |

If a plan runs out and is not renewed, the page goes offline after 7 days. Owners pay by Whish or OMT, and you switch on their plan from the staff dashboard.

## Behind the scenes

The app runs on one rented server. The data and photos are stored with outside services, so the server can be rebuilt at any time without losing anything.

| Part | Service | What it holds or does | Needed to launch? |
| --- | --- | --- | --- |
| App server | Ubuntu server (VPS, 2 GB RAM) with Node.js, PM2, nginx and a free HTTPS certificate | Runs the website and dashboards | Yes |
| Database | Turso | Businesses, items, orders, bookings, customers | Yes |
| Photos | Cloudflare R2 | Item and cover photos | Yes |
| Email | Any SMTP mailbox | Signup codes and plan reminder emails | Yes |
| Daily job | Server crontab | Sends plan-ending reminder emails every morning | Yes |
| Phone alerts | Web Push (free, needs two keys) | New-order and waiting-list alerts on the owner's phone | Strongly recommended |
| AI photos and menu import | Google Gemini | Enhances photos, reads printed menus | Optional |
| AI assistant | Google Gemini (same key as AI photos); voice questions use Groq | Chats with customers on the business page | Optional |

**Security:**

- Logins use signed tokens.
- Every dashboard request checks the owner's role.
- Prices, fees, stock and booking times are checked on the server, never trusted from the customer's phone.
- Order, booking, waiting-list and login forms are rate limited against spam and password guessing. Every page sends standard browser security headers.

**Quality:**

- 123 automatic tests cover orders, delivery, payments, bookings, staff, the waiting list, coupons, plans and Arabic wording.
- A full launch test on 19 November 2026 opened 255 pages in both languages at phone width, ran 51 order and booking checks and 14 email checks on a production build, and found no known security problems in the packages.

## What is missing before production

No features are missing for launch. What is missing is the live setup, a few business details, and real-phone testing. The latest code on GitHub is not yet on the live site.

**Must do before the first paying customer:**

| What is missing | Why it matters | Who |
| --- | --- | --- |
| Server and domain: rent a 2 GB VPS and point the domain at it | Nothing is live until this is done | You |
| Server settings file (.env.local): Turso, R2, JWT secret, site address, email (SMTP) | Without these the app does not start, or signups get no email code | You |
| Daily-job secret and crontab line | Plan-ending reminder emails are not sent | You |
| Phone-alert keys (VAPID) | Owners only get alerts while the dashboard is open | You |
| Lebanese (+961) sales WhatsApp number | The site and the demo pages still use the old +966 number | You |
| Whish and OMT payment details | The billing page cannot tell owners where to pay | You |
| Run the update script (deploy/update.sh) | Creates the new database parts: delivery, payments, bookings, staff, waiting list, stays, marketing | You |
| Reload the demo pages | The demo salon gets its staff and the demos get the right phone number | You |
| Test on a real iPhone and a real Android phone | Phone alerts have never reached a real device; WhatsApp ordering and Arabic need checking on real phones | You, with Claude's test list |
| Backups and uptime alert: confirm Turso backups and add a free uptime monitor | You learn about an outage from a monitor, not from a customer | You |

**Should do in the first weeks:**

| What is missing | Why it matters | Who |
| --- | --- | --- |
| AI keys (Google Gemini, Groq) | Without Gemini, AI photos, menu import and the AI assistant are off; without Groq, About-page writing and voice questions are off | You |
| Demo pages show no delivery areas, Whish or OMT, coupons or loyalty card | Businesses trying the demos don't see what sets Core Commerce apart | Claude |
| Subscription receipts | Owners paying by Whish or OMT will ask for a receipt; today this is manual | You decide, Claude can build |
| 5 to 10 pilot businesses | Real quotes and photos for the landing page, which has no testimonials yet | You |
| Sales materials: the pitch decks and launch checklist were deleted | Needed for meetings with businesses | Claude can rebuild |
| Review the privacy and terms pages | They should name the company, a Lebanese contact and how orders are stored | You |

## After launch: features competitors have that we don't

None of these block launch. Pilot businesses should decide which comes first.

| Feature | Who has it | Effort |
| --- | --- | --- |
| Owner's own web address (for example, order.mycafe.com) | Zyda, Shopify | Medium |
| Card payments online (Areeba or Tap) | Zyda, Foodics | Needs a merchant account first |
| Airbnb calendar link for stays | Booking tools | Small |
| AI that takes orders inside WhatsApp chats | Zyda | Large |
| Pay at the table | Restbits, BIM POS | Medium |
| Links to cashier systems and delivery apps | Foodics, Restbits | Large |
| Gulf currencies (SAR, AED, JOD) | Zyda, Salla, Zid | Small to medium |

Where we already lead: we are the only product with USD and LBP side by side and Whish, OMT and cash on delivery at checkout. We cover five business types, with Arabic and WhatsApp built in, from $49 a year with no commission.

## Launch steps, in order

Tick each step as you go. The full server instructions are in [deploy/README.md](../deploy/README.md).

- [ ] Send Claude the +961 WhatsApp number, the site address and the Whish/OMT details
- [ ] Rent the server and point the domain at it (deploy/README.md, steps 1 to 3)
- [ ] Create the settings file with all the keys (step 4)
- [ ] Build and start the app, then add HTTPS (steps 5 and 6)
- [ ] Run deploy/update.sh so the database is up to date
- [ ] Reload the demo pages and create the staff login (step 7)
- [ ] Add the daily reminder job (step 8)
- [ ] Add an uptime monitor and confirm Turso backups
- [ ] Test on a real iPhone and Android: sign up, add items, order, book, join a waiting list, get the phone alert
- [ ] Sign the first pilot business
