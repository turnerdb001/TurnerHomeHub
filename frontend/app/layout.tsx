import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Turner Home Hub",
  description: "Family command center and AdGuard parental-control dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="scanline">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
