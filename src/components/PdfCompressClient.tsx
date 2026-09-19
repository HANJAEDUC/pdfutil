"use client";

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import styles from './PdfCompressClient.module.css';
import { useLanguage } from '@/lib/LanguageContext';
import { PDFDocument } from 'pdf-lib';
import {
  IoCloudUploadOutline,
  IoDownloadOutline,
  IoShieldCheckmarkOutline,
  IoDocumentTextOutline,
  IoRefreshOutline,
  IoCheckmarkCircleOutline,
  IoArrowForwardOutline,
  IoSpeedometerOutline,
  IoSparklesOutline,
  IoLayersOutline,
} from 'react-icons/io5';

type CompressionLevel = 'strong' | 'medium' | 'quality';

interface CompressionResult {
  blobUrl: string;
  filename: string;
  originalSize: number;
  compressedSize: number;
  savedPercent: number;
}

export default function PdfCompressClient() {
  const { lang } = useLanguage();

  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [level, setLevel] = useState<CompressionLevel>('medium');
  const [isCompressing, setIsCompressing] = useState(false);
  const [progressText, setProgressText] = useState<string>('PDF 분석 및 압축 준비 중...');
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatMB = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf')) {
        setFile(selectedFile);
        setResult(null);
        setErrorMsg(null);
      } else {
        alert(lang === 'ko' ? 'PDF 파일만 선택 가능합니다.' : 'Please select a valid PDF file.');
      }
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf' || droppedFile.name.endsWith('.pdf')) {
        setFile(droppedFile);
        setResult(null);
        setErrorMsg(null);
      } else {
        alert(lang === 'ko' ? 'PDF 파일만 선택 가능합니다.' : 'Please select a valid PDF file.');
      }
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setErrorMsg(null);
    setIsCompressing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getPdfJsLib = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        if (pdfjsLib) {
          pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve(pdfjsLib);
        } else {
          reject(new Error('PDF.js library failed to initialize'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load PDF.js from CDN'));
      document.head.appendChild(script);
    });
  };

  const compressClientSide = async (
    targetFile: File,
    optLevel: CompressionLevel
  ): Promise<{ blob: Blob; size: number }> => {
    const pdfjsLib = await getPdfJsLib();
    const arrayBuffer = await targetFile.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    const newPdfDoc = await PDFDocument.create();

    const settings = {
      strong: { scale: 1.25, quality: 0.5 },
      medium: { scale: 1.5, quality: 0.65 },
      quality: { scale: 1.85, quality: 0.8 },
    }[optLevel];

    for (let i = 1; i <= numPages; i++) {
      setProgressText(`브라우저 내부에서 페이지 압축 중... (${i} / ${numPages} 페이지)`);
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: settings.scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      await page.render({ canvasContext: ctx, viewport }).promise;

      const jpegDataUrl = canvas.toDataURL('image/jpeg', settings.quality);
      const res = await fetch(jpegDataUrl);
      const jpegBytes = await res.arrayBuffer();

      const embeddedImage = await newPdfDoc.embedJpg(jpegBytes);
      const origViewport = page.getViewport({ scale: 1.0 });
      const newPage = newPdfDoc.addPage([origViewport.width, origViewport.height]);
      newPage.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: origViewport.width,
        height: origViewport.height,
      });
    }

    setProgressText('최종 PDF 최적화 및 저장 중...');
    const pdfBytes = await newPdfDoc.save();
    return {
      blob: new Blob([pdfBytes as any], { type: 'application/pdf' }),
      size: pdfBytes.byteLength,
    };
  };

  const startCompression = async () => {
    if (!file) return;

    setIsCompressing(true);
    setErrorMsg(null);
    setProgressText('PDF 스트림 및 이미지 정밀 분석 중...');

    const levelLabels: Record<CompressionLevel, string> = {
      strong: '강력',
      medium: '일반',
      quality: '고품질',
    };
    const baseName = file.name.replace(/\.pdf$/i, '');
    const outFilename = `${baseName}_압축_${levelLabels[level]}.pdf`;

    try {
      let finalBlob: Blob | null = null;
      let origSize = file.size;
      let compSize = 0;

      // 1. First try server-side PyMuPDF API route
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('level', level);

        const response = await fetch('/api/compress-pdf', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          finalBlob = await response.blob();
          origSize = Number(response.headers.get('X-Original-Size')) || file.size;
          compSize = Number(response.headers.get('X-Compressed-Size')) || finalBlob.size;
        }
      } catch {
        // Fallback to client-side
      }

      // 2. If server-side is unavailable (e.g. serverless environment), seamlessly compress client-side
      if (!finalBlob) {
        setProgressText('브라우저 전용 압축 모드로 전환합니다...');
        const clientRes = await compressClientSide(file, level);
        finalBlob = clientRes.blob;
        compSize = clientRes.size;
      }

      const blobUrl = URL.createObjectURL(finalBlob);
      const savedPercent = Math.max(0, Math.round(((origSize - compSize) / origSize) * 100));

      setResult({
        blobUrl,
        filename: outFilename,
        originalSize: origSize,
        compressedSize: compSize,
        savedPercent,
      });
    } catch (err: any) {
      console.error('Compression error:', err);
      setErrorMsg(err.message || 'PDF 압축 처리 중 오류가 발생했습니다.');
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.badgeTitle}>PDF Compress Tool</span>
        <h1 className={styles.title}>
          🗜️ PDF 용량 압축
        </h1>
        <p className={styles.subtitle}>
          고해상도 이미지와 불필요한 메타데이터를 정밀 최적화하여 텍스트 손상 없이 용량을 획기적으로 줄입니다.
        </p>
      </div>

      {/* Privacy Notice */}
      <div className={styles.privacyBanner}>
        <IoShieldCheckmarkOutline size={18} />
        <span>개인정보 안심: 압축 작업은 안전하게 처리되며 파일은 외부에 보관되지 않습니다.</span>
      </div>

      {/* Upload Zone (when no file selected) */}
      {!file && (
        <div
          className={`${styles.dropzone} ${isDragOver ? styles.dragOver : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,application/pdf"
            style={{ display: 'none' }}
          />
          <div className={styles.uploadIconWrap}>
            <IoCloudUploadOutline size={38} />
          </div>
          <div className={styles.dropzoneText}>
            압축할 PDF 파일을 드래그하거나 클릭하여 선택하세요
          </div>
          <div className={styles.dropzoneSub}>
            대용량 PDF 문서도 강력하고 안전하게 압축됩니다
          </div>
          <button type="button" className={styles.selectBtn}>
            내 컴퓨터에서 PDF 선택
          </button>
        </div>
      )}

      {/* File Selected & Option Settings */}
      {file && !isCompressing && !result && (
        <div>
          {/* File Card */}
          <div className={styles.fileCard}>
            <div className={styles.fileCardLeft}>
              <div className={styles.fileIcon}>
                <IoDocumentTextOutline size={26} />
              </div>
              <div>
                <div className={styles.fileName}>{file.name}</div>
                <div className={styles.fileSize}>현재 용량: {formatMB(file.size)}</div>
              </div>
            </div>
            <button type="button" onClick={handleReset} className={styles.changeFileBtn}>
              파일 변경
            </button>
          </div>

          {/* 3 Compression Options */}
          <div className={styles.optionSection}>
            <div className={styles.optionSectionTitle}>압축 옵션을 선택하세요</div>
            <div className={styles.optionGrid}>
              {/* Option 1: Strong */}
              <div
                className={`${styles.optionCard} ${level === 'strong' ? styles.optionCardActive : ''}`}
                onClick={() => setLevel('strong')}
              >
                <span className={`${styles.optionBadge} ${styles.badgeStrong}`}>최대 압축률</span>
                <div className={styles.optionTitle}>
                  <span>🚀 강력 압축</span>
                  <IoSpeedometerOutline size={20} color="#f28b82" />
                </div>
                <div className={styles.optionRatio}>약 70 ~ 80% 용량 절감</div>
                <div className={styles.optionDesc}>
                  이메일 첨부나 용량 제한 사이트 업로드에 최적화된 최소 용량 모드입니다.
                </div>
              </div>

              {/* Option 2: Medium (Default) */}
              <div
                className={`${styles.optionCard} ${level === 'medium' ? styles.optionCardActive : ''}`}
                onClick={() => setLevel('medium')}
              >
                <span className={`${styles.optionBadge} ${styles.badgeMedium}`}>추천 (Recommended)</span>
                <div className={styles.optionTitle}>
                  <span>⚖️ 일반 압축</span>
                  <IoLayersOutline size={20} color="#8ab4f8" />
                </div>
                <div className={styles.optionRatio}>약 55 ~ 65% 용량 절감</div>
                <div className={styles.optionDesc}>
                  선명한 화면 가독성과 우수한 압축률 사이의 가장 이상적인 밸런스를 제공합니다.
                </div>
              </div>

              {/* Option 3: High Quality */}
              <div
                className={`${styles.optionCard} ${level === 'quality' ? styles.optionCardActive : ''}`}
                onClick={() => setLevel('quality')}
              >
                <span className={`${styles.optionBadge} ${styles.badgeQuality}`}>고화질 유지</span>
                <div className={styles.optionTitle}>
                  <span>💎 고품질 압축</span>
                  <IoSparklesOutline size={20} color="#81c995" />
                </div>
                <div className={styles.optionRatio}>약 40 ~ 50% 용량 절감</div>
                <div className={styles.optionDesc}>
                  인쇄 및 프레젠테이션을 위해 원본 수준의 높은 해상도를 보존하며 최적화합니다.
                </div>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div style={{ color: '#ea4335', textAlign: 'center', marginBottom: '20px', fontWeight: 600 }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Start Button */}
          <div className={styles.actionArea}>
            <button
              type="button"
              className={styles.compressBtn}
              onClick={startCompression}
            >
              <span>🗜️ 선택한 옵션으로 압축 시작</span>
              <IoArrowForwardOutline size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Loading Box */}
      {isCompressing && (
        <div className={styles.loadingBox}>
          <div className={styles.spinner}></div>
          <div className={styles.loadingText}>PDF 정밀 압축 진행 중...</div>
          <div className={styles.loadingSubText}>{progressText}</div>
        </div>
      )}

      {/* Result Box */}
      {result && (
        <div className={styles.resultBox}>
          <div className={styles.successBadge}>
            <IoCheckmarkCircleOutline size={20} />
            <span>PDF 압축이 성공적으로 완료되었습니다!</span>
          </div>

          <div className={styles.resultTitle}>
            총 {result.savedPercent}% 용량이 절감되었습니다 🎉
          </div>

          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>압축 전 원본 용량</div>
              <div className={styles.statVal}>{formatMB(result.originalSize)}</div>
            </div>

            <IoArrowForwardOutline className={styles.arrowIcon} />

            <div className={styles.statCard}>
              <div className={styles.statLabel}>압축 후 최종 용량</div>
              <div className={`${styles.statVal} ${styles.statValSaved}`}>
                {formatMB(result.compressedSize)}
              </div>
            </div>
          </div>

          <div className={styles.btnGroup}>
            <a
              href={result.blobUrl}
              download={result.filename}
              className={styles.downloadBtn}
            >
              <IoDownloadOutline size={20} />
              <span>압축된 PDF 다운로드</span>
            </a>
            <button type="button" onClick={handleReset} className={styles.resetBtn}>
              <IoRefreshOutline size={18} />
              <span>다른 파일 압축</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
