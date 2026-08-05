import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PdfAddPngClient from '@/components/PdfAddPngClient';

export const metadata = {
  title: 'PDF 🏷️ LOGO | myPDF (mypdf.co.kr)',
  description: '서버 업로드 없이 100% 브라우저 내부에서 안전하게 PDF 문서 원하는 위치에 대표로고, PNG 및 JPG 이미지를 추가합니다.',
};

export default function PdfXxxPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)]">
      <Navbar />
      <main className="flex-1 pt-[80px]">
        <PdfAddPngClient />
      </main>
      <Footer />
    </div>
  );
}
