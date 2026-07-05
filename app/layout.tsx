import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Honio ⁃ The road to better hiring",
  description: "Independent candidate reviews that stay private until every interviewer has submitted.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        style={{ margin: 0, padding: 0, background: "#1A0E07" }}
        className="min-h-full"
        suppressHydrationWarning={true}
      >
        {children}
        <Script
        src="https://cdn.lordicon.com/lordicon.js"
        strategy="afterInteractive"
        />
      </body>
    </html>
  );
}