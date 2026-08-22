"use client";

import React, { useState, useRef } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import styles from './PdfConverterClient.module.css';
import {
  parseHwpxFile,
  parseHwpBinaryFile,
  convertHwpParsedToPdf,
  HwpParsedSection,
} from '@/lib/hwpConverter';
import {
  IoCloudUploadOutline,
  IoDownloadOutline,
  IoRefreshOutline,
  IoCheckmarkCircleOutline,
  IoDocumentTextOutline,
} from 'react-icons/io5';

export default function HwpToPdfClient() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setIsConverting(false);
    setProgress({ current: 0, total: 0 });
    setConvertedBlob(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (selectedFile: File) => {
    const isHwp = selectedFile.name.toLowerCase().endsWith('.hwp');
    const isHwpx = selectedFile.name.toLowerCase().endsWith('.hwpx');

    if (!isHwp && !isHwpx) {
      alert('HWP 또는 HWPX 한글 파일만 선택 가능합니다.');
      return;
    }
    setFile(selectedFile);
    setConvertedBlob(null);
    convertToPdf(selectedFile);
  };

  const convertToPdf = async (hwpFile: File) => {
    setIsConverting(true);
    setConvertedBlob(null);

    try {
      let parsed: HwpParsedSection;
      if (hwpFile.name.toLowerCase().endsWith('.hwpx')) {
        parsed = await parseHwpxFile(hwpFile);
      } else {
        parsed = await parseHwpBinaryFile(hwpFile);
      }

      const pdfBlob = await convertHwpParsedToPdf(
        parsed,
        hwpFile.name,
        (current, total) => {
          setProgress({ current, total });
        }
      );

      setConvertedBlob(pdfBlob);
    } catch (err: any) {
      console.error('HWP to PDF conversion failed:', err);
      alert('HWP 파일 변환 중 오류가 발생했습니다. 파일 상태를 확인해 주세요.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!convertedBlob || !file) return;
    const pdfFilename = file.name.replace(/\.(hwp|hwpx)$/i, '') + '.pdf';
    const url = URL.createObjectURL(convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = pdfFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          {(t as any).hwp2pdf?.title || 'HWP / HWPX ➡️ PDF'}
        </h1>
        <p className={styles.subtitle}>
          {(t as any).hwp2pdf?.subtitle ||
            '서버 업로드 없이 100% 브라우저 내부에서 안전하고 빠르게 HWP 및 HWPX 한글 문서를 PDF로 변환합니다.'}
        </p>
      </header>

      {!file && (
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
            {(t as any).hwp2pdf?.dropText ||
              'PDF로 변환할 HWP 또는 HWPX 파일을 이곳에 드래그하거나 클릭하세요'}
          </h2>
          <p className={styles.subText}>
            {(t as any).hwp2pdf?.subText ||
              '표, 이미지, 본문 텍스트가 모두 보존되어 안전하게 내 컴퓨터에서 바로 변환됩니다.'}
          </p>
          <button className={styles.selectBtn} type="button">
            {(t as any).hwp2pdf?.selectBtn || 'HWP / HWPX 파일 선택'}
          </button>
          <input
            type="file"
            accept=".hwp,.hwpx"
            ref={fileInputRef}
            className={styles.hiddenInput}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />
        </div>
      )}

      {file && (
        <div className={styles.workspace}>
          <div className={styles.controlsBar}>
            <div className={styles.fileSummary}>
              <span className={styles.fileName}>
                <IoDocumentTextOutline className="inline mr-1 text-blue-400" />
                {file.name}
              </span>
              <span className={styles.fileSize}>
                ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>

            <button className={styles.newFileBtn} onClick={resetState}>
              <IoRefreshOutline /> {(t as any).hwp2pdf?.newFile || '새 파일'}
            </button>
          </div>

          {isConverting && (
            <div className={styles.progressContainer}>
              <p className={styles.progressText}>
                🔄 HWP 문서 구조 분석 및 PDF 변환 중...
                {progress.total > 0 ? ` (${progress.current} / ${progress.total})` : ''}
              </p>
              <div className={styles.progressBarBg}>
                <div
                  className={styles.progressBarFill}
                  style={{
                    width: `${
                      progress.total ? (progress.current / progress.total) * 100 : 50
                    }%`,
                  }}
                />
              </div>
            </div>
          )}

          {convertedBlob && !isConverting && (
            <div className="bg-[#1e1f20] border border-white/10 rounded-2xl p-8 text-center my-6 shadow-2xl">
              <IoCheckmarkCircleOutline className="text-6xl text-emerald-400 mx-auto mb-4 animate-bounce" />
              <h3 className="text-xl font-bold text-gray-100 mb-2">
                {(t as any).hwp2pdf?.successText || '✅ PDF 문서 변환이 완료되었습니다!'}
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                서버 전송 없이 100% 브라우저 내부에서 안전하게 생성된 PDF 파일입니다.
              </p>

              <button
                onClick={handleDownload}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-base transition-all shadow-lg inline-flex items-center gap-3 cursor-pointer"
              >
                <IoDownloadOutline size={22} />
                <span>{(t as any).hwp2pdf?.downloadBtn || 'PDF 파일 다운로드'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
