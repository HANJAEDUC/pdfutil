import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DemoToolClient from '@/components/DemoToolClient';

export const metadata = { title: 'pdfxxxxxxx | myPDF', description: 'PDF 워터마크 추가 기능입니다.' };
export default function PdfXxxxxxxPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)]">
      <Navbar />
      <main className="flex-1 pt-[80px]">
        <DemoToolClient title="pdfxxxxxxx (워터마크 추가)" icon="💧" category="보안 & 최적화" description="PDF 문서에 워터마크 텍스트를 삽입합니다." />
      </main>
      <Footer />
    </div>
  );
}
