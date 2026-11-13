# Cafe Yelove — website, QR table ordering & counter dashboard

Built by **ARQVEL**. Two customer products + one staff screen, sharing one menu and one database:

| Page | Who uses it | What it does |
|---|---|---|
| `index.html` | Anyone from Google Maps / Instagram | Rich 3D website: menu to browse, drinks, moods, reviews, location, **reserve a table**. No ordering. |
| `order.html` | Guests at a table (via QR) | Phone-first ordering: categories, dish cards with 3D thumbnails, tap a dish to see it turn in 3D, cart, **name + table**, place order. Pay at the counter. |
| `admin.html` | Counter / kitchen staff | Live orders, mark paid (cash/UPI), reservations, sold-out switches, order history + CSV |
| `qr-cards.html` | You | Prints the café QR (one for all tables, or one per table) pointing to `order.html` |

Old links like `index.html?table=7` automatically open the ordering app.

## What's inside

| File | What it is |
|---|---|
| `index.html` | The public website (browse + reserve) |
| `order.html`, `js/order.js` | The QR ordering app |
| `thumbs/` | Pre-rendered 3D dish pictures used by the ordering app |
| `admin.html` | Counter dashboard: live orders, payments, reservations, sold-out switches, order history with CSV export |
| `qr-cards.html` | Printable QR card for every table |
| `js/config.js` | **All settings**: Supabase keys, café UPI ID, number of tables, demo PIN |
| `js/menu.js` | **The menu**: names, prices, descriptions, veg flags. Edit prices here |
| `js/store.js` | Data layer (demo mode or Supabase) |
| `js/scene.js` | The 3D dishes |
| `js/app.js`, `js/admin.js` | Website and dashboard logic |
| `supabase/schema.sql` | Database tables + security rules |
| `js/vendor/` | three.js, Supabase and QR libraries, bundled so nothing depends on outside CDNs |

## 1. Demo mode (for the pitch, no setup)

1. Open `index.html?table=7` in Chrome. Add dishes and tap **Place order**.
2. In another tab of the **same browser**, open `admin.html` and enter PIN `1234`.
3. The order appears on the dashboard with a chime. Move it through *Start preparing → Mark served → Paid UPI*.
4. Reserve a table from the website; it shows under **Reservations** with a one-tap WhatsApp confirm.
5. Switch a dish off under **Menu** and refresh the website: it shows **Sold out**.
6. **Order history** shows past orders by day (Today, Yesterday, Last 7/30 days, This month or any dates), with totals, best-sellers, payment split, search, and **Export CSV** for accounts.

Demo data lives only in that browser. Use **Reset demo** on the dashboard to clear it.

> Tip: some browsers block local files talking to each other. If anything doesn't load from double-clicking, run a tiny local server in the folder: `npx serve .` (or `python3 -m http.server`) and open `http://localhost:3000`.

## 2. Go live (about 30 minutes)

**a. Database: Supabase (free tier)**
1. Create a project at supabase.com (region: Mumbai).
2. SQL Editor → paste `supabase/schema.sql` → Run.
3. Authentication → Providers → Email → **turn off "Allow new users to sign up"**.
4. Authentication → Users → **Add user** for each staff login (email + password).
5. Project Settings → API → copy the **Project URL** and **anon public key** into `js/config.js`.

**b. Café details** in `js/config.js`
- `TABLES`: number of tables.

**c. Hosting: Vercel or Netlify (free)**
- Drag the whole folder into app.netlify.com/drop, or push it to GitHub and import it in Vercel.
- Connect the domain (e.g. `cafeyelove.in`) in the hosting dashboard.
- Add the site link to the café's Google Business Profile and Instagram bio.

**d. QR cards**
- Open `your-site/qr-cards.html`, check the address and table count, then **Print**. Laminate or put them in table stands.

## Name & table number

When placing an order, guests enter **their name** and **table number** (required). A per-table QR pre-fills the table; the "Any table" QR leaves it for the guest to choose. The counter sees both on every order, in history and in the CSV.

## How payment works (not on the website)

1. The guest orders and gets an order number, e.g. `T7-K4M`. The screen says "Pay at the counter".
2. After the meal, the guest pays at the counter: cash, or UPI using the café's own counter QR.
3. Staff check the money arrived, then tap **Paid UPI / Cash / Card** on the dashboard (this only records it for history).

## Updating the menu

- Prices and dishes: edit `js/menu.js` and re-deploy (ARQVEL pay-as-you-go update).
- Out of stock today: staff switch it off in **admin.html → Menu**. No code change needed.

## Security notes

- Guests can only *create* orders and booking requests; they cannot read or change anyone else's.
- Only logged-in staff can see orders, phone numbers and bookings. Keep sign-ups off.
- The anon key in `config.js` is designed to be public; never put the `service_role` key anywhere in this project.
- Prices shown to staff come from the guest's device. The counter confirms the total when taking payment.

## Phase 2 (later)

Pickup orders with online UPI payment (Razorpay / Cashfree), automatic WhatsApp updates, daily sales export.


## Safety checks (server side)

Run `supabase/upgrade-1-safety.sql` once (already included in `schema.sql` for new projects). It adds:
- **Real prices:** every order is re-priced in the database from `menu_prices`; edited prices on a phone are ignored.
- **Sold-out:** orders containing a sold-out dish are refused.
- **Spam limit:** max 6 orders per table per 10 minutes, 40 per minute overall. Phones also allow max 3 orders per 10 minutes.
- **No fake payments:** new orders are always "new" and "not paid".

`menu_prices` is refreshed automatically from `js/menu.js` every time staff log in to `admin.html`, so after changing prices: deploy, then open the dashboard once.
