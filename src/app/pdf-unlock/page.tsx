import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PdfUnlockClient from '@/components/PdfUnlockClient';

export const metadata = {
  title: 'PDF 🔓 PDF (PDF 암호 해제) | myPDF (mypdf.co.kr)',
  description: '서버 업로드 없이 100% 브라우저 내부에서 안전하고 빠르게 알고 있는 PDF 문서의 암호를 완전 해제하여 저장합니다.',
};

export default function PdfUnlockPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)]">
      <Navbar />
      <main className="flex-1 pt-[80px]">
        <PdfUnlockClient />
      </main>
      <Footer />
    </div>
  );
}
