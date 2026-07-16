import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import StoreProvider from "@/components/StoreProvider";
import { Toaster } from "sonner";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RuralPay Admin",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased font-sans`}
    >
            <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Script
          async
          src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <StoreProvider>{children}</StoreProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
