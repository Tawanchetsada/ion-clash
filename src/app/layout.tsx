import type { Metadata } from "next";
import { Google_Sans } from "next/font/google";
import "./globals.css";

const googleSans = Google_Sans({
  variable: "--font-google-sans",
  subsets: ["thai", "latin"],
  axes: ["opsz"],
  weight: "variable",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ion Clash",
  description: "เกมเรียนรู้เคมีไอออนสำหรับนักเรียนชั้นมัธยมศึกษาปีที่ 4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${googleSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
