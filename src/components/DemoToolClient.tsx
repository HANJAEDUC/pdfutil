"use client";

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import styles from './PdfConverterClient.module.css';
import { useLanguage } from '@/lib/LanguageContext';
import {
  IoCloudUploadOutline,
  IoShieldCheckmarkOutline,
  IoRefreshOutline,
  IoCheckmarkCircleOutline,
} from 'react-icons/io5';

interface DemoToolProps {
  toolKey: string;
  defaultTitle: string;
  defaultCategory: string;
  defaultDescription: string;
}

const TOOL_DETAILS_I18N: { [key: string]: { [lang: string]: { title: string; desc: string } } } = {
  pdfxxx: {
    ko: { title: 'pdfxxx (페이지 분할)', desc: '하나의 PDF 문서를 여러 개로 분할합니다. (기능 구현 준비 중)' },
    en: { title: 'pdfxxx (Split PDF)', desc: 'Split a PDF document into multiple separate files. (Coming Soon)' },
    de: { title: 'pdfxxx (PDF Teilen)', desc: 'Teilen Sie ein PDF-Dokument in mehrere Dateien. (In Vorbereitung)' },
  },
  pdfxxxx: {
    ko: { title: 'pdfxxxx (페이지 삭제)', desc: 'PDF 문서에서 불필요한 페이지를 삭제합니다. (기능 구현 준비 중)' },
    en: { title: 'pdfxxxx (Delete Pages)', desc: 'Delete unwanted pages from a PDF document. (Coming Soon)' },
    de: { title: 'pdfxxxx (Seiten Löschen)', desc: 'Löschen Sie unerwünschte Seiten aus einem PDF. (In Vorbereitung)' },
  },
  pdfxxxxx: {
    ko: { title: 'pdfxxxxx (페이지 회전)', desc: 'PDF 각 페이지 방향을 90도 회전시킵니다. (기능 구현 준비 중)' },
    en: { title: 'pdfxxxxx (Rotate PDF)', desc: 'Rotate PDF pages 90 degrees or 180 degrees. (Coming Soon)' },
    de: { title: 'pdfxxxxx (PDF Drehen)', desc: 'Drehen Sie PDF-Seiten um 90 oder 180 Grad. (In Vorbereitung)' },
  },
  pdfxxxxxx: {
    ko: { title: 'pdfxxxxxx (용량 압축)', desc: 'PDF 문서 용량을 경량화하여 압축합니다. (기능 구현 준비 중)' },
    en: { title: 'pdfxxxxxx (Compress PDF)', desc: 'Compress and reduce the file size of your PDF. (Coming Soon)' },
    de: { title: 'pdfxxxxxx (PDF Komprimieren)', desc: 'Reduzieren Sie die Dateigröße Ihres PDFs. (In Vorbereitung)' },
  },
  pdfxxxxxxx: {
    ko: { title: 'pdfxxxxxxx (워터마크 추가)', desc: 'PDF 문서에 워터마크 텍스트를 삽입합니다. (기능 구현 준비 중)' },
    en: { title: 'pdfxxxxxxx (Watermark PDF)', desc: 'Add text or image watermarks to your PDF. (Coming Soon)' },
    de: { title: 'pdfxxxxxxx (Wasserzeichen)', desc: 'Fügen Sie Wasserzeichen zu Ihrem PDF hinzu. (In Vorbereitung)' },
  },
  pdfxxxxxxxx: {
    ko: { title: 'pdfxxxxxxxx (텍스트 추출)', desc: 'PDF 문서에서 본문 텍스트를 추출합니다. (기능 구현 준비 중)' },
    en: { title: 'pdfxxxxxxxx (Extract Text)', desc: 'Extract plain text content from your PDF file. (Coming Soon)' },
    de: { title: 'pdfxxxxxxxx (Text Extrahieren)', desc: 'Extrahieren Sie Reinext aus Ihrer PDF-Datei. (In Vorbereitung)' },
  },
  pdfxxxxxxxxx: {
    ko: { title: 'pdfxxxxxxxxx (OCR 글자 인식)', desc: '스캔 이미지 PDF를 글자 인식(OCR)합니다. (기능 구현 준비 중)' },
    en: { title: 'pdfxxxxxxxxx (OCR Recognition)', desc: 'Recognize text from scanned PDF images using OCR. (Coming Soon)' },
    de: { title: 'pdfxxxxxxxxx (OCR Erkennung)', desc: 'Erkennen Sie Text aus gescannten PDF-Dateien. (In Vorbereitung)' },
  },
};

