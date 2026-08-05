import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.mypdf.co.kr"),
  alternates: {
    canonical: "/",
  },
  title: "myPDF — 무료 PDF 변환, 병합, 추출, 암호화 유틸리티 (mypdf.co.kr)",
  description: "서버 업로드 없이 100% 브라우저 내부에서 안전하고 빠르게 PDF를 JPG/Word 변환, 병합, 페이지 추출 및 암호화 설정하는 무제한 무료 PDF 플랫폼",
  keywords: [
    "PDF 변환",
    "PDF JPG 변환",
    "PDF Word 변환",
    "PDF 병합",
    "PDF 합치기",
    "PDF 추출",
    "PDF 암호 설정",
    "무료 PDF 도구",
    "myPDF",
    "mypdf.co.kr",
  ],
  authors: [{ name: "myPDF Team", url: "https://www.mypdf.co.kr" }],
  openGraph: {
    title: "myPDF — Free for Everyone",
    description: "서버 업로드 없이 100% 내 브라우저에서 안전하고 빠르게 처리하는 무료 PDF 유틸리티 플랫폼",
    url: "https://www.mypdf.co.kr",
    siteName: "myPDF",
    locale: "ko_KR",
    type: "website",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  verification: {
    google: "aoe28D7KC8nYb_XuVXi0_TaqXKY0jXzVS43jJGi-er4",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
