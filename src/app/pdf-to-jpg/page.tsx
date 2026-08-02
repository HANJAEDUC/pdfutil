import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PdfConverterClient from '@/components/PdfConverterClient';

export const metadata = {
  title: 'PDF ➡️ JPG | mypdf (mypdf.co.kr)',
  description: '서버 업로드 없이 100% 브라우저 내부에서 안전하고 빠르게 PDF를 JPG 이미지로 변환합니다.',
};

export default function PdfToJpgPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)]">
      <Navbar />

      <main className="flex-1 pt-[80px]">
        <PdfConverterClient />
      </main>

      <Footer />
    </div>
  );
}
