import DialogAccessibility from "@/components/DialogAccessibility";
import { isolatedTest } from "@/lib/test-environment";
import type { Metadata } from "next";
import "./globals.css";
import "./customer.css";
import "./customer-simple.css";
import "./onboarding-polish.css";
export const metadata: Metadata = {
  title: "SHAZ — 100 DAY TRANSFORMATION",
  description:
    "Din træning. Din madplan. Dine næste 100 dage. Træning, cardio og måltider tilpasset dine valg. 399 kr. én gang.",
  icons: { icon: "/favicon.svg" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da">
      <body>
        {isolatedTest() && (
          <div className="test-environment-banner">
            SHAZ TEST · Fiktive data · Ingen betalinger
          </div>
        )}
        {children}
        <DialogAccessibility />
      </body>
    </html>
  );
}
