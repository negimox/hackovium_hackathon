import React from "react";
import { Google_Sans_Flex, Merriweather, Fira_Code } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { UserProvider } from "@/lib/contexts/user-context";
import "./globals.css";
import { Metadata } from "next";

const fontSans = Google_Sans_Flex({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Merriweather({
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontMono = Fira_Code({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: {
    template: "Everything Money",
    default: "Everything Money - Indian Stock Market Analysis",
  },
  description:
    "Investment analysis platform for Indian stocks, mutual funds, and ETFs. Research, analyze portfolios, and track market sentiment in real-time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} antialiased`}
      >
        <ClerkProvider afterSignOutUrl="/" appearance={{ theme: shadcn }}>
          <UserProvider>{children}</UserProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
