import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PdfPasswdClient from '@/components/PdfPasswdClient';

export const metadata = {
  title: 'PDF 🔑 암호 설정 | mypdf (mypdf.co.kr)',
  description: '서버 업로드 없이 PDF 파일에 비밀번호(암호)를 설정하여 무단 열람을 방지하고 안전하게 보호합니다.',
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
