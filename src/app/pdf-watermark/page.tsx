import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PdfWatermarkClient from '@/components/PdfWatermarkClient';

export const metadata = {
  title: 'PDF 💧 PDF (PDF 워터마크 추가) | myPDF (mypdf.co.kr)',
  description: '서버 업로드 없이 100% 브라우저 내부에서 안전하고 빠르게 PDF 문서에 워터마크 텍스트를 자유롭게 삽입합니다.',
};

export default function PdfWatermarkPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)]">
      <Navbar />
      <main className="flex-1 pt-[80px]">
        <PdfWatermarkClient />
      </main>
      <Footer />
    </div>
  );
}
