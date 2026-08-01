import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'PDF 페이지 추출기 (PdfExtract) | PDF Util',
  description: '서버 업로드 없이 PDF 파일에서 원하는 페이지만 선택하여 새로운 PDF로 추출합니다.',
};

export default function PdfExtractPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#121212]">
      <Navbar />

      <main className="flex-1 pt-[70px] max-w-[1000px] w-full mx-auto px-5 py-10">
        <header className="text-center mb-10">
          <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-[#4285f4] text-xs font-bold uppercase tracking-wider mb-3">
            Free & Private Utility
          </span>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            PDF 페이지 추출기 (PdfExtract)
          </h1>
          <p className="text-zinc-400 text-base max-w-xl mx-auto leading-relaxed">
            서버 업로드 없이 100% 브라우저 내부에서 특정 페이지를 선택하거나 범위를 지정하여 독립된 PDF로 추출합니다.
          </p>
        </header>

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-center gap-2.5 text-emerald-400 text-sm font-medium mb-8 max-w-xl mx-auto">
          <span>🔒 개인정보 안전: 파일이 외부 서버로 전송되지 않고 컴퓨터 내에서 바로 추출됩니다.</span>
        </div>

        <div className="border-2 border-dashed border-blue-500/40 bg-[#1e1f20] rounded-2xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition-all max-w-2xl mx-auto shadow-lg">
          <div className="text-blue-400 text-5xl mb-4">✂️</div>
          <div className="text-xl font-semibold text-white mb-2">
            추출할 PDF 파일을 이곳에 드래그하거나 클릭하세요
          </div>
          <div className="text-zinc-400 text-sm mb-5">
            원하는 페이지 번호나 범위를 선택하여 별도의 PDF로 다운로드합니다. (출시 준비 중)
          </div>
          <button className="bg-[#4285f4] hover:bg-[#3367d6] text-white px-6 py-3 rounded-full font-medium transition-colors">
            PDF 파일 선택
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
