import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DataPilot — Enterprise AI Data Analyst",
  description: "Ask business questions and get governed answers from your PostgreSQL data."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
