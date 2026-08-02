import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DemoToolClient from '@/components/DemoToolClient';

export const metadata = { title: 'pdfxxx | myPDF (mypdf.co.kr)', description: 'PDF 페이지 분할' };
export default function PdfXxxPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)]">
      <Navbar />
      <main className="flex-1 pt-[80px]">
        <DemoToolClient toolKey="pdfxxx" defaultTitle="pdfxxx (페이지 분할)" defaultCategory="PDF 편집 & 정리" defaultDescription="하나의 PDF 문서를 여러 개로 분할합니다." />
      </main>
      <Footer />
    </div>
  );
}
