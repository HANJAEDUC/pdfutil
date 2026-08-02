import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DemoToolClient from '@/components/DemoToolClient';

export const metadata = { title: 'pdfxxxx | myPDF', description: 'PDF 페이지 삭제 기능입니다.' };
export default function PdfXxxxPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)]">
      <Navbar />
      <main className="flex-1 pt-[80px]">
        <DemoToolClient title="pdfxxxx (페이지 삭제)" icon="🗑️" category="PDF 편집 & 정리" description="PDF 문서에서 불필요한 페이지를 삭제합니다." />
      </main>
      <Footer />
    </div>
  );
}
