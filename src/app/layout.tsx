import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cricket Fantasy | Draft. Compete. Repeat.",
  description: "Free, private, season-long fantasy cricket leagues. MLC first, more tournaments later.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
