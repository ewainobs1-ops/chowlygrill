"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function StaffOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, customers(name), order_items(quantity, menu_items(item_name, price))")
      .order("order_datetime", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const visible = orders.filter((o) => (filter === "open" ? o.order_status !== "Completed" : true));

  return (
    <main className="shell">
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">C</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Staff</div>
            <div className="muted" style={{ fontSize: 12 }}>The Grill House</div>
          </div>
        </div>
        <Link href="/" className="muted" style={{ fontSize: 13, fontWeight: 600 }}>Home</Link>
      </div>

      <p className="muted" style={{ marginBottom: 16 }}>Assign a chef or bartender to each item, then mark the order Completed.</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <button
          className="btn"
          style={{ padding: "8px 14px", fontSize: 13, background: filter === "open" ? "var(--primary)" : "transparent", color: filter === "open" ? "white" : "var(--ink)", border: "1.5px solid var(--border)" }}
          onClick={() => setFilter("open")}
        >
          Open
        </button>
        <button
          className="btn"
          style={{ padding: "8px 14px", fontSize: 13, background: filter === "all" ? "var(--primary)" : "transparent", color: filter === "all" ? "white" : "var(--ink)", border: "1.5px solid var(--border)" }}
          onClick={() => setFilter("all")}
        >
          All
        </button>
      </div>

      {loading ? (
        <p className="muted">Loading orders…</p>
      ) : visible.length === 0 ? (
        <p className="muted">No {filter === "open" ? "open" : ""} orders right now.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {visible.map((o) => {
            const total = (o.order_items || []).reduce((s, i) => s + i.quantity * Number(i.menu_items?.price || 0), 0);
            const pillClass = o.order_status === "Completed" ? "pill-done" : o.order_status === "Delayed" ? "pill-delayed" : "pill-progress";
            return (
              <Link key={o.id} href={`/staff/${o.id}`} className="card" style={{ textDecoration: "none", display: "block" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{o.customers?.name || "Guest"}</div>
                    <div className="muted" style={{ marginTop: 2 }}>{(o.order_items || []).length} item(s) · ₦{total.toLocaleString()}</div>
                    <div className="muted" style={{ marginTop: 2, fontSize: 12 }}>{new Date(o.order_datetime).toLocaleTimeString()}</div>
                  </div>
                  <span className={`pill ${pillClass}`}>{o.order_status}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
