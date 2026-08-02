import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HomePortalClient from '@/components/HomePortalClient';

export const metadata = {
  title: 'myPDF — 100% Free for Everyone (mypdf.co.kr)',
  description: '서버 업로드 없이 100% 브라우저 내부에서 안전하고 빠르게 PDF 변환(PDF ➡️ JPG), 병합(PDF + PDF), 추출(PDF-PDF), 암호화를 수행하는 모두에게 100% 무료 플랫폼입니다.',
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)]">
      <Navbar />

      <main className="flex-1 pt-[80px]">
        <HomePortalClient />
      </main>

      <Footer />
    </div>
  );
}
