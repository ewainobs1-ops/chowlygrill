"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function OrderTrackPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [waiter, setWaiter] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showComplaint, setShowComplaint] = useState(false);
  const [rating, setRating] = useState(3);
  const [description, setDescription] = useState("");
  const [complaintSent, setComplaintSent] = useState(false);
  const [payment, setPayment] = useState(null);
  const [method, setMethod] = useState("Card");
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    const { data: o } = await supabase.from("orders").select("*").eq("id", id).single();
    if (!o) {
      setLoading(false);
      return;
    }
    setOrder(o);

    const { data: items } = await supabase
      .from("order_items")
      .select("*, menu_items(*), chefs(name), bartenders(name)")
      .eq("order_id", id);
    setOrderItems(items || []);

    if (o.waiter_id) {
      const { data: w } = await supabase.from("waiters").select("*").eq("id", o.waiter_id).maybeSingle();
      setWaiter(w || null);
    }

    const { data: pay } = await supabase.from("payments").select("*").eq("order_id", id).maybeSingle();
    setPayment(pay || null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [load]);

  async function submitComplaint(e) {
    e.preventDefault();
    await supabase.from("complaints").insert({
      order_id: id,
      customer_id: order.customer_id,
      rating: Number(rating),
      complaint_description: description.trim() || null,
    });
    if (order.order_status !== "Completed") {
      await supabase.from("orders").update({ order_status: "Delayed" }).eq("id", id);
    }
    setComplaintSent(true);
    setShowComplaint(false);
    load();
  }

  async function submitPayment() {
    setPaying(true);
    const total = orderItems.reduce((sum, i) => sum + i.quantity * Number(i.menu_items?.price || 0), 0);
    const { data: pay, error } = await supabase
      .from("payments")
      .insert({ order_id: id, amount: total, payment_method: method, is_pretend: true })
      .select()
      .single();
    if (!error) setPayment(pay);
    setPaying(false);
  }

  if (loading) {
    return (
      <main className="shell">
        <p className="muted">Loading your order…</p>
      </main>
    );
  }
  if (!order) {
    return (
      <main className="shell">
        <p className="muted">We couldn't find that order.</p>
      </main>
    );
  }

  const total = orderItems.reduce((sum, i) => sum + i.quantity * Number(i.menu_items?.price || 0), 0);
  const waitMinutes = orderItems.length
    ? Math.max(...orderItems.map((i) => i.waiting_time || i.menu_items?.avg_waiting_time || 0))
    : null;

  const pillClass =
    order.order_status === "Completed" ? "pill-done" : order.order_status === "Delayed" ? "pill-delayed" : "pill-progress";

  return (
    <main className="shell">
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">C</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Order #{order.id.slice(0, 8).toUpperCase()}</div>
            <div className="muted" style={{ fontSize: 12 }}>{new Date(order.order_datetime).toLocaleString()}</div>
          </div>
        </div>
        <Link href="/order" className="muted" style={{ fontSize: 13, fontWeight: 600 }}>← Menu</Link>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span className={`pill ${pillClass}`}>{order.order_status}</span>
          <Link href={`/staff/${id}`} className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>
            Staff view (testing) →
          </Link>
        </div>

        <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          {orderItems.map((i) => (
            <div key={i.id} className="row">
              <span>
                {i.quantity} × {i.menu_items?.item_name}
                {(i.chefs?.name || i.bartenders?.name) && (
                  <span className="muted" style={{ marginLeft: 6 }}>
                    ({i.chefs?.name || i.bartenders?.name})
                  </span>
                )}
              </span>
              <span className="price">₦{(i.quantity * Number(i.menu_items?.price || 0)).toLocaleString()}</span>
            </div>
          ))}
          <div className="row" style={{ borderBottom: "none", fontWeight: 700 }}>
            <span>Total</span>
            <span className="price">₦{total.toLocaleString()}</span>
          </div>
        </div>

        {waitMinutes !== null && order.order_status === "In Progress" && (
          <p className="muted" style={{ marginTop: 12 }}>
            Estimated waiting time: <strong style={{ color: "var(--ink)" }}>{waitMinutes} minutes</strong>
          </p>
        )}
        {waiter && (
          <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>Waiter: {waiter.name}</p>
        )}
      </div>

      <div className="section-gap">
        {complaintSent ? (
          <p className="muted">Thanks — your complaint and rating were recorded.</p>
        ) : showComplaint ? (
          <form onSubmit={submitComplaint} className="card">
            <h2 className="display" style={{ fontSize: 17, marginBottom: 12 }}>Report a delay</h2>
            <label className="muted" style={{ fontSize: 13, display: "block", marginBottom: 4 }}>Rating (1 = poor, 5 = excellent)</label>
            <input type="number" min="1" max="5" className="field" value={rating} onChange={(e) => setRating(e.target.value)} style={{ marginBottom: 12 }} />
            <label className="muted" style={{ fontSize: 13, display: "block", marginBottom: 4 }}>What happened?</label>
            <textarea className="field" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Drink took over 20 minutes longer than stated" style={{ marginBottom: 16 }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowComplaint(false)}>Cancel</button>
              <button className="btn btn-accent" style={{ flex: 1 }}>Submit complaint</button>
            </div>
          </form>
        ) : (
          <button className="btn btn-outline" onClick={() => setShowComplaint(true)}>Order taking too long? Report a delay</button>
        )}
      </div>

      <div className="section-gap card">
        <h2 className="display" style={{ fontSize: 17, marginBottom: 4 }}>Payment</h2>
        <p className="muted" style={{ marginBottom: 16 }}>This is a pretend payment for the assignment — no real money moves.</p>

        {payment ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="pill pill-paid">PAID</span>
            <span className="muted">₦{Number(payment.amount).toLocaleString()} via {payment.payment_method}</span>
          </div>
        ) : order.order_status !== "Completed" ? (
          <p className="muted">Payment unlocks once your order is marked Completed.</p>
        ) : (
          <>
            <label className="muted" style={{ fontSize: 13, display: "block", marginBottom: 6 }}>Payment method</label>
            <select className="field" value={method} onChange={(e) => setMethod(e.target.value)} style={{ marginBottom: 14 }}>
              <option value="Card">Card</option>
              <option value="Transfer">Transfer</option>
              <option value="Cash">Cash</option>
            </select>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={submitPayment} disabled={paying}>
              {paying ? "Processing…" : `Pay ₦${total.toLocaleString()} (pretend)`}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
