import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { NavigationProgress } from "@/components/providers/NavigationProgress";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "NYXUS — Web3 Partnership Intelligence",
  description: "Find the right Web3 partners, at the right time. AI-powered partnership discovery for crypto founders and BDMs.",
  keywords: ["web3", "partnerships", "crypto", "DeFi", "partnership intelligence"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {/* NavigationProgress needs useSearchParams so wrap in Suspense */}
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
