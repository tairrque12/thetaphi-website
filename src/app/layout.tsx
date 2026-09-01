import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Theta Phi Chapter",
  description:
    "The official digital home of the Theta Phi Chapter of Kappa Alpha Psi Fraternity, Inc.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
