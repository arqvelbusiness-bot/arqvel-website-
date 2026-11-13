/* ================================================================
   Cafe Yelove — settings
   Leave SUPABASE_URL / SUPABASE_ANON_KEY empty to run in DEMO MODE:
   orders and reservations are kept in this browser only, which is
   perfect for showing the owner (open the website and admin.html in
   two tabs of the same browser and orders appear live).
   Fill them in (see README.md) to go live.
   ================================================================ */
window.YELOVE_CONFIG = {
  CAFE_NAME: 'Cafe Yelove',

  // Supabase project (Project Settings → API). Anon key is safe to publish.
  SUPABASE_URL: 'https://tsuvufsacmhgwppzsaxg.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_Q1ceBG9pgKeIIxLJ5FAdrg_-OnmcK1C',

  TABLES: 15,              // number of tables (QR cards + validation)
  GST_RATE: 0.05,          // prices are exclusive of 5% GST
  PHONE: '+917010654931',  // café phone, used for calls / WhatsApp

  DEMO_PIN: '1234'         // counter login PIN in demo mode only
};
