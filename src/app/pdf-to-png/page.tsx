import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PdfPngClient from '@/components/PdfPngClient';

export const metadata = {
  title: 'PDF ➡️ PNG | mypdf (mypdf.co.kr)',
  description: '서버 업로드 없이 100% 브라우저 내부에서 안전하고 빠르게 PDF를 고화질 PNG 이미지로 변환합니다.',
};

export default function PdfToPngPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)]">
      <Navbar />

      <main className="flex-1 pt-[80px]">
        <PdfPngClient />
      </main>

      <Footer />
    </div>
  );
}
