# Chowly — The Grill House

An in-restaurant digital dining app: browse the menu, place an order, track it
through the kitchen, report a delay, and pay — without a login, switching
between a customer view and a staff view.

Built on the submitted data model: Customer, Restaurant, MenuItem, Waiter,
Chef, Bartender, Order, OrderItem (bridge table), Payment, Complaint.

## Stack

- Next.js 14 (App Router)
- Supabase (Postgres)
- Vercel (deployment)

## Setup — do these in order

### 1. Create a Supabase project
1. Go to supabase.com → sign up/log in with GitHub → "New project"
2. Once it's created, go to the SQL Editor → New query
3. Paste the entire contents of `supabase-schema.sql` (included in this
   project) and click Run. This creates every table from the data model
   plus one sample restaurant (The Grill House) with a waiter, chef,
   bartender, and menu.
4. Go to Project Settings → API (or the "Connect" button) and copy your
   **Project URL** and **anon/public** (or "publishable") key.

### 2. Push this code to your own GitHub
1. Create a new empty repository on github.com (e.g. "chowly-grillhouse")
2. Use GitHub Desktop: File → Add local repository → select this folder →
   "create a repository" → commit → Publish repository

### 3. Deploy on Vercel
1. Go to vercel.com → Add New → Project → import your new GitHub repo
2. Before deploying, add two Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = your Supabase anon/public key
3. Click Deploy

### 4. Test it
Open the live link, place an order as a customer, then open "Staff" to
assign a chef/bartender and mark it Completed, then go back and pay.

## Data model notes

- Chef and bartender are assigned **per order item** (not per whole order),
  matching the submitted model's OrderItem bridge table — a food item gets
  a chef, a drink item gets a bartender, never both on the same line.
- `order_status` moves through `In Progress → Completed`, and can also be
  set to `Delayed` automatically when a complaint is filed on an order
  that hasn't been completed yet.
- Payment is one-to-one with an order (a unique constraint on
  `payments.order_id`), matching the submitted model.
