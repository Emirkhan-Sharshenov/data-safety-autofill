import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Consent",
  description: "Fill Google Play's Data Safety form from your Android code",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
