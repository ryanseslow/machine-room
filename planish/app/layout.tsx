import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Planish",
  description: "Turn rough interior photos into professional website-ready images.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-full bg-gradient-to-b from-slate-50 to-slate-100 text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
