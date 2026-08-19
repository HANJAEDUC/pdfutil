"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './PdfPagesClient.module.css';
import { useLanguage } from '@/lib/LanguageContext';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  IoCloudUploadOutline,
  IoShieldCheckmarkOutline,
  IoDownloadOutline,
  IoCheckmarkCircleOutline,
  IoDocumentTextOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
} from 'react-icons/io5';

type NumberFormat = 'ratio' | 'pageOf' | 'number' | 'dash';
type NumberPosition =
  | 'bottomCenter'
  | 'bottomRight'
  | 'bottomLeft'
  | 'topCenter'
  | 'topRight'
  | 'topLeft';

interface ColorOption {
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
}

const COLOR_OPTIONS: ColorOption[] = [
  { name: 'Dark', hex: '#1f2937', rgb: { r: 31 / 255, g: 41 / 255, b: 55 / 255 } },
  { name: 'Gray', hex: '#6b7280', rgb: { r: 107 / 255, g: 114 / 255, b: 128 / 255 } },
  { name: 'Blue', hex: '#3b82f6', rgb: { r: 59 / 255, g: 130 / 255, b: 246 / 255 } },
  { name: 'Red', hex: '#ef4444', rgb: { r: 239 / 255, g: 68 / 255, b: 68 / 255 } },
  { name: 'White', hex: '#ffffff', rgb: { r: 1, g: 1, b: 1 } },
];

