"use client";

import React, { useRef } from 'react';
import styles from './PdfConverterClient.module.css';
import { useLanguage } from '@/lib/LanguageContext';
import {
  IoCloudUploadOutline,
  IoShieldCheckmarkOutline,
} from 'react-icons/io5';

interface DemoToolProps {
  toolKey: string;
  defaultTitle: string;
  defaultCategory: string;
  defaultDescription: string;
}

const TOOL_DETAILS_I18N: { [key: string]: { [lang: string]: { title: string; desc: string } } } = {
  pdfxxx: {
    ko: { title: 'pdfxxx (페이지 분할)', desc: '하나의 PDF 문서를 여러 개로 분할합니다.' },
    en: { title: 'pdfxxx (Split PDF)', desc: 'Split a PDF document into multiple separate files.' },
    de: { title: 'pdfxxx (PDF Teilen)', desc: 'Teilen Sie ein PDF-Dokument in mehere Dateien.' },
  },
  pdfxxxx: {
    ko: { title: 'pdfxxxx (페이지 삭제)', desc: 'PDF 문서에서 불필요한 페이지를 삭제합니다.' },
    en: { title: 'pdfxxxx (Delete Pages)', desc: 'Delete unwanted pages from a PDF document.' },
    de: { title: 'pdfxxxx (Seiten Löschen)', desc: 'Löschen Sie unerwünschte Seiten aus einem PDF.' },
  },
  pdfxxxxx: {
    ko: { title: 'pdfxxxxx (페이지 회전)', desc: 'PDF 각 페이지 방향을 90도 회전시킵니다.' },
    en: { title: 'pdfxxxxx (Rotate PDF)', desc: 'Rotate PDF pages 90 degrees or 180 degrees.' },
    de: { title: 'pdfxxxxx (PDF Drehen)', desc: 'Drehen Sie PDF-Seiten um 90 oder 180 Grad.' },
  },
  pdfxxxxxx: {
    ko: { title: 'pdfxxxxxx (용량 압축)', desc: 'PDF 문서 용량을 경량화하여 압축합니다.' },
    en: { title: 'pdfxxxxxx (Compress PDF)', desc: 'Compress and reduce the file size of your PDF.' },
    de: { title: 'pdfxxxxxx (PDF Komprimieren)', desc: 'Reduzieren Sie die Dateigröße Ihres PDFs.' },
  },
  pdfxxxxxxx: {
    ko: { title: 'pdfxxxxxxx (워터마크 추가)', desc: 'PDF 문서 배경에 워터마크 텍스트를 삽입합니다.' },
    en: { title: 'pdfxxxxxxx (Watermark PDF)', desc: 'Add text or image watermarks to your PDF.' },
    de: { title: 'pdfxxxxxxx (Wasserzeichen)', desc: 'Fügen Sie Wasserzeichen zu Ihrem PDF hinzu.' },
  },
  pdfxxxxxxxx: {
    ko: { title: 'pdfxxxxxxxx (텍스트 추출)', desc: 'PDF 문서에서 본문 텍스트를 추출합니다.' },
    en: { title: 'pdfxxxxxxxx (Extract Text)', desc: 'Extract plain text content from your PDF file.' },
    de: { title: 'pdfxxxxxxxx (Text Extrahieren)', desc: 'Extrahieren Sie Reinext aus Ihrer PDF-Datei.' },
  },
  pdfxxxxxxxxx: {
    ko: { title: 'pdfxxxxxxxxx (OCR 글자 인식)', desc: '스캔 이미지 PDF를 글자 인식(OCR)합니다.' },
    en: { title: 'pdfxxxxxxxxx (OCR Recognition)', desc: 'Recognize text from scanned PDF images using OCR.' },
    de: { title: 'pdfxxxxxxxxx (OCR Erkennung)', desc: 'Erkennen Sie Text aus gescannten PDF-Dateien.' },
  },
};

export default function DemoToolClient({ toolKey, defaultTitle, defaultDescription }: DemoToolProps) {
  const { lang, t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentInfo = TOOL_DETAILS_I18N[toolKey]?.[lang] || {
    title: defaultTitle,
    desc: defaultDescription,
  };

  const handleActionNotice = () => {
    alert(
      lang === 'ko'
        ? `🚧 [${currentInfo.title}] 기능은 현재 출시 준비 중입니다!\n빠른 시일 내에 정식 기능으로 서비스해 드리겠습니다.`
        : `🚧 [${currentInfo.title}] feature is currently under construction.\nWe will update it soon!`
    );
  };

  return (
    <div className={styles.container}>
      {/* 1. Header Section (100% Identical to pdf-to-jpg with badgeTitle) */}
      <header className={styles.header}>
        <span className={styles.badgeTitle}>{t.badge}</span>
        <h1 className={styles.title}>
          {currentInfo.title}
        </h1>
        <p className={styles.subtitle}>
          {currentInfo.desc}
        </p>
      </header>

      {/* 2. Privacy Guarantee Banner (100% Identical to pdf-to-jpg) */}
      <div className={styles.privacyBanner}>
        <IoShieldCheckmarkOutline size={18} />
        <span>{t.privacy.banner}</span>
      </div>

      {/* 3. Main Dropzone Box (100% Identical to pdf-to-jpg) */}
      <div
        className={styles.dropzone}
        onClick={handleActionNotice}
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
        />
      </div>
    </div>
  );
}
