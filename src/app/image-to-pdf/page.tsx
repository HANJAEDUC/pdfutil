import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ImageToPdfClient from '@/components/ImageToPdfClient';

export const metadata = {
  title: 'JPG/PNG ➡️ PDF 변환 (Image to PDF) | myPDF (mypdf.co.kr)',
  description: '서버 업로드 없이 100% 브라우저 내부에서 여러 장의 이미지(JPG, PNG, WebP)를 자유롭게 순서 배치하고 깔끔하게 1개의 PDF 문서로 통합 변환하세요.',
};

export default function ImageToPdfPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)]">
      <Navbar />
      <main className="flex-1 pt-[80px]">
        <ImageToPdfClient />
      </main>
      <Footer />
    </div>
  );
}
