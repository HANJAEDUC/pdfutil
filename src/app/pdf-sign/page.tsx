import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PdfSignClient from '@/components/PdfSignClient';

export const metadata = {
  title: 'PDF ✍️ 서명 추가 (PDF Sign) | myPDF (mypdf.co.kr)',
  description: '서버 업로드 없이 브라우저 내에서 직접 마우스로 그리거나 텍스트를 입력하여 나만의 전자서명을 PDF에 쉽고 안전하게 합성하세요.',
};

export default function PdfSignPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)]">
      <Navbar />
      <main className="flex-1 pt-[80px]">
        <PdfSignClient />
      </main>
      <Footer />
    </div>
  );
}
