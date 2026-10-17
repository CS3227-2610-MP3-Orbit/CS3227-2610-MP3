import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Consultation Booking",
  description: "Book consultations with lecturers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
