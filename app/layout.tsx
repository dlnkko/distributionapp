import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "distribute.to — one perfect match",
  description:
    "Type your pain point. We interview you, then match you to one listing. Businesses only pay when the right person clicks through.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col">
        <div className="grain" />
        <SiteHeader />
        <main className="relative z-10 flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
