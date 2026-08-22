import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HwpToPdfClient from '@/components/HwpToPdfClient';

export const metadata = {
  title: 'HWP / HWPX ➡️ PDF 변환기 | myPDF (mypdf.co.kr)',
  description:
    '서버 업로드 없이 100% 브라우저 내부에서 안전하고 빠르게 한글(HWP, HWPX) 문서를 표, 이미지, 본문 텍스트가 보존된 PDF 파일로 무료 변환합니다.',
  keywords: [
    'hwp pdf 변환',
    'hwpx pdf 변환',
    '한글 pdf 변환',
    'hwp to pdf',
    'hwpx to pdf',
    '한글 파일 pdf 변환기',
    '무료 hwp 변환',
    'mypdf',
  ],
};

export default function HwpToPdfPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)]">
      <Navbar />

      <main className="flex-1 pt-[80px]">
        <HwpToPdfClient />
      </main>

      <Footer />
    </div>
  );
}
