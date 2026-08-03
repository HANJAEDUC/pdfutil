import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PdfRotateClient from '@/components/PdfRotateClient';

export const metadata = {
  title: 'PDF 🔄 PDF (PDF 페이지 회전) | myPDF (mypdf.co.kr)',
  description: '서버 업로드 없이 100% 브라우저 내부에서 안전하고 빠르게 PDF 페이지를 90도/180도 회전시킵니다.',
};

export default function PdfRotatePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)]">
      <Navbar />
      <main className="flex-1 pt-[80px]">
        <PdfRotateClient />
      </main>
      <Footer />
    </div>
  );
}
