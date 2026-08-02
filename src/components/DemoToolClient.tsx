"use client";

import React from 'react';
import Link from 'next/link';
import styles from './PdfConverterClient.module.css';
import { useLanguage } from '@/lib/LanguageContext';
import {
  IoShieldCheckmarkOutline,
  IoConstructOutline,
  IoArrowBackOutline,
  IoLockClosedOutline,
} from 'react-icons/io5';

interface DemoToolProps {
  toolKey: string;
  defaultTitle: string;
  defaultCategory: string;
  defaultDescription: string;
}

const TOOL_DETAILS_I18N: { [key: string]: { [lang: string]: { title: string; desc: string } } } = {
  pdfxxx: {
    ko: { title: 'pdfxxx (페이지 분할)', desc: '하나의 PDF 문서를 여러 개로 분할합니다. (현재 기능 구현 준비 중입니다)' },
    en: { title: 'pdfxxx (Split PDF)', desc: 'Split a PDF document into multiple separate files. (Feature Under Construction)' },
    de: { title: 'pdfxxx (PDF Teilen)', desc: 'Teilen Sie ein PDF-Dokument in mehrere Dateien. (Funktion in Vorbereitung)' },
  },
  pdfxxxx: {
    ko: { title: 'pdfxxxx (페이지 삭제)', desc: 'PDF 문서에서 불필요한 페이지를 삭제합니다. (현재 기능 구현 준비 중입니다)' },
    en: { title: 'pdfxxxx (Delete Pages)', desc: 'Delete unwanted pages from a PDF document. (Feature Under Construction)' },
    de: { title: 'pdfxxxx (Seiten Löschen)', desc: 'Löschen Sie unerwünschte Seiten aus einem PDF. (Funktion in Vorbereitung)' },
  },
  pdfxxxxx: {
    ko: { title: 'pdfxxxxx (페이지 회전)', desc: 'PDF 각 페이지 방향을 90도 회전시킵니다. (현재 기능 구현 준비 중입니다)' },
    en: { title: 'pdfxxxxx (Rotate PDF)', desc: 'Rotate PDF pages 90 degrees or 180 degrees. (Feature Under Construction)' },
    de: { title: 'pdfxxxxx (PDF Drehen)', desc: 'Drehen Sie PDF-Seiten um 90 oder 180 Grad. (Funktion in Vorbereitung)' },
  },
  pdfxxxxxx: {
    ko: { title: 'pdfxxxxxx (용량 압축)', desc: 'PDF 문서 용량을 경량화하여 압축합니다. (현재 기능 구현 준비 중입니다)' },
    en: { title: 'pdfxxxxxx (Compress PDF)', desc: 'Compress and reduce the file size of your PDF. (Feature Under Construction)' },
    de: { title: 'pdfxxxxxx (PDF Komprimieren)', desc: 'Reduzieren Sie die Dateigröße Ihres PDFs. (Funktion in Vorbereitung)' },
  },
  pdfxxxxxxx: {
    ko: { title: 'pdfxxxxxxx (워터마크 추가)', desc: 'PDF 문서에 워터마크 텍스트를 삽입합니다. (현재 기능 구현 준비 중입니다)' },
    en: { title: 'pdfxxxxxxx (Watermark PDF)', desc: 'Add text or image watermarks to your PDF. (Feature Under Construction)' },
    de: { title: 'pdfxxxxxxx (Wasserzeichen)', desc: 'Fügen Sie Wasserzeichen zu Ihrem PDF hinzu. (Funktion in Vorbereitung)' },
  },
  pdfxxxxxxxx: {
    ko: { title: 'pdfxxxxxxxx (텍스트 추출)', desc: 'PDF 문서에서 본문 텍스트를 추출합니다. (현재 기능 구현 준비 중입니다)' },
    en: { title: 'pdfxxxxxxxx (Extract Text)', desc: 'Extract plain text content from your PDF file. (Feature Under Construction)' },
    de: { title: 'pdfxxxxxxxx (Text Extrahieren)', desc: 'Extrahieren Sie Reinext aus Ihrer PDF-Datei. (Funktion in Vorbereitung)' },
  },
  pdfxxxxxxxxx: {
    ko: { title: 'pdfxxxxxxxxx (OCR 글자 인식)', desc: '스캔 이미지 PDF를 글자 인식(OCR)합니다. (현재 기능 구현 준비 중입니다)' },
    en: { title: 'pdfxxxxxxxxx (OCR Recognition)', desc: 'Recognize text from scanned PDF images using OCR. (Feature Under Construction)' },
    de: { title: 'pdfxxxxxxxxx (OCR Erkennung)', desc: 'Erkennen Sie Text aus gescannten PDF-Dateien. (Funktion in Vorbereitung)' },
  },
};

