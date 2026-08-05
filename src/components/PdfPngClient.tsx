"use client";

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import styles from './PdfPngClient.module.css';
import { useLanguage } from '@/lib/LanguageContext';
import {
  IoCloudUploadOutline,
  IoDownloadOutline,
  IoShieldCheckmarkOutline,
  IoDocumentTextOutline,
  IoRefreshOutline,
  IoGridOutline,
  IoLayersOutline,
  IoCloseOutline,
  IoSearchOutline,
} from 'react-icons/io5';
import JSZip from 'jszip';

interface PageResult {
  pageIndex: number;
  dataUrl: string;
  width: number;
  height: number;
}

export default function PdfPngClient() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [scale, setScale] = useState<number>(2.0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [pages, setPages] = useState<PageResult[]>([]);
  const [outputMode, setOutputMode] = useState<'separate' | 'merged'>('separate');
  const [mergedDataUrl, setMergedDataUrl] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [previewPage, setPreviewPage] = useState<{ dataUrl: string; pageIndex: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      script.onerror = () => reject(new Error('Failed to load PDF.js script from CDN'));
      document.head.appendChild(script);
    });
  };

  const generateMergedPng = async (pageList: PageResult[]): Promise<string | null> => {
    if (pageList.length === 0) return null;
    if (pageList.length === 1) return pageList[0].dataUrl;

    setIsMerging(true);
    try {
      const maxWidth = Math.max(...pageList.map((p) => p.width));
      const totalHeight = pageList.reduce((sum, p) => sum + p.height, 0);

      const canvas = document.createElement('canvas');
      canvas.width = maxWidth;
      canvas.height = totalHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) return null;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, maxWidth, totalHeight);

      let currentY = 0;
      for (const page of pageList) {
        const img = new Image();
        img.src = page.dataUrl;
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
        });
        ctx.drawImage(img, 0, currentY, page.width, page.height);
        currentY += page.height;
      }

      return canvas.toDataURL('image/png');
    } catch (err) {
      console.error('Failed to generate merged PNG image:', err);
      return null;
    } finally {
      setIsMerging(false);
    }
  };

  const processPdf = async (pdfFile: File, renderScale: number, passwordInput?: string) => {
    setLoading(true);
    setPages([]);
    setMergedDataUrl(null);
    setPreviewPage(null);
    setProgress({ current: 0, total: 0 });

    try {
      const pdfjsLib = await getPdfJsLib();
      const arrayBuffer = await pdfFile.arrayBuffer();

      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        password: passwordInput,
      });

      loadingTask.onPassword = (updatePassword: (pw: string) => void, reason: number) => {
        const userPw = prompt(
          reason === 1
            ? '🔒 Password required:'
            : '❌ Incorrect password. Please try again:'
        );
        if (userPw !== null) {
          updatePassword(userPw);
        } else {
          setLoading(false);
        }
      };

      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;

      setProgress({ current: 0, total: numPages });
      const convertedPages: PageResult[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: renderScale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };
          await page.render(renderContext as any).promise;

          // Export as PNG format
          const dataUrl = canvas.toDataURL('image/png');
          convertedPages.push({
            pageIndex: i,
            dataUrl: dataUrl,
            width: viewport.width,
            height: viewport.height,
          });
        }

        setProgress({ current: i, total: numPages });
      }

      setPages(convertedPages);

      if (convertedPages.length >= 2) {
        const merged = await generateMergedPng(convertedPages);
        setMergedDataUrl(merged);
      }
    } catch (error: any) {
      console.error('Error processing PDF to PNG:', error);
      if (error?.name !== 'PasswordException') {
        alert(`Error converting PDF to PNG: ${error?.message || 'Please try another file.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      processPdf(selectedFile, scale);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf' || droppedFile.name.endsWith('.pdf')) {
        setFile(droppedFile);
        processPdf(droppedFile, scale);
      } else {
        alert('Please drop a valid PDF file.');
      }
    }
  };

  const handleScaleChange = (newScale: number) => {
    setScale(newScale);
    if (file) {
      processPdf(file, newScale);
    }
  };

  const handleDownloadSingle = (page: PageResult) => {
    if (!file) return;
    const baseName = file.name.replace(/\.pdf$/i, '');
    const link = document.createElement('a');
    link.href = page.dataUrl;
    link.download = `${baseName}_page_${page.pageIndex}.png`;
    link.click();
  };

  const handleDownloadZip = async () => {
    if (!file || pages.length === 0) return;
    const zip = new JSZip();
    const baseName = file.name.replace(/\.pdf$/i, '');

    pages.forEach((page) => {
      const base64Data = page.dataUrl.replace(/^data:image\/png;base64,/, '');
      zip.file(`${baseName}_page_${page.pageIndex}.png`, base64Data, { base64: true });
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `${baseName}_png_pages.zip`;
    link.click();
  };

  const handleReset = () => {
    setFile(null);
    setPages([]);
    setMergedDataUrl(null);
    setPreviewPage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const p = (t as any).pdfpng || {
    badge: 'Lossless PDF ➡️ PNG Converter',
    title: 'PDF ➡️ PNG 이미지 변환',
    subtitle: '서버 업로드 없이 100% 브라우저 내부에서 안전하고 빠르게 PDF 문서를 고화질 무손실 PNG 이미지로 전환합니다.',
    dropText: 'PNG로 변환할 PDF 파일을 이곳에 드래그하거나 클릭하세요',
    subText: '파일 크기 및 용량 제한 없이 완전 무료로 이용 가능합니다.',
    selectBtn: 'PDF 파일 선택',
    dpiLabel: '이미지 해상도 (품질) 선택',
    dpiNormal: '기본 화질 (1.5x)',
    dpiHigh: '고화질 (2.0x 추천)',
    dpiUltra: '초고화질 (3.0x Ultra HD)',
    modeSeparate: '개별 페이지 PNG',
    modeMerged: 'N개 페이지 세로 1장 통합 PNG',
    summaryText: '총 {count}개 페이지 변환 완료',
    downloadZip: '전체 페이지 ZIP 압축 다운로드 (.zip)',
    downloadMerged: '통합 1장 PNG 다운로드 (.png)',
    downloadSingle: 'PNG 저장',
    pageLabel: '{page}페이지',
    reset: '새 파일 작업',
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.badgeTitle}>{p.badge}</span>
        <h1 className={styles.title}>{p.title}</h1>
        <p className={styles.subtitle}>{p.subtitle}</p>
      </header>

      {/* Privacy Banner */}
      <div className={styles.privacyBanner}>
        <IoShieldCheckmarkOutline size={20} />
        <span>{t.privacy?.banner || '100% 개인정보 안전: 모든 파일 처리가 내 컴퓨터 브라우저 내부에서 바로 진행됩니다.'}</span>
      </div>

      {/* Empty Dropzone */}
      {!file && (
        <div
          className={`${styles.dropzone} ${isDragOver ? styles.dropzoneActive : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <IoCloudUploadOutline size={64} className={styles.uploadIcon} />
          <div className={styles.dropText}>{p.dropText}</div>
          <div className={styles.subText}>{p.subText}</div>
          <button className={styles.selectBtn}>{p.selectBtn}</button>
          <input
            type="file"
            accept=".pdf,application/pdf"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Processing State */}
      {loading && (
        <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
          <IoRefreshOutline size={48} className="animate-spin text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            PDF를 고화질 PNG 이미지로 변환하는 중...
          </h3>
          <p className="text-gray-400 font-medium">
            {progress.current} / {progress.total} 페이지 완료
          </p>
        </div>
      )}

      {/* Results Workspace */}
      {!loading && pages.length > 0 && (
        <div>
          {/* Options: Scale selector */}
          <div className={styles.optionSection}>
            <div className={styles.optionTitle}>⚙️ {p.dpiLabel}</div>
            <div className={styles.scaleGrid}>
              <button
                onClick={() => handleScaleChange(1.5)}
                className={`${styles.scaleBtn} ${scale === 1.5 ? styles.scaleActive : ''}`}
              >
                {p.dpiNormal}
              </button>
              <button
                onClick={() => handleScaleChange(2.0)}
                className={`${styles.scaleBtn} ${scale === 2.0 ? styles.scaleActive : ''}`}
              >
                {p.dpiHigh}
              </button>
              <button
                onClick={() => handleScaleChange(3.0)}
                className={`${styles.scaleBtn} ${scale === 3.0 ? styles.scaleActive : ''}`}
              >
                {p.dpiUltra}
              </button>
            </div>
          </div>

          {/* Mode Selector */}
          <div className={styles.modeToggle}>
            <button
              onClick={() => setOutputMode('separate')}
              className={`${styles.modeBtn} ${outputMode === 'separate' ? styles.modeActive : ''}`}
            >
              <IoGridOutline size={18} />
              {p.modeSeparate} ({pages.length})
            </button>
            <button
              onClick={() => setOutputMode('merged')}
              className={`${styles.modeBtn} ${outputMode === 'merged' ? styles.modeActive : ''}`}
            >
              <IoLayersOutline size={18} />
              {p.modeMerged}
            </button>
          </div>

          {/* Action Header */}
          <div className={styles.actionHeader}>
            <div className={styles.summaryText}>
              📄 {file?.name} — {p.summaryText.replace('{count}', String(pages.length))}
            </div>

            <div className={styles.btnGroup}>
              {outputMode === 'separate' ? (
                <button onClick={handleDownloadZip} className={styles.downloadZipBtn}>
                  <IoDownloadOutline size={18} />
                  {p.downloadZip}
                </button>
              ) : (
                mergedDataUrl && (
                  <a
                    href={mergedDataUrl}
                    download={`${file?.name.replace(/\.pdf$/i, '')}_merged.png`}
                    className={styles.downloadZipBtn}
                  >
                    <IoDownloadOutline size={18} />
                    {p.downloadMerged}
                  </a>
                )
              )}

              <button onClick={handleReset} className={styles.resetBtn}>
                <IoRefreshOutline size={16} />
                {p.reset}
              </button>
            </div>
          </div>

          {/* Page Grid view vs Merged view */}
          {outputMode === 'separate' ? (
            <div className={styles.pagesGrid}>
              {pages.map((page) => (
                <div key={page.pageIndex} className={styles.pageCard}>
                  <div
                    className={styles.imgWrapper}
                    onClick={() => setPreviewPage({ dataUrl: page.dataUrl, pageIndex: page.pageIndex })}
                  >
                    <img src={page.dataUrl} alt={`Page ${page.pageIndex}`} className={styles.pageImg} />
                  </div>
                  <div className={styles.pageFooter}>
                    <span className={styles.pageBadge}>{p.pageLabel.replace('{page}', String(page.pageIndex))}</span>
                    <button
                      onClick={() => handleDownloadSingle(page)}
                      className={styles.singleDownloadBtn}
                    >
                      <IoDownloadOutline size={14} />
                      {p.downloadSingle}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.mergedBox}>
              {isMerging ? (
                <div className="py-12 text-gray-400">
                  <IoRefreshOutline size={32} className="animate-spin mx-auto mb-2 text-blue-500" />
                  1장 통합 PNG 이미지를 생성 중입니다...
                </div>
              ) : mergedDataUrl ? (
                <div>
                  <img src={mergedDataUrl} alt="Merged Pages" className={styles.mergedImg} />
                  <div className="mt-4">
                    <a
                      href={mergedDataUrl}
                      download={`${file?.name.replace(/\.pdf$/i, '')}_merged.png`}
                      className={styles.downloadZipBtn + ' inline-flex'}
                    >
                      <IoDownloadOutline size={18} />
                      {p.downloadMerged}
                    </a>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Modal Preview */}
      {previewPage && (
        <div className={styles.modalOverlay} onClick={() => setPreviewPage(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewPage(null)} className={styles.closeModalBtn}>
              <IoCloseOutline size={22} />
            </button>
            <img src={previewPage.dataUrl} alt="Page Preview" className={styles.modalImg} />
            <div className="text-white mt-3 font-semibold">
              {p.pageLabel.replace('{page}', String(previewPage.pageIndex))} (PNG)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
