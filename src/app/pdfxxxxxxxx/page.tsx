import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DemoToolClient from '@/components/DemoToolClient';

export const metadata = { title: 'pdfxxxxxxxx | myPDF', description: 'PDF 텍스트 추출 기능입니다.' };
export default function PdfXxxxxxxxPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)]">
      <Navbar />
      <main className="flex-1 pt-[80px]">
        <DemoToolClient title="pdfxxxxxxxx (텍스트 추출)" icon="🔤" category="보안 & 최적화" description="PDF 문서에서 텍스트를 추출합니다." />
      </main>
      <Footer />
    </div>
  );
}
