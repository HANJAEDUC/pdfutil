import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PdfCompressClient from '@/components/PdfCompressClient';

export const metadata = {
  title: 'PDF 🗜️ 용량 압축 | mypdf (mypdf.co.kr)',
  description: '대용량 PDF 문서를 강력/일반/고품질 3단계 옵션으로 빠르게 압축하여 용량을 최대 80% 줄여드립니다. 텍스트 손상 없이 선명하게 최적화하세요.',
};

export default function PdfCompressPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)]">
      <Navbar />

      <main className="flex-1 pt-[80px]">
        <PdfCompressClient />
      </main>

      <Footer />
    </div>
  );
}
