"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function StaffOrderDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [bartenders, setBartenders] = useState([]);
  const [waiterId, setWaiterId] = useState("");
  const [assignments, setAssignments] = useState({}); // { order_item_id: staffId }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data: o } = await supabase.from("orders").select("*, customers(name, phone_number)").eq("id", id).single();
    if (!o) {
      setLoading(false);
      return;
    }
    setOrder(o);
    setWaiterId(o.waiter_id || "");

    const { data: oi } = await supabase.from("order_items").select("*, menu_items(*)").eq("order_id", id);
    setItems(oi || []);
    const initial = {};
    (oi || []).forEach((row) => {
      initial[row.id] = row.chef_id || row.bartender_id || "";
    });
    setAssignments(initial);

    const [{ data: w }, { data: c }, { data: b }] = await Promise.all([
      supabase.from("waiters").select("*").eq("restaurant_id", o.restaurant_id),
      supabase.from("chefs").select("*").eq("restaurant_id", o.restaurant_id),
      supabase.from("bartenders").select("*").eq("restaurant_id", o.restaurant_id),
    ]);
    setWaiters(w || []);
    setChefs(c || []);
    setBartenders(b || []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveAssignments() {
    setSaving(true);
    await supabase.from("orders").update({ waiter_id: waiterId || null }).eq("id", id);

    for (const row of items) {
      const isFood = row.menu_items?.item_type === "Food";
      const chosen = assignments[row.id] || null;
      await supabase
        .from("order_items")
        .update({
          chef_id: isFood ? chosen : null,
          bartender_id: !isFood ? chosen : null,
        })
        .eq("id", row.id);
    }
    setSaving(false);
    load();
  }

  async function markCompleted() {
    setSaving(true);
    await supabase.from("orders").update({ order_status: "Completed" }).eq("id", id);
    setSaving(false);
    router.push("/staff");
  }

  if (loading) {
    return (
      <main className="shell">
        <p className="muted">Loading order…</p>
      </main>
    );
  }
  if (!order) {
    return (
      <main className="shell">
        <p className="muted">Order not found.</p>
      </main>
    );
  }

  const total = items.reduce((s, i) => s + i.quantity * Number(i.menu_items?.price || 0), 0);
  const pillClass = order.order_status === "Completed" ? "pill-done" : order.order_status === "Delayed" ? "pill-delayed" : "pill-progress";

  return (
    <main className="shell">
      <div className="topbar">
        <Link href="/staff" className="muted" style={{ fontSize: 13, fontWeight: 600 }}>← All orders</Link>
        <Link href={`/order/${id}`} className="muted" style={{ fontSize: 13, fontWeight: 600 }}>View as customer →</Link>
      </div>

      <h1 className="display" style={{ fontSize: 22, margin: "8px 0 16px" }}>
        {order.customers?.name || "Guest"}'s order
      </h1>

      <div className="card">
        {items.map((i) => {
          const isFood = i.menu_items?.item_type === "Food";
          const options = isFood ? chefs : bartenders;
          return (
            <div key={i.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <div className="row" style={{ borderBottom: "none", padding: "0 0 8px" }}>
                <span>
                  <span className={`category-pill ${isFood ? "food" : "drink"}`}>{i.menu_items?.item_type}</span>
                  <span style={{ marginLeft: 8 }}>{i.quantity} × {i.menu_items?.item_name}</span>
                </span>
                <span className="price">₦{(i.quantity * Number(i.menu_items?.price || 0)).toLocaleString()}</span>
              </div>
              <select
                className="field"
                value={assignments[i.id] || ""}
                onChange={(e) => setAssignments((prev) => ({ ...prev, [i.id]: e.target.value }))}
              >
                <option value="">{isFood ? "Select chef" : "Select bartender"}</option>
                {options.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          );
        })}
        <div className="row" style={{ borderBottom: "none", fontWeight: 700, paddingTop: 12 }}>
          <span>Total</span>
          <span className="price">₦{total.toLocaleString()}</span>
        </div>
      </div>

      <div className="section-gap card">
        <h2 className="display" style={{ fontSize: 16, marginBottom: 10 }}>Waiter</h2>
        <select className="field" value={waiterId} onChange={(e) => setWaiterId(e.target.value)} style={{ marginBottom: 14 }}>
          <option value="">Select waiter</option>
          {waiters.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        <button className="btn btn-primary" style={{ width: "100%" }} onClick={saveAssignments} disabled={saving}>
          {saving ? "Saving…" : "Save assignments"}
        </button>
      </div>

      <div className="section-gap" style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span className={`pill ${pillClass}`}>{order.order_status}</span>
        {order.order_status !== "Completed" && (
          <button className="btn btn-accent" style={{ flex: 1 }} onClick={markCompleted} disabled={saving}>
            Mark as Completed
          </button>
        )}
      </div>
    </main>
  );
}
