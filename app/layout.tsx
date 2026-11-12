import type { Metadata } from "next";
import { Geist } from "next/font/google";
import ThemeInitializer from "@/components/theme-initializer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ScholarAI — Make your next move possible",
  description:
    "Discover scholarships, understand your eligibility, and keep every opportunity on track with ScholarAI.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} antialiased`}
    >
      <body>
        <ThemeInitializer />
        {children}
      </body>
    </html>
  );
}
