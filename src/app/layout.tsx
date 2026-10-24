import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cricket Fantasy | Draft. Compete. Repeat.",
  description: "A free, private-league, season-long fantasy cricket concept. MLC first, more tournaments later.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
