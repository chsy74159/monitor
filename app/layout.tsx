import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "US Market Sentiment Monitor",
  description: "Hourly news-first sentiment dashboard for US market ETFs and mega-cap stocks."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