export default function DemoToolClient({ toolKey, defaultTitle, defaultDescription }: DemoToolProps) {
  const { lang, t } = useLanguage();

  const currentInfo = TOOL_DETAILS_I18N[toolKey]?.[lang] || {
    title: defaultTitle,
    desc: defaultDescription,
  };

  const handleDisabledNotice = () => {
    alert(
      lang === 'ko'
        ? `🚧 [${currentInfo.title}] 기능은 현재 서비스 구현 준비 중입니다!\n정식 업데이트 완료 후 이용하실 수 있습니다.`
        : `🚧 [${currentInfo.title}] feature is currently under construction.\nIt will be available after the official update!`
    );
  };

  return (
    <div className={styles.container}>
      {/* 1. Header Section */}
      <header className={styles.header}>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold mb-4 shadow-sm">
          <IoConstructOutline className="animate-pulse text-sm" />
          <span>
            {lang === 'ko'
              ? '현재 기능 구현 준비 중입니다'
              : lang === 'de'
              ? 'Funktion in Vorbereitung (In Kürze)'
              : 'Feature Under Construction (Coming Soon)'}
          </span>
        </div>

        <h1 className={styles.title}>
          {currentInfo.title}
        </h1>
        <p className={styles.subtitle}>
          {currentInfo.desc}
        </p>
      </header>

      {/* 2. Privacy Guarantee Banner */}
      <div className={styles.privacyBanner}>
        <IoShieldCheckmarkOutline size={18} />
        <span>{t.privacy.banner}</span>
      </div>

      {/* 3. Inactive Disabled Dropzone Box */}
      <div
        className={`${styles.dropzone} opacity-90 cursor-not-allowed border-amber-500/40 bg-amber-500/[0.02]`}
        onClick={handleDisabledNotice}
      >
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-4xl mb-4 border border-amber-500/30 shadow-inner">
          <IoConstructOutline />
        </div>

        <h2 className="text-2xl font-bold text-gray-100 mb-2">
          {lang === 'ko'
            ? '🚧 현재 기능 구현 준비 중입니다'
            : lang === 'de'
            ? '🚧 Funktion in Vorbereitung'
            : '🚧 Feature Under Construction'}
        </h2>

        <p className="text-sm text-gray-400 max-w-md mx-auto mb-6 leading-relaxed">
          {lang === 'ko'
            ? '해당 유틸리티 기능은 현재 개발 및 테스트 진행 중으로 파일 선택이 제한되어 있습니다. 빠른 시일 내에 정식 기능으로 업데이트하겠습니다!'
            : lang === 'de'
            ? 'Diese Funktion befindet sich in der Vorbereitung. Die Dateiauswahl ist derzeit deaktiviert.'
            : 'This utility feature is currently under preparation. File selection is temporarily disabled.'}
        </p>

        {/* Disabled Button */}
        <button
          className="px-8 py-3.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold rounded-2xl text-sm transition-all shadow-md cursor-not-allowed inline-flex items-center gap-2"
          type="button"
          disabled
        >
          <IoLockClosedOutline size={18} />
          <span>
            {lang === 'ko'
              ? '🚧 현재 기능 구현 준비 중'
              : lang === 'de'
              ? '🚧 Funktion in Vorbereitung'
              : '🚧 Feature Under Construction'}
          </span>
        </button>
      </div>

      {/* 4. Return to Home Button */}
      <div className="mt-10 text-center">
        <Link
          href="/"
          className="px-8 py-3.5 bg-white/10 hover:bg-white/20 text-gray-200 font-semibold rounded-xl text-sm transition-all inline-flex items-center gap-2 border border-white/10 shadow-md"
        >
          <IoArrowBackOutline size={18} />
          <span>{lang === 'ko' ? '메인 홈페이지로 돌아가기' : 'Return to Home'}</span>
        </Link>
      </div>
    </div>
  );
}
