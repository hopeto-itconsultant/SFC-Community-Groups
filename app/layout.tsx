import type { Metadata, Viewport } from "next";
import { DeferredAnalytics } from "@/components/DeferredAnalytics";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";
import { APP_NAME, PWA_NAME, THEME_COLOR } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: PWA_NAME,
  title: APP_NAME,
  description: "Community Groups management and reporting",
  appleWebApp: {
    capable: true,
    title: PWA_NAME,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/brand/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: THEME_COLOR,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        {children}
        <RegisterServiceWorker />
        <DeferredAnalytics />
      </body>
    </html>
  );
}
