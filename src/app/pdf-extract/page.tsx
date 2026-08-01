import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PdfExtractClient from '@/components/PdfExtractClient';

export const metadata = {
  title: 'PDF 페이지 추출기 (PdfExtract) | PDF Util',
  description: '서버 업로드 없이 PDF 파일에서 원하는 페이지만 선택하여 새로운 PDF로 추출합니다.',
};

export default function PdfExtractPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#121212]">
      <Navbar />

      <main className="flex-1 pt-[70px]">
        <PdfExtractClient />
      </main>

      <Footer />
    </div>
  );
}
