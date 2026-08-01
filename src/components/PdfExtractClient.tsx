"use client";

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import styles from './PdfExtractClient.module.css';
import { useLanguage } from '@/lib/LanguageContext';
import {
  IoCloudUploadOutline,
  IoDownloadOutline,
  IoShieldCheckmarkOutline,
  IoDocumentTextOutline,
  IoRefreshOutline,
  IoCheckmarkCircle,
  IoEllipseOutline,
  IoCutOutline,
} from 'react-icons/io5';
import { PDFDocument } from 'pdf-lib';

interface PagePreview {
  pageIndex: number;
  dataUrl: string;
}

export default function PdfExtractClient() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedPdfUrl, setExtractedPdfUrl] = useState<string | null>(null);
  const [extractedFileName, setExtractedFileName] = useState<string>('extracted.pdf');
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

  const processPdf = async (pdfFile: File) => {
    setLoading(true);
    setPages([]);
    setSelectedPages([]);
    setExtractedPdfUrl(null);
    setProgress({ current: 0, total: 0 });

    try {
      const pdfjsLib = await getPdfJsLib();
      const arrayBuffer = await pdfFile.arrayBuffer();

      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
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
      const previews: PagePreview[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.6 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport: viewport } as any).promise;
          previews.push({
            pageIndex: i,
            dataUrl: canvas.toDataURL('image/jpeg', 0.8),
          });
        }
        setProgress({ current: i, total: numPages });
      }

      setPages(previews);
      setSelectedPages(previews.map((p) => p.pageIndex));
    } catch (error: any) {
      console.error('Error processing PDF for extraction:', error);
      if (error?.name !== 'PasswordException') {
        alert(`Error loading PDF: ${error?.message || 'Please try another file.'}`);
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
        processPdf(selectedFile);
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
        processPdf(droppedFile);
      } else {
        alert('Please upload PDF files only.');
      }
    }
  };

  const togglePageSelection = (pageIndex: number) => {
    setSelectedPages((prev) =>
      prev.includes(pageIndex) ? prev.filter((p) => p !== pageIndex) : [...prev, pageIndex].sort((a, b) => a - b)
    );
    setExtractedPdfUrl(null);
  };

  const selectAll = () => {
    setSelectedPages(pages.map((p) => p.pageIndex));
    setExtractedPdfUrl(null);
  };

  const deselectAll = () => {
    setSelectedPages([]);
    setExtractedPdfUrl(null);
  };

  const handleReset = () => {
    setFile(null);
    setPages([]);
    setSelectedPages([]);
    setExtractedPdfUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const extractSelectedPages = async () => {
    if (!file) return;
    if (selectedPages.length === 0) {
      alert('Please select at least 1 page to extract.');
      return;
    }

    setIsExtracting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const newPdf = await PDFDocument.create();

      const indicesToCopy = selectedPages.map((p) => p - 1);
      const copiedPages = await newPdf.copyPages(srcDoc, indicesToCopy);

      copiedPages.forEach((page) => newPdf.addPage(page));

      const newPdfBytes = await newPdf.save();
      const blob = new Blob([newPdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const baseName = file.name.replace(/\.pdf$/i, '');
      setExtractedFileName(`${baseName}_extracted.pdf`);
      setExtractedPdfUrl(url);
    } catch (err: any) {
      console.error('PDF extraction failed:', err);
      alert(`Error extracting pages: ${err?.message || 'Please try again.'}`);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.badgeTitle}>{t.badge}</span>
        <h1 className={styles.title}>{t.pdfextract.title}</h1>
        <p className={styles.subtitle}>{t.pdfextract.subtitle}</p>
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
          <div className={styles.dropText}>{t.pdfextract.dropText}</div>
          <div className={styles.subText}>{t.pdfextract.subText}</div>
          <button className={styles.selectBtn}>{t.pdfextract.selectBtn}</button>
          <input
            type="file"
            accept=".pdf,application/pdf"
            ref={fileInputRef}
            onChange={handleFileChange}
            className={styles.hiddenInput}
          />
        </div>
      )}

      {/* Loading Progress */}
      {loading && (
        <div className={styles.progressContainer}>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>
            {t.pdfextract.loadingProgress.replace('{current}', String(progress.current)).replace('{total}', String(progress.total))}
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

      {/* Control Bar & Options */}
      {file && !loading && (
        <div>
          <div className={styles.optionsBar}>
            <div className={styles.fileInfo}>
              <IoDocumentTextOutline size={22} color="#4285f4" />
              <span>
                {t.pdfextract.summary
                  .replace('{filename}', file.name)
                  .replace('{total}', String(pages.length))
                  .replace('{selected}', String(selectedPages.length))}
              </span>
            </div>

            <div className={styles.actionsRight}>
              <button onClick={selectAll} className={styles.toolBtn}>
                {t.pdfextract.selectAll}
              </button>
              <button onClick={deselectAll} className={styles.toolBtn}>
                {t.pdfextract.deselectAll}
              </button>
              <button onClick={handleReset} className={styles.resetBtn}>
                <IoRefreshOutline size={14} />
                {t.pdfextract.newFile}
              </button>
            </div>
          </div>

          {/* Action Area */}
          {!extractedPdfUrl ? (
            <button
              onClick={extractSelectedPages}
              disabled={isExtracting || selectedPages.length === 0}
              className={styles.extractMainBtn}
            >
              {isExtracting ? (
                <span>{t.pdfextract.extracting}</span>
              ) : (
                <>
                  <IoCutOutline size={20} />
                  <span>{t.pdfextract.extractBtn.replace('{count}', String(selectedPages.length))}</span>
                </>
              )}
            </button>
          ) : (
            <div className={styles.successBox}>
              <div className={styles.successText}>
                {t.pdfextract.successText.replace('{count}', String(selectedPages.length))}
              </div>
              <a
                href={extractedPdfUrl}
                download={extractedFileName}
                className={styles.downloadBtn}
              >
                <IoDownloadOutline size={22} />
                {t.pdfextract.downloadBtn}
              </a>
            </div>
          )}

          {/* Page Preview Grid */}
          <div className={styles.grid}>
            {pages.map((p) => {
              const isSelected = selectedPages.includes(p.pageIndex);
              return (
                <div
                  key={p.pageIndex}
                  onClick={() => togglePageSelection(p.pageIndex)}
                  className={`${styles.pageThumbCard} ${isSelected ? styles.selectedCard : ''}`}
                  style={{ opacity: isSelected ? 1 : 0.55 }}
                >
                  <div className={styles.thumbHeader}>
                    <span className={styles.pageLabel}>{p.pageIndex} {t.pdfextract.pageLabel}</span>
                    {isSelected ? (
                      <IoCheckmarkCircle size={20} color="#4285f4" />
                    ) : (
                      <IoEllipseOutline size={20} color="#9aa0a6" />
                    )}
                  </div>
                  <div className={styles.thumbImgWrapper}>
                    <img
                      src={p.dataUrl}
                      alt={`Page ${p.pageIndex}`}
                      className={styles.thumbImg}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
