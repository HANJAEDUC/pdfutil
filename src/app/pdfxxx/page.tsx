import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DemoToolClient from '@/components/DemoToolClient';

export const metadata = { title: 'pdfxxx | myPDF', description: 'PDF 페이지 분할 기능입니다.' };
export default function PdfXxxPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)]">
      <Navbar />
      <main className="flex-1 pt-[80px]">
        <DemoToolClient title="pdfxxx (페이지 분할)" icon="✂️" category="PDF 편집 & 정리" description="하나의 PDF 문서를 여러 개로 분할합니다." />
      </main>
      <Footer />
    </div>
  );
}
