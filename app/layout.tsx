import type { Metadata, Viewport } from "next";
import { APP_NAME, LOGO_SRC, THEME_COLOR } from "@/lib/brand";
import { SessionProvider } from "@/lib/session";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Community Groups management and reporting (prototype)",
  icons: { icon: LOGO_SRC, apple: LOGO_SRC },
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
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
