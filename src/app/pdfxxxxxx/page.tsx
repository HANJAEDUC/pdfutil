import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DemoToolClient from '@/components/DemoToolClient';

export const metadata = { title: 'pdfxxxxxx | myPDF (mypdf.co.kr)', description: 'PDF 용량 압축' };
export default function PdfXxxxxxPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)]">
      <Navbar />
      <main className="flex-1 pt-[80px]">
        <DemoToolClient toolKey="pdfxxxxxx" defaultTitle="pdfxxxxxx (용량 압축)" defaultCategory="보안 & 유틸리티" defaultDescription="PDF 문서 용량을 경량화하여 압축합니다." />
      </main>
      <Footer />
    </div>
  );
}