export default function PdfPagesClient() {
  const { lang, t } = useLanguage();
  const tPages = (t as any).pdfpages || {};

  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [previewPageIndex, setPreviewPageIndex] = useState(0);

  // Settings
  const [format, setFormat] = useState<NumberFormat>('ratio');
  const [position, setPosition] = useState<NumberPosition>('bottomCenter');
  const [margin, setMargin] = useState<number>(20); // distance from edge in pt
  const [fontSize, setFontSize] = useState<number>(12); // pt
  const [selectedColor, setSelectedColor] = useState<ColorOption>(COLOR_OPTIONS[0]);
  const [startNumber, setStartNumber] = useState<number>(1);
  const [skipFirstPage, setSkipFirstPage] = useState<boolean>(false);

  // Export State
  const [applying, setApplying] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfPageCanvasRef = useRef<HTMLCanvasElement | null>(null);

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
          reject(new Error('PDF.js failed to initialize'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load PDF.js'));
      document.head.appendChild(script);
    });
  };

  const formatPageText = (pageNum: number, total: number, fmt: NumberFormat): string => {
    if (fmt === 'pageOf') return `Page ${pageNum} of ${total}`;
    if (fmt === 'number') return `${pageNum}`;
    if (fmt === 'dash') return `- ${pageNum} -`;
    return `${pageNum} / ${total}`;
  };

  const renderPreview = useCallback((overridePageCount?: number) => {
    const canvas = previewCanvasRef.current;
    const bgCanvas = pdfPageCanvasRef.current;
    const totalCount = overridePageCount ?? pageCount;
    if (!canvas || !bgCanvas || totalCount === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = bgCanvas.width;
    canvas.height = bgCanvas.height;

    // Fill solid white paper background before drawing
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw PDF page background
    ctx.drawImage(bgCanvas, 0, 0);

    // Check skip first page
    if (skipFirstPage && previewPageIndex === 0) return;

    const displayNum = startNumber + (skipFirstPage ? previewPageIndex - 1 : previewPageIndex);
    const text = formatPageText(displayNum, totalCount, format);

    ctx.save();
    // Scale font size to canvas render resolution
    const scale = canvas.height / 842; // approx A4 height ratio
    const renderFontSize = Math.max(10, fontSize * scale);
    ctx.font = `${renderFontSize}px Helvetica, sans-serif`;
    ctx.fillStyle = selectedColor.hex;
    ctx.textBaseline = position.startsWith('top') ? 'top' : 'bottom';

    const w = canvas.width;
    const h = canvas.height;
    const marginPx = margin * scale;

    let x = w / 2;
    ctx.textAlign = 'center';

    if (position.includes('Right')) {
      x = w - marginPx;
      ctx.textAlign = 'right';
    } else if (position.includes('Left')) {
      x = marginPx;
      ctx.textAlign = 'left';
    }

    let y = h - marginPx;
    if (position.startsWith('top')) {
      y = marginPx;
    }

    ctx.fillText(text, x, y);
    ctx.restore();
  }, [
    pageCount,
    previewPageIndex,
    skipFirstPage,
    startNumber,
    format,
    fontSize,
    selectedColor,
    position,
    margin,
  ]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  const loadPdfPreviewPage = async (selectedFile: File, pageIdx: number) => {
    try {
      const pdfjsLib = await getPdfJsLib();
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const numPages = pdf.numPages;
      setPageCount(numPages);
      const targetPageNum = Math.min(Math.max(1, pageIdx + 1), numPages);
      const page = await pdf.getPage(targetPageNum);

      const viewport = page.getViewport({ scale: 1.5 });
      const bgCanvas = document.createElement('canvas');
      bgCanvas.width = Math.floor(viewport.width);
      bgCanvas.height = Math.floor(viewport.height);
      const bgCtx = bgCanvas.getContext('2d');

      if (bgCtx) {
        bgCtx.fillStyle = '#ffffff';
        bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
        await page.render({ canvasContext: bgCtx, viewport }).promise;
        pdfPageCanvasRef.current = bgCanvas;
        renderPreview(numPages);
      }
    } catch (err) {
      console.error('Error loading PDF preview:', err);
    }
  };

  const processPdfFile = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      alert(lang === 'ko' ? 'PDF 파일만 선택 가능합니다.' : 'Please select a valid PDF file.');
      return;
    }

    setFile(selectedFile);
    setLoading(true);
    setDownloadUrl(null);
    setDownloaded(false);
    setPreviewPageIndex(0);

    try {
      await loadPdfPreviewPage(selectedFile, 0);
    } catch (err) {
      console.error('File load error:', err);
      alert(tPages.errorMsg || 'PDF 파일을 로드하는 도중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (newIdx: number) => {
    if (!file || newIdx < 0 || newIdx >= pageCount) return;
    setPreviewPageIndex(newIdx);
    await loadPdfPreviewPage(file, newIdx);
  };

  const sanitizeWinAnsiText = (text: string): string => {
    return text.replace(/[^\x00-\x7F]/g, '');
  };

  const handleApplyPageNumbers = async () => {
    if (!file) return;

    setApplying(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      let pdfDoc: PDFDocument;

      try {
        // Tier 1: Try loading unencrypted vector PDF
        pdfDoc = await PDFDocument.load(arrayBuffer);
      } catch (err1) {
        // Tier 2: Render encrypted/protected PDF pages via PDF.js canvas with white background
        const pdfjsLib = await getPdfJsLib();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        pdfDoc = await PDFDocument.create();

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 });
          const unscaledViewport = page.getViewport({ scale: 1.0 });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvasContext: ctx, viewport }).promise;

            const imgDataUrl = canvas.toDataURL('image/jpeg', 0.90);
            const imgBytes = await fetch(imgDataUrl).then((r) => r.arrayBuffer());
            const embeddedImg = await pdfDoc.embedJpg(imgBytes);

            const pageW = unscaledViewport.width;
            const pageH = unscaledViewport.height;
            const newPage = pdfDoc.addPage([pageW, pageH]);
            newPage.drawImage(embeddedImg, {
              x: 0,
              y: 0,
              width: pageW,
              height: pageH,
            });
          }
        }
      }

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;

      pages.forEach((page, index) => {
        if (skipFirstPage && index === 0) return;

        const displayNum = startNumber + (skipFirstPage ? index - 1 : index);
        const rawText = formatPageText(displayNum, totalPages, format);
        const text = sanitizeWinAnsiText(rawText);

        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        const { width, height } = page.getSize();

        let x = (width - textWidth) / 2;
        let y = margin;

        if (position.includes('Right')) {
          x = width - margin - textWidth;
        } else if (position.includes('Left')) {
          x = margin;
        }

        if (position.startsWith('top')) {
          y = height - margin - textHeight;
        }

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(selectedColor.rgb.r, selectedColor.rgb.g, selectedColor.rgb.b),
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);
      setDownloaded(true);
    } catch (err: any) {
      console.error('Page number application error:', err);
      const detail = err?.message || String(err);
      alert((tPages.errorMsg || 'PDF에 페이지 번호를 적용하는 도중 오류가 발생했습니다.') + '\n: ' + detail);
    } finally {
      setApplying(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setPageCount(0);
    setDownloaded(false);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
  };

  return (
    <div className={styles.container}>
      {/* Header Banner */}
      <div className={styles.header}>
        <div className={styles.badgeTitle}>
          {tPages.badge || 'Browser-based PDF Page Numbering'}
        </div>
        <h1 className={styles.title}>{tPages.title || 'PDF 🔢 페이지 번호 추가'}</h1>
        <p className={styles.subtitle}>
          {tPages.subtitle ||
            '서버 업로드 없이 100% 내 브라우저 내부에서 PDF 문서에 원하는 형태(1/5, Page 1 of 5 등)로 페이지 번호를 자동으로 합성합니다.'}
        </p>

        <div className={styles.privacyBanner}>
          <IoShieldCheckmarkOutline size={18} />
          <span>100% Client-Side Privacy Protection — Zero Server Upload</span>
        </div>
      </div>

      {/* Upload Dropzone */}
      {!file && (
        <div
          className={`${styles.dropzone} ${isDragOver ? styles.dropzoneActive : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files?.[0]) processPdfFile(e.dataTransfer.files[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <IoCloudUploadOutline size={64} className={styles.uploadIcon} />
          <h3 className={styles.dropText}>
            {tPages.dropText || '페이지 번호를 추가할 PDF 파일을 이곳에 드래그하거나 클릭하세요'}
          </h3>
          <p className={styles.subText}>
            {tPages.subText || '파일 크기 제한 없이 내 컴퓨터에서 안전하게 처리됩니다.'}
          </p>
          <button type="button" className={styles.selectBtn}>
            {tPages.selectBtn || 'PDF 파일 선택'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className={styles.fileInput}
            onChange={(e) => e.target.files?.[0] && processPdfFile(e.target.files[0])}
          />
        </div>
      )}

      {/* Main Editor Section */}
      {file && !downloaded && (
        <div className={styles.editorGrid}>
          {/* Left Panel: Real-Time Preview */}
          <div className={styles.card}>
            <div className={styles.fileHeader}>
              <div>
                <div className={styles.fileName}>{file.name}</div>
                <div className={styles.fileMeta}>총 {pageCount}페이지</div>
              </div>
              <button type="button" className={styles.changeFileBtn} onClick={resetAll}>
                다른 파일 선택
              </button>
            </div>

            <div className={styles.previewWrapper}>
              <canvas ref={previewCanvasRef} className={styles.previewCanvas} />

              {pageCount > 1 && (
                <div className={styles.pageNav}>
                  <button
                    type="button"
                    className={styles.pageNavBtn}
                    disabled={previewPageIndex === 0}
                    onClick={() => handlePageChange(previewPageIndex - 1)}
                  >
                    <IoChevronBackOutline size={14} />
                  </button>
                  <span className={styles.pageNavText}>
                    {previewPageIndex + 1} / {pageCount} 페이지
                  </span>
                  <button
                    type="button"
                    className={styles.pageNavBtn}
                    disabled={previewPageIndex === pageCount - 1}
                    onClick={() => handlePageChange(previewPageIndex + 1)}
                  >
                    <IoChevronForwardOutline size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Settings Controls */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <span>{tPages.sectionOptions || '페이지 번호 옵션 및 위치 설정'}</span>
            </div>

            {/* Format Selection */}
            <div className={styles.formGroup}>
              <label className={styles.label}>{tPages.formatLabel || '페이지 번호 표기 형식'}</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as NumberFormat)}
                className={styles.select}
              >
                <option value="ratio">1 / {pageCount || 'N'} (현재 / 전체)</option>
                <option value="pageOf">Page 1 of {pageCount || 'N'} (Page X of Y)</option>
                <option value="number">1 (숫자만)</option>
                <option value="dash">- 1 - (대시 포함)</option>
              </select>
            </div>

            {/* Position Selection */}
            <div className={styles.formGroup}>
              <label className={styles.label}>{tPages.posLabel || '페이지 번호 위치'}</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as NumberPosition)}
                className={styles.select}
              >
                <option value="bottomCenter">{tPages.posBottomCenter || '하단 중앙 (Center Bottom)'}</option>
                <option value="bottomRight">{tPages.posBottomRight || '하단 우측 (Right Bottom)'}</option>
                <option value="bottomLeft">{tPages.posBottomLeft || '하단 좌측 (Left Bottom)'}</option>
                <option value="topCenter">{tPages.posTopCenter || '상단 중앙 (Center Top)'}</option>
                <option value="topRight">{tPages.posTopRight || '상단 우측 (Right Top)'}</option>
                <option value="topLeft">{tPages.posTopLeft || '상단 좌측 (Left Top)'}</option>
              </select>
            </div>

            {/* Margin (Distance from edge) */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                {tPages.marginLabel || '여백 (상/하 간격)'}: {margin}pt
              </label>
              <input
                type="range"
                min="10"
                max="60"
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Font Size */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                {tPages.fontSizeLabel || '글자 크기'}: {fontSize}pt
              </label>
              <input
                type="range"
                min="9"
                max="24"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Text Color */}
            <div className={styles.formGroup}>
              <label className={styles.label}>{tPages.colorLabel || '글자 색상'}</label>
              <div className={styles.colorGrid}>
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    className={`${styles.colorSwatch} ${
                      selectedColor.name === c.name ? styles.colorSwatchActive : ''
                    }`}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => setSelectedColor(c)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Start Number & Options */}
            <div className={styles.formGroup}>
              <label className={styles.label}>{tPages.startPageLabel || '시작 번호'}</label>
              <input
                type="number"
                min="1"
                value={startNumber}
                onChange={(e) => setStartNumber(Math.max(1, Number(e.target.value)))}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={skipFirstPage}
                  onChange={(e) => setSkipFirstPage(e.target.checked)}
                />
                <span>{tPages.skipFirstLabel || '첫 페이지(표지) 번호 제외'}</span>
              </label>
            </div>

            {/* Apply Button */}
            <button
              type="button"
              className={styles.applyBtn}
              onClick={handleApplyPageNumbers}
              disabled={applying}
            >
              {applying
                ? tPages.applying || '페이지 번호 합성 중...'
                : tPages.applyBtn || '🔢 페이지 번호 적용하고 다운로드 ➔'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success Screen */}
      {downloaded && downloadUrl && (
        <div className={styles.successCard}>
          <IoCheckmarkCircleOutline className={styles.successIcon} />
          <h2 className={styles.successTitle}>{tPages.successTitle || '✅ 페이지 번호 추가 완료!'}</h2>
          <p className={styles.successSub}>
            {tPages.successSub || '아래 버튼을 눌러 번호가 추가된 새 PDF 문서를 다운로드하세요.'}
          </p>

          <a
            href={downloadUrl}
            download={`${file?.name.replace('.pdf', '')}_numbered.pdf`}
            className={styles.downloadBtn}
          >
            <IoDownloadOutline size={22} />
            <span>{tPages.downloadBtn || '번호 포함된 PDF 다운로드'}</span>
          </a>

          <button className={styles.resetBtn} onClick={resetAll} type="button">
            {tPages.newFile || '새 파일 작업'}
          </button>
        </div>
      )}
    </div>
  );
}
