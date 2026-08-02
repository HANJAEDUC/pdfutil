"use client";

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import styles from './PdfConverterClient.module.css';
import {
  IoCloudUploadOutline,
  IoShieldCheckmarkOutline,
  IoFlashOutline,
  IoLockClosedOutline,
  IoConstructOutline,
  IoCheckmarkCircleOutline,
  IoArrowBackOutline,
  IoSparklesOutline,
} from 'react-icons/io5';

interface DemoToolProps {
  title: string;
  icon: string;
  category: string;
  description: string;
}

export default function DemoToolClient({ title, icon, category, description }: DemoToolProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      alert('PDF 파일만 선택 가능합니다.');
      return;
    }
    setSelectedFile(file);
  };

  const handleRunDemo = () => {
    alert(`🚧 [${title}] 기능은 현재 출시 최종 점검 중입니다!\n빠른 시일 내에 완전한 기능으로 업데이트하겠습니다.`);
  };

  return (
    <div className={styles.container}>
      {/* 1. Header Section */}
      <header className={styles.header}>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-4 shadow-sm">
          <IoConstructOutline className="animate-pulse" />
          <span>{category} • 현재 기능 구현 준비 중 (Coming Soon)</span>
        </div>

        <h1 className={styles.title}>
          <span className="mr-3">{icon}</span>
          <span>{title}</span>
        </h1>

        <p className={styles.subtitle}>
          {description}
        </p>
      </header>

      {/* 2. Privacy Guarantee Banner */}
      <div className={styles.privacyBanner}>
        <IoShieldCheckmarkOutline size={18} />
        <span>개인정보 안전: 외부 서버 전송 없이 100% 내 브라우저에서 안전하게 작동합니다.</span>
      </div>

      {/* 3. Main Dropzone Box */}
      <div
        className={`${styles.dropzone} ${isDragging ? styles.dragover : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-4xl mb-4 border border-amber-500/20 shadow-inner">
          <IoConstructOutline />
        </div>

        <h2 className="text-2xl font-bold text-gray-100 mb-2">
          🚧 [{title}] 기능 준비 중입니다
        </h2>

        <p className="text-sm text-gray-400 max-w-md mx-auto mb-6 leading-relaxed">
          더 편리하고 완성도 높은 서비스를 제공하기 위해 개발 및 테스트를 진행하고 있습니다.
          파일을 올려 미리 테스트해 보실 수 있습니다.
        </p>

        <button className={styles.selectBtn} type="button">
          <IoCloudUploadOutline size={20} />
          <span>PDF 파일 선택하여 테스트</span>
        </button>

        <input
          type="file"
          accept=".pdf,application/pdf"
          ref={fileInputRef}
          className={styles.hiddenInput}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
        />
      </div>

      {/* 4. Selected File State */}
      {selectedFile && (
        <div className="bg-[#1e1f20] border border-amber-500/30 rounded-2xl p-6 text-center mb-10 shadow-xl">
          <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
            <span className="text-sm font-semibold text-amber-300 truncate">
              📄 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </span>
            <button
              onClick={handleRunDemo}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs rounded-xl transition-all shrink-0 ml-4 shadow-lg cursor-pointer"
            >
              {title} 실행 ➔
            </button>
          </div>
          <p className="text-xs text-gray-400">
            * 준비 중인 기능으로 실행 시 안내 메세지가 표시됩니다.
          </p>
        </div>
      )}

      {/* 5. Sleek Feature Specs Cards (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10">
        <div className="bg-[#1e1f20] border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-xl mb-3 border border-blue-500/20">
              <IoFlashOutline />
            </div>
            <h3 className="font-bold text-gray-100 text-base mb-1">⚡ 초고속 엔진</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              서버 대기시간 없이 내 컴퓨터 브라우저 자원을 활용해 1초 만에 처리합니다.
            </p>
          </div>
        </div>

        <div className="bg-[#1e1f20] border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl mb-3 border border-emerald-500/20">
              <IoLockClosedOutline />
            </div>
            <h3 className="font-bold text-gray-100 text-base mb-1">🔒 100% 보안 보장</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              문서와 개인정보가 외부 서버에 절대 업로드되거나 저장되지 않습니다.
            </p>
          </div>
        </div>

        <div className="bg-[#1e1f20] border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-xl mb-3 border border-purple-500/20">
              <IoSparklesOutline />
            </div>
            <h3 className="font-bold text-gray-100 text-base mb-1">📱 멀티 디바이스</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              PC, 태블릿, 안드로이드, 아이폰 환경 모두에서 최상의 UX를 제공합니다.
            </p>
          </div>
        </div>
      </div>

      {/* 6. Return Button Footer */}
      <div className="mt-12 text-center">
        <Link
          href="/"
          className="px-8 py-3.5 bg-white/10 hover:bg-white/20 text-gray-200 font-semibold rounded-xl text-sm transition-all inline-flex items-center gap-2 border border-white/10 shadow-md"
        >
          <IoArrowBackOutline size={18} />
          <span>메인 홈페이지로 돌아가기</span>
        </Link>
      </div>
    </div>
  );
}