export default function DemoToolClient({ toolKey, defaultTitle, defaultDescription }: DemoToolProps) {
  const { lang, t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentInfo = TOOL_DETAILS_I18N[toolKey]?.[lang] || {
    title: defaultTitle,
    desc: defaultDescription,
  };

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      alert(lang === 'ko' ? 'PDF 파일만 선택 가능합니다.' : 'Please select a valid PDF file.');
      return;
    }
    setFile(selectedFile);
    alert(
      lang === 'ko'
        ? `🚧 [${currentInfo.title}] 기능은 현재 준비 중입니다.\n빠른 시일 내에 정식 기능으로 업데이트해 드리겠습니다!`
        : `🚧 [${currentInfo.title}] feature is currently under construction.\nWe will update it soon!`
    );
  };

  return (
    <div className={styles.container}>
      {/* 1. Header Section (Exact match to pdf-to-jpg) */}
      <header className={styles.header}>
        <h1 className={styles.title}>
          {currentInfo.title}
        </h1>
        <p className={styles.subtitle}>
          {currentInfo.desc}
        </p>
      </header>

      {/* 2. Privacy Guarantee Banner (Exact match to pdf-to-jpg) */}
      <div className={styles.privacyBanner}>
        <IoShieldCheckmarkOutline size={18} />
        <span>{t.privacy.banner}</span>
      </div>

      {/* 3. Main Dropzone Box (Exact match to pdf-to-jpg) */}
      {!file ? (
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
          <IoCloudUploadOutline className={styles.dropIcon} />

          <h2 className={styles.dropText}>
            {lang === 'ko'
              ? '처리할 PDF 파일을 이곳에 드래그하거나 클릭하세요'
              : lang === 'de'
              ? 'PDF-Datei hierher ziehen oder klicken'
              : 'Drag and drop your PDF file here, or click to select'}
          </h2>

          <p className={styles.subText}>
            {lang === 'ko'
              ? '최대 파일 크기 제한 없이 안전하게 내 컴퓨터에서 바로 처리됩니다.'
              : lang === 'de'
              ? 'Kostenlos ohne Dateigrößenbeschränkung nutzbar.'
              : 'Free to use with no maximum file size limits.'}
          </p>

          <button className={styles.selectBtn} type="button">
            {lang === 'ko' ? 'PDF 파일 선택' : lang === 'de' ? 'PDF-Datei Auswählen' : 'Select PDF File'}
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
      ) : (
        <div className={styles.workspace}>
          <div className={styles.controlsBar}>
            <div className={styles.fileSummary}>
              <span className={styles.fileName}>📄 {file.name}</span>
              <span className={styles.fileSize}>
                ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>

            <button className={styles.newFileBtn} onClick={() => setFile(null)}>
              <IoRefreshOutline /> {lang === 'ko' ? '새 파일' : 'New File'}
            </button>
          </div>

          <div className="bg-[#1e1f20] border border-amber-500/30 rounded-2xl p-8 text-center my-6 shadow-2xl">
            <h3 className="text-xl font-bold text-amber-300 mb-2">
              🚧 [{currentInfo.title}] {lang === 'ko' ? '기능은 정식 서비스 준비 중입니다' : 'Feature Under Construction'}
            </h3>
            <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
              {lang === 'ko'
                ? '선택하신 PDF 파일이 정상 확인되었습니다. 빠른 시일 내에 완전한 처리 기능으로 업데이트해 드리겠습니다!'
                : 'Your PDF file was verified. Full processing functionality will be updated soon!'}
            </p>

            <Link
              href="/"
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg inline-flex items-center gap-2 cursor-pointer"
            >
              <span>{lang === 'ko' ? '메인 홈으로 돌아가기 ➔' : 'Return to Home ➔'}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
