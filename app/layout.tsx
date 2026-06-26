import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Probely ⁃ The road to better hiring",
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
      >
        {children}
      </body>
    </html>
  );
}