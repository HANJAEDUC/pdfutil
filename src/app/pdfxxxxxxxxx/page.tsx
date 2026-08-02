import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DemoToolClient from '@/components/DemoToolClient';

export const metadata = { title: 'pdfxxxxxxxxx | myPDF', description: 'PDF OCR 글자 인식 기능입니다.' };
export default function PdfXxxxxxxxxPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)]">
      <Navbar />
      <main className="flex-1 pt-[80px]">
        <DemoToolClient title="pdfxxxxxxxxx (OCR 글자 인식)" icon="🔍" category="보안 & 최적화" description="스캔 이미지 PDF를 글자 인식(OCR)합니다." />
      </main>
      <Footer />
    </div>
  );
}
