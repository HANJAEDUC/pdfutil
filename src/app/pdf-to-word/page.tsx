import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PdfToWordClient from '@/components/PdfToWordClient';

export const metadata = {
  title: 'PDF ➡️ Word (DOCX) | myPDF (mypdf.co.kr)',
  description: '서버 업로드 없이 100% 브라우저 내부에서 안전하게 PDF 문서를 편집 가능한 Microsoft Word(.docx)로 변환합니다.',
};

export default function PdfToWordPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)]">
      <Navbar />

      <main className="flex-1 pt-[80px]">
        <PdfToWordClient />
      </main>

      <Footer />
    </div>
  );
}
