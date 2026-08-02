import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DemoToolClient from '@/components/DemoToolClient';

export const metadata = { title: 'pdfxxxxxxxxx | myPDF (mypdf.co.kr)', description: 'PDF OCR 글자 인식' };
export default function PdfXxxxxxxxxPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)]">
      <Navbar />
      <main className="flex-1 pt-[80px]">
        <DemoToolClient toolKey="pdfxxxxxxxxx" defaultTitle="pdfxxxxxxxxx (OCR 글자 인식)" defaultCategory="보안 & 유틸리티" defaultDescription="스캔 이미지 PDF를 글자 인식(OCR)합니다." />
      </main>
      <Footer />
    </div>
  );
}
