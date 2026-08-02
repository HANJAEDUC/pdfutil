import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DemoToolClient from '@/components/DemoToolClient';

export const metadata = { title: 'pdfxxxxx | myPDF (mypdf.co.kr)', description: 'PDF 페이지 회전' };
export default function PdfXxxxxPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)]">
      <Navbar />
      <main className="flex-1 pt-[80px]">
        <DemoToolClient toolKey="pdfxxxxx" defaultTitle="pdfxxxxx (페이지 회전)" defaultCategory="PDF 편집 & 정리" defaultDescription="PDF 각 페이지 방향을 90도 회전시킵니다." />
      </main>
      <Footer />
    </div>
  );
}
