import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PdfPagesClient from '@/components/PdfPagesClient';

export const metadata = {
  title: 'PDF 🔢 페이지 번호 추가 (PDF Page Numbers) | myPDF (mypdf.co.kr)',
  description: '서버 업로드 없이 100% 브라우저 내부에서 안전하고 빠르게 PDF 문서 각 페이지에 원하시는 형태(1/5, Page 1 of 5 등)로 페이지 번호를 자동으로 추가하세요.',
};

export default function PdfPagesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)]">
      <Navbar />
      <main className="flex-1 pt-[80px]">
        <PdfPagesClient />
      </main>
      <Footer />
    </div>
  );
}
