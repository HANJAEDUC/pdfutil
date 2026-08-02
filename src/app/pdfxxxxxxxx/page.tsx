import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DemoToolClient from '@/components/DemoToolClient';

export const metadata = { title: 'pdfxxxxxxxx | myPDF (mypdf.co.kr)', description: 'PDF 텍스트 추출' };
export default function PdfXxxxxxxxPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)]">
      <Navbar />
      <main className="flex-1 pt-[80px]">
        <DemoToolClient toolKey="pdfxxxxxxxx" defaultTitle="pdfxxxxxxxx (텍스트 추출)" defaultCategory="보안 & 유틸리티" defaultDescription="PDF 문서에서 본문 텍스트를 추출합니다." />
      </main>
      <Footer />
    </div>
  );
}
