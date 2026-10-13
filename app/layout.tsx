import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { DeferredAnalytics } from "@/components/DeferredAnalytics";
import { bootScript } from "@/lib/boot-script";
import { APP_NAME, THEME_COLOR } from "@/lib/brand";
import { todayISO } from "@/lib/format";
import { getRequestUserId } from "@/lib/request-user";
import { SessionProvider } from "@/lib/session";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Community Groups management and reporting (prototype)",
  icons: {
    icon: [{ url: "/brand/icon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: THEME_COLOR,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const initialUserId = await getRequestUserId();
  const today = todayISO();
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        <Script id="sfc-boot" strategy="beforeInteractive">
          {bootScript(today)}
        </Script>
        <SessionProvider initialUserId={initialUserId} initialToday={today}>
          {children}
        </SessionProvider>
        <DeferredAnalytics />
      </body>
    </html>
  );
}
