import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DemoToolClient from '@/components/DemoToolClient';

export const metadata = { title: 'pdfxxxxx | myPDF', description: 'PDF 페이지 회전 기능입니다.' };
export default function PdfXxxxxPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)]">
      <Navbar />
      <main className="flex-1 pt-[80px]">
        <DemoToolClient title="pdfxxxxx (페이지 회전)" icon="🔄" category="PDF 편집 & 정리" description="PDF 문서의 페이지 방향을 90도 회전시킵니다." />
      </main>
      <Footer />
    </div>
  );
}
