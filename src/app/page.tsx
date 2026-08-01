import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HomePortalClient from '@/components/HomePortalClient';

export const metadata = {
  title: 'PDF Util — 스마트하고 빠른 무료 PDF 유틸리티 플랫폼',
  description: '서버 업로드 없이 100% 브라우저 내부에서 안전하게 PDF 변환(PDF ➡️ JPG), 병합(PDF + PDF), 추출(PDF-PDF)을 수행하는 무료 플랫폼입니다.',
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
