import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Travel Agent — Asystent Podróży",
  description: "AI asystent do planowania podróży: loty, hotele, pełne plany.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
