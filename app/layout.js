import "./globals.css";
export const metadata = { title: "Chowly — The Grill House", description: "Order, track, and pay." };
export default function RootLayout({ children }) {
  return (<html lang="en"><body>{children}</body></html>);
}
