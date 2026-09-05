"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function OrderPage() {
  const router = useRouter();
  const [restaurant, setRestaurant] = useState(null);
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState({});
  const [step, setStep] = useState("menu");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [lastOrderId, setLastOrderId] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLastOrderId(window.localStorage.getItem("chowly_grillhouse_last_order_id"));
    }
  }, []);

  useEffect(() => {
    async function load() {
      const { data: restaurants, error: rErr } = await supabase.from("restaurants").select("*").limit(1);
      if (rErr || !restaurants?.length) {
        setError("Couldn't load the restaurant. Please refresh.");
        setLoading(false);
        return;
      }
      const r = restaurants[0];
      setRestaurant(r);

      const { data: menu, error: mErr } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", r.id)
        .order("item_type", { ascending: true });

      if (mErr) setError("Couldn't load the menu. Please refresh.");
      else setItems(menu || []);
      setLoading(false);
    }
    load();
  }, []);

  const cartCount = useMemo(() => Object.values(cart).reduce((s, q) => s + q, 0), [cart]);
  const cartTotal = useMemo(
    () => items.reduce((sum, item) => sum + (cart[item.id] || 0) * Number(item.price), 0),
    [cart, items]
  );

  function updateQty(id, delta) {
    setCart((prev) => {
      const next = { ...prev };
      const updated = Math.max(0, (next[id] || 0) + delta);
      if (updated === 0) delete next[id];
      else next[id] = updated;
      return next;
    });
  }

  async function placeOrder(e) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Please enter your name and phone number.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const { data: customer, error: cErr } = await supabase
        .from("customers")
        .insert({ name: name.trim(), phone_number: phone.trim(), email: email.trim() || null })
        .select()
        .single();
      if (cErr) throw cErr;

      const { data: order, error: oErr } = await supabase
        .from("orders")
        .insert({ restaurant_id: restaurant.id, customer_id: customer.id, order_status: "In Progress" })
        .select()
        .single();
      if (oErr) throw oErr;

      const rows = Object.entries(cart).map(([menu_item_id, quantity]) => {
        const item = items.find((i) => i.id === menu_item_id);
        return {
          order_id: order.id,
          menu_item_id,
          quantity,
          waiting_time: item?.avg_waiting_time || null,
        };
      });
      const { error: oiErr } = await supabase.from("order_items").insert(rows);
      if (oiErr) throw oiErr;

      if (typeof window !== "undefined") {
        window.localStorage.setItem("chowly_grillhouse_last_order_id", order.id);
      }
      router.push(`/order/${order.id}`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong placing your order. Please try again.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="shell">
        <p className="muted">Loading the menu…</p>
      </main>
    );
  }

  const food = items.filter((i) => i.item_type === "Food");
  const drinks = items.filter((i) => i.item_type === "Drink");

  return (
    <main className="shell">
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">C</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{restaurant?.name}</div>
            <div className="muted" style={{ fontSize: 12 }}>{step === "menu" ? "Today's menu" : "Your details"}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {lastOrderId && (
            <Link href={`/order/${lastOrderId}`} className="muted" style={{ fontSize: 13, fontWeight: 600 }}>
              Your last order →
            </Link>
          )}
          <Link href="/" className="muted" style={{ fontSize: 13, fontWeight: 600 }}>
            Home
          </Link>
        </div>
      </div>

      {error && <p style={{ color: "var(--accent)", marginBottom: 14, fontSize: 14 }}>{error}</p>}

      {step === "menu" && (
        <>
          <MenuSection title="Food" items={food} cart={cart} onChange={updateQty} />
          <MenuSection title="Drinks" items={drinks} cart={cart} onChange={updateQty} />

          <div style={{ position: "sticky", bottom: 16, marginTop: 28 }}>
            <button
              className="btn btn-primary"
              style={{ width: "100%", padding: "16px 20px", fontSize: 16 }}
              disabled={cartCount === 0}
              onClick={() => setStep("details")}
            >
              {cartCount === 0
                ? "Select items to continue"
                : `Continue · ${cartCount} item${cartCount > 1 ? "s" : ""} · ₦${cartTotal.toLocaleString()}`}
            </button>
          </div>
        </>
      )}

      {step === "details" && (
        <form onSubmit={placeOrder} className="card">
          <h2 className="display" style={{ fontSize: 19, marginBottom: 4 }}>Your details</h2>
          <p className="muted" style={{ marginBottom: 16 }}>So the waiter knows who the order belongs to.</p>

          <div style={{ display: "grid", gap: 12, marginBottom: 18 }}>
            <div>
              <label className="muted" style={{ fontSize: 13, display: "block", marginBottom: 4 }}>Full name</label>
              <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ada Eze" required />
            </div>
            <div>
              <label className="muted" style={{ fontSize: 13, display: "block", marginBottom: 4 }}>Phone number</label>
              <input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 08031112222" required />
            </div>
            <div>
              <label className="muted" style={{ fontSize: 13, display: "block", marginBottom: 4 }}>Email (optional)</label>
              <input className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. ada.eze@gmail.com" />
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginBottom: 16 }}>
            {Object.entries(cart).map(([id, qty]) => {
              const item = items.find((i) => i.id === id);
              if (!item) return null;
              return (
                <div key={id} className="row">
                  <span>{qty} × {item.item_name}</span>
                  <span className="price">₦{(qty * Number(item.price)).toLocaleString()}</span>
                </div>
              );
            })}
            <div className="row" style={{ borderBottom: "none", fontWeight: 700 }}>
              <span>Total</span>
              <span className="price">₦{cartTotal.toLocaleString()}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn btn-outline" onClick={() => setStep("menu")}>Back</button>
            <button className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
              {submitting ? "Placing order…" : "Place order"}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}

function MenuSection({ title, items, cart, onChange }) {
  if (!items.length) return null;
  const kind = title === "Food" ? "food" : "drink";
  return (
    <div className="section-gap">
      <h2 className="display" style={{ fontSize: 16, marginBottom: 10 }}>{title}</h2>
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((item) => {
          const qty = cart[item.id] || 0;
          return (
            <div key={item.id} className="card" style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <span className={`category-pill ${kind}`}>{item.item_type}</span>
                  <div style={{ fontWeight: 700, marginTop: 8 }}>{item.item_name}</div>
                  <div className="muted" style={{ marginTop: 2 }}>
                    ₦{Number(item.price).toLocaleString()} · ~{item.avg_waiting_time} min
                  </div>
                </div>
                <div className="qty-control">
                  {qty > 0 && (
                    <>
                      <button type="button" className="qty-btn" onClick={() => onChange(item.id, -1)}>−</button>
                      <span style={{ minWidth: 16, textAlign: "center" }}>{qty}</span>
                    </>
                  )}
                  <button type="button" className="qty-btn" onClick={() => onChange(item.id, 1)}>+</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
