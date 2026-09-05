import Link from "next/link";

export default function Home() {
  return (
    <main className="shell">
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">C</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Chowly</div>
            <div className="muted" style={{ fontSize: 12 }}>The Grill House</div>
          </div>
        </div>
      </div>

      <div className="hero-band">
        <div className="eyebrow" style={{ color: "#bfe8de" }}>Lekki, Lagos</div>
        <h1 className="display" style={{ fontSize: 34, color: "white", marginBottom: 8 }}>
          Good food,<br />zero wait guessing.
        </h1>
        <p style={{ color: "#d7ece7", fontSize: 15, maxWidth: 42 + "ch" }}>
          Order from your table, watch it move through the kitchen, and pay before you leave.
        </p>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <Link href="/order" className="card" style={{ textDecoration: "none", display: "block" }}>
          <div className="eyebrow">I'm at a table</div>
          <h2 className="display" style={{ fontSize: 20, color: "var(--ink)" }}>Browse menu &amp; order</h2>
          <p className="muted" style={{ marginTop: 6 }}>
            Pick your food and drinks, place your order, pay when you're done.
          </p>
        </Link>

        <Link
          href="/staff"
          className="btn btn-outline"
          style={{ textDecoration: "none", padding: "16px 20px", justifyContent: "space-between" }}
        >
          <span>Staff — manage orders</span>
          <span aria-hidden>→</span>
        </Link>
      </div>

      <p className="muted" style={{ marginTop: 32, fontSize: 12.5 }}>
        No login needed — this switch stands in for separate customer and staff apps.
      </p>
    </main>
  );
}
