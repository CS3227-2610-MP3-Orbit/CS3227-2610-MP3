import type { Metadata } from "next";

import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
// SH-07-R11: Geist Mono, loaded the same way as Geist sans -- next/font/google, no runtime
// CDN request (SH-07-R7) -- for eyebrow/numeric styling via the shared `font-mono` utility.
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  // SH-07-R9: the product is presented as "Orbit".
  title: "Orbit",
  description: "Book consultations with lecturers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased", "font-sans", geist.variable, geistMono.variable)}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
