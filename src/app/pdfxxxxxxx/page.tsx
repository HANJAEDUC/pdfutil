import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DemoToolClient from '@/components/DemoToolClient';

export const metadata = { title: 'pdfxxxxxxx | myPDF (mypdf.co.kr)', description: 'PDF 워터마크 추가' };
export default function PdfXxxxxxxPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)]">
      <Navbar />
      <main className="flex-1 pt-[80px]">
        <DemoToolClient toolKey="pdfxxxxxxx" defaultTitle="pdfxxxxxxx (워터마크 추가)" defaultCategory="보안 & 유틸리티" defaultDescription="PDF 문서 배경에 워터마크 텍스트를 삽입합니다." />
      </main>
      <Footer />
    </div>
  );
}
