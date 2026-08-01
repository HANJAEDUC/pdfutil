import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PdfPasswdClient from '@/components/PdfPasswdClient';

export const metadata = {
  title: 'PDF 🔑 PDF | PDF Util',
  description: '서버 업로드 없이 100% 브라우저 내부에서 안전하고 빠르게 PDF 파일에 암호(비밀번호)를 설정하여 암호화합니다.',
};

export default function PdfPasswdPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)]">
      <Navbar />

      <main className="flex-1 pt-[80px]">
        <PdfPasswdClient />
      </main>

      <Footer />
    </div>
  );
}
