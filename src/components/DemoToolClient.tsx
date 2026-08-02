"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { IoConstructOutline, IoArrowBackOutline, IoLockClosedOutline } from 'react-icons/io5';

interface DemoToolProps {
  title: string;
  icon: string;
  category: string;
  description: string;
}

export default function DemoToolClient({ title, icon, category, description }: DemoToolProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleActionClick = () => {
    alert(`🚧 [${title}] 기능은 현재 열심히 준비 중입니다!\n빠른 시일 내에 완성된 기능으로 업데이트해 드리겠습니다.`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Top Banner Notice */}
      <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-semibold flex items-center justify-center gap-3 shadow-lg text-center">
        <IoConstructOutline className="text-xl shrink-0 animate-pulse" />
        <span>🚧 <strong>[안내]</strong> 현재 해당 유틸리티 기능은 <strong>구현 준비 중</strong>입니다.</span>
      </div>

      <div className="text-center mb-8">
        <span className="inline-block px-3 py-1 bg-amber-500/15 text-amber-400 text-xs font-semibold rounded-full mb-3 border border-amber-500/30">
          {category} • 출시 준비 중 (Coming Soon)
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 flex items-center justify-center gap-3">
          <span>{icon}</span>
          <span>{title}</span>
        </h1>
        <p className="text-gray-400 mt-2 text-sm sm:text-base max-w-xl mx-auto">
          {description}
        </p>
      </div>

      <div className="bg-[#1e1f20] border border-white/10 rounded-2xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
        <div className="border-2 border-dashed border-amber-500/30 rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center bg-amber-500/[0.02]">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-3xl mb-4 border border-amber-500/20">
            <IoConstructOutline />
          </div>

          <h3 className="text-xl font-bold text-gray-100 mb-2">
            🚧 현재 기능 구현 준비 중입니다
          </h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto mb-6 leading-relaxed">
            더욱 완성도 높고 편리한 PDF 유틸리티 환경을 위해 개발 작업을 진행하고 있습니다. 정식 업데이트를 조금만 기다려 주세요!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <label className="px-6 py-3 bg-amber-600/80 hover:bg-amber-600 text-white font-medium rounded-xl text-sm transition-all shadow-lg cursor-pointer inline-flex items-center gap-2">
              <span>PDF 미리 테스트해보기</span>
              <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileChange} />
            </label>

            <Link
              href="/"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-gray-200 font-medium rounded-xl text-sm transition-all inline-flex items-center gap-2"
            >
              <IoArrowBackOutline />
              <span>메인 홈으로 이동</span>
            </Link>
          </div>
        </div>

        {selectedFile && (
          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-left flex items-center justify-between">
            <span className="text-sm text-amber-300 font-medium truncate">
              📄 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
            <button
              onClick={handleActionClick}
              className="px-4 py-2 bg-amber-500 text-gray-950 font-bold text-xs rounded-lg hover:bg-amber-400 transition-all shrink-0 ml-4 shadow"
            >
              {title} 테스트 ➔
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-gray-400 gap-4">
          <span className="flex items-center gap-1.5"><IoLockClosedOutline /> 100% Client-Side Private Engine</span>
          <Link href="/" className="text-blue-400 hover:underline flex items-center gap-1">
            <span>모든 PDF 기능 보러가기</span>
            <span>➔</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
