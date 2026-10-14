import type { Metadata, Viewport } from "next";
import { DeferredAnalytics } from "@/components/DeferredAnalytics";
import { APP_NAME, THEME_COLOR } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Community Groups management and reporting",
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        {children}
        <DeferredAnalytics />
      </body>
    </html>
  );
}
