import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PdfMergeClient from '@/components/PdfMergeClient';

export const metadata = {
  title: 'PDF 병합기 (PdfMerge) | PDF Util',
  description: '서버 업로드 없이 여러 개의 PDF 파일을 하나로 통합 병합합니다.',
};

export default function PdfMergePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)]">
      <Navbar />

      <main className="flex-1 pt-[80px]">
        <PdfMergeClient />
      </main>

      <Footer />
    </div>
  );
}
