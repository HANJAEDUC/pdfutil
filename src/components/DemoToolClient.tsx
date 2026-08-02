"use client";

import React, { useState } from 'react';
import Link from 'next/link';

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-full mb-3 border border-blue-500/20">
          {category} • 추가 유틸리티
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
        <div className="border-2 border-dashed border-white/20 hover:border-blue-500/50 transition-colors rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center cursor-pointer bg-white/[0.02]">
          <div className="text-5xl mb-4">{icon}</div>
          <h3 className="text-lg font-semibold text-gray-200 mb-1">
            {selectedFile ? selectedFile.name : `${title}할 파일 드래그 & 드롭`}
          </h3>
          <p className="text-xs text-gray-400 mb-6">
            100% 브라우저 내부에서 안전하게 처리되며 서버에 전송되지 않습니다.
          </p>

          <label className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm transition-all shadow-lg cursor-pointer inline-flex items-center gap-2">
            <span>PDF 파일 선택</span>
            <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileChange} />
          </label>
        </div>

        {selectedFile && (
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-left flex items-center justify-between">
            <span className="text-sm text-blue-300 font-medium truncate">
              📄 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
            <button
              onClick={() => alert(`${title} 기능 테스트 중입니다! 정상 선택되었습니다.`)}
              className="px-4 py-2 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-400 transition-all shrink-0 ml-4"
            >
              {title} 실행 ➔
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-gray-400 gap-4">
          <span>🔒 100% Client-Side Privacy</span>
          <span>⚡ High Performance Local Engine</span>
          <Link href="/" className="text-blue-400 hover:underline">
            홈으로 돌아가기 ➔
          </Link>
        </div>
      </div>
    </div>
  );
}
