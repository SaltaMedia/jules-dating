import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "../components/ui/toast";
import LayoutWrapper from "../components/LayoutWrapper";

export const metadata: Metadata = {
  title: "Jules",
  description: "Get honest feedback on your photos, fits, and texts, so you're worth swiping right on.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </ToastProvider>
      </body>
    </html>
  );
}