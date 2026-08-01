"use client";

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import styles from './PdfConverterClient.module.css';
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

export default function PdfConverterClient() {
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
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve(pdfjsLib);
        } else {
          reject(new Error('PDF.js library failed to initialize'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load PDF.js script from CDN'));
      document.head.appendChild(script);
    });
  };

  const generateMergedImage = async (pageList: PageResult[]): Promise<string | null> => {
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

      return canvas.toDataURL('image/jpeg', 0.92);
    } catch (err) {
      console.error('Failed to generate merged image:', err);
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

          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
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
        const merged = await generateMergedImage(convertedPages);
        setMergedDataUrl(merged);
      }
    } catch (error: any) {
      console.error('Error processing PDF:', error);
      if (error?.name !== 'PasswordException') {
        alert(`Error converting PDF: ${error?.message || 'Please try another file.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf')) {
        setFile(selectedFile);
        processPdf(selectedFile, scale);
      } else {
        alert('Please upload PDF files only.');
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
        processPdf(droppedFile, scale);
      } else {
        alert('Please upload PDF files only.');
      }
    }
  };

  const handleScaleChange = (newScale: number) => {
    setScale(newScale);
    if (file) {
      processPdf(file, newScale);
    }
  };

  const downloadSinglePage = (page: PageResult) => {
    const link = document.createElement('a');
    link.href = page.dataUrl;
    const baseName = file ? file.name.replace(/\.pdf$/i, '') : 'document';
    const total = pages.length;
    link.download = `${baseName}_${page.pageIndex}of${total}.jpg`;
    link.click();
  };

  const downloadAllAsZip = async () => {
    if (pages.length === 0) return;

    const zip = new JSZip();
    const baseName = file ? file.name.replace(/\.pdf$/i, '') : 'document';
    const total = pages.length;

    pages.forEach((p) => {
      const base64Data = p.dataUrl.replace(/^data:image\/jpeg;base64,/, '');
      zip.file(`${baseName}_${p.pageIndex}of${total}.jpg`, base64Data, { base64: true });
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `${baseName}_nof${total}.zip`;
    link.click();
  };

  const downloadMergedImage = () => {
    if (!mergedDataUrl) return;
    const link = document.createElement('a');
    link.href = mergedDataUrl;
    const baseName = file ? file.name.replace(/\.pdf$/i, '') : 'document';
    const total = pages.length;
    link.download = `${baseName}_nof${total}.jpg`;
    link.click();
  };

  const handleReset = () => {
    setFile(null);
    setPages([]);
    setMergedDataUrl(null);
    setPreviewPage(null);
    setOutputMode('separate');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.badgeTitle}>{t.badge}</span>
        <h1 className={styles.title}>{t.pdf2jpg.title}</h1>
        <p className={styles.subtitle}>{t.pdf2jpg.subtitle}</p>
      </header>

      {/* Privacy Banner */}
      <div className={styles.privacyBanner}>
        <IoShieldCheckmarkOutline size={20} />
        <span>{t.privacy.banner}</span>
      </div>

      {/* Dropzone */}
      {!file && (
        <div
          className={`${styles.dropzone} ${isDragOver ? styles.dropzoneActive : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <IoCloudUploadOutline size={54} className={styles.uploadIcon} />
          <div className={styles.dropText}>{t.pdf2jpg.dropText}</div>
          <div className={styles.subText}>{t.pdf2jpg.subText}</div>
          <button className={styles.selectBtn}>{t.pdf2jpg.selectBtn}</button>
          <input
            type="file"
            accept=".pdf,application/pdf"
            ref={fileInputRef}
            onChange={handleFileChange}
            className={styles.hiddenInput}
          />
        </div>
      )}

      {/* Options Bar & Actions */}
      {file && (
        <div className={styles.optionsBar}>
          <div className={styles.fileInfo}>
            <IoDocumentTextOutline size={22} color="#4285f4" />
            <span>{file.name} ({pages.length} {t.pdf2jpg.pageLabel})</span>
          </div>

          <div className={styles.optionsRight}>
            <div className={styles.qualitySelect}>
              <span>{t.pdf2jpg.qualityLabel}</span>
              <select
                className={styles.selectInput}
                value={scale}
                onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                disabled={loading}
              >
                <option value={1.5}>{t.pdf2jpg.qualityNormal}</option>
                <option value={2.0}>{t.pdf2jpg.qualityHigh}</option>
                <option value={3.0}>{t.pdf2jpg.qualitySuper}</option>
              </select>
            </div>

            {pages.length > 0 && outputMode === 'separate' && (
              <button className={styles.zipBtn} onClick={downloadAllAsZip}>
                <IoDownloadOutline size={18} />
                {t.pdf2jpg.downloadZip.replace('{count}', String(pages.length))}
              </button>
            )}

            {pages.length > 0 && outputMode === 'merged' && mergedDataUrl && (
              <button className={styles.mergedDlTopBtn} onClick={downloadMergedImage}>
                <IoDownloadOutline size={18} />
                {t.pdf2jpg.downloadMergedTop}
              </button>
            )}

            <button className={styles.resetBtn} onClick={handleReset}>
              <IoRefreshOutline size={16} />
              {t.pdf2jpg.newFile}
            </button>
          </div>
        </div>
      )}

      {/* Output Mode Switcher for Multi-page PDFs */}
      {file && pages.length >= 2 && !loading && (
        <div className={styles.modeSection}>
          <div className={styles.modeLabel}>{t.pdf2jpg.modeSectionLabel}</div>
          <div className={styles.modeSwitcher}>
            <button
              className={`${styles.modeBtn} ${outputMode === 'separate' ? styles.modeBtnActive : ''}`}
              onClick={() => setOutputMode('separate')}
            >
              <IoGridOutline size={18} />
              <span>{t.pdf2jpg.modeSeparate.replace('{count}', String(pages.length))}</span>
            </button>

            <button
              className={`${styles.modeBtn} ${outputMode === 'merged' ? styles.modeBtnActive : ''}`}
              onClick={() => setOutputMode('merged')}
            >
              <IoLayersOutline size={18} />
              <span>{t.pdf2jpg.modeMerged}</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading Progress */}
      {loading && (
        <div className={styles.progressContainer}>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>
            {t.pdf2jpg.renderingProgress.replace('{current}', String(progress.current)).replace('{total}', String(progress.total))}
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%',
              }}
            />
          </div>
        </div>
      )}

      {/* Converted Pages Grid (Separate Mode or 1-page PDF) */}
      {!loading && pages.length > 0 && (outputMode === 'separate' || pages.length === 1) && (
        <div className={styles.grid}>
          {pages.map((p) => (
            <div key={p.pageIndex} className={styles.pageCard}>
              <div
                className={styles.imgWrapper}
                onClick={() => setPreviewPage({ dataUrl: p.dataUrl, pageIndex: p.pageIndex })}
                title={t.pdf2jpg.zoomIn}
              >
                <img src={p.dataUrl} alt={`Page ${p.pageIndex}`} className={styles.pageImg} />
                <div className={styles.zoomHoverOverlay}>
                  <IoSearchOutline size={26} />
                  <span>{t.pdf2jpg.zoomIn}</span>
                </div>
              </div>
              <div className={styles.pageFooter}>
                <span className={styles.pageNumber}>{p.pageIndex} {t.pdf2jpg.pageLabel}</span>
                <button
                  className={styles.dlSingleBtn}
                  onClick={() => downloadSinglePage(p)}
                >
                  <IoDownloadOutline size={16} />
                  {t.pdf2jpg.downloadJpg}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Merged Single Image Mode (Multi-page PDF) */}
      {!loading && pages.length >= 2 && outputMode === 'merged' && (
        <div className={styles.mergedCard}>
          {isMerging ? (
            <div className={styles.mergingStatus}>{t.pdf2jpg.mergingStatus}</div>
          ) : mergedDataUrl ? (
            <>
              <div className={styles.mergedHeader}>
                <div className={styles.mergedTitleGroup}>
                  <IoLayersOutline size={22} color="#4285f4" />
                  <div>
                    <h3 className={styles.mergedTitle}>
                      {t.pdf2jpg.mergedTitle.replace('{count}', String(pages.length))}
                    </h3>
                    <p className={styles.mergedSub}>{t.pdf2jpg.mergedSub}</p>
                  </div>
                </div>
                <button className={styles.mergedDlMainBtn} onClick={downloadMergedImage}>
                  <IoDownloadOutline size={20} />
                  {t.pdf2jpg.downloadMergedMain}
                </button>
              </div>
              <div
                className={styles.mergedImgWrapper}
                onClick={() => setPreviewPage({ dataUrl: mergedDataUrl, pageIndex: 0 })}
                title={t.pdf2jpg.zoomIn}
              >
                <img src={mergedDataUrl} alt="Merged PDF pages" className={styles.mergedImg} />
              </div>
            </>
          ) : (
            <div className={styles.mergingStatus}>{t.pdf2jpg.cannotMerge}</div>
          )}
        </div>
      )}

      {/* Image Preview Lightbox Modal */}
      {previewPage && (
        <div className={styles.modalOverlay} onClick={() => setPreviewPage(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                {previewPage.pageIndex === 0
                  ? t.pdf2jpg.modalTitleMerged
                  : t.pdf2jpg.modalTitleSeparate
                      .replace('{filename}', file?.name ? `${file.name} — ` : '')
                      .replace('{page}', String(previewPage.pageIndex))}
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.modalDlBtn}
                  onClick={() => {
                    if (previewPage.pageIndex === 0) {
                      downloadMergedImage();
                    } else {
                      const targetPage = pages.find((p) => p.pageIndex === previewPage.pageIndex);
                      if (targetPage) downloadSinglePage(targetPage);
                    }
                  }}
                >
                  <IoDownloadOutline size={18} />
                  {t.pdf2jpg.modalDownload}
                </button>
                <button
                  className={styles.modalCloseBtn}
                  onClick={() => setPreviewPage(null)}
                  aria-label={t.pdf2jpg.close}
                >
                  <IoCloseOutline size={24} />
                </button>
              </div>
            </div>
            <div className={styles.modalBody}>
              <img
                src={previewPage.dataUrl}
                alt="Expanded Preview"
                className={styles.modalImg}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
