"use client";

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import styles from './PdfMergeClient.module.css';
import { useLanguage } from '@/lib/LanguageContext';
import {
  IoCloudUploadOutline,
  IoDownloadOutline,
  IoShieldCheckmarkOutline,
  IoDocumentTextOutline,
  IoRefreshOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoTrashOutline,
  IoAddOutline,
  IoEyeOutline,
  IoSearchOutline,
  IoCloseOutline,
} from 'react-icons/io5';
import { PDFDocument } from 'pdf-lib';

interface FileItem {
  id: string;
  file: File;
  pageCount?: number;
}

interface MergedPagePreview {
  pageIndex: number;
  dataUrl: string;
}

export default function PdfMergeClient() {
  const { t } = useLanguage();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const [mergedFileName, setMergedFileName] = useState<string>('merged_document.pdf');
  const [mergedPreviews, setMergedPreviews] = useState<MergedPagePreview[]>([]);
  const [previewModalPage, setPreviewModalPage] = useState<MergedPagePreview | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);

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

  const getPdfPageCount = async (file: File): Promise<number | undefined> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      return pdfDoc.getPageCount();
    } catch {
      return undefined;
    }
  };

  const handleFilesAdded = async (newFiles: FileList | File[]) => {
    const pdfFiles = Array.from(newFiles).filter(
      (f) => f.type === 'application/pdf' || f.name.endsWith('.pdf')
    );

    if (pdfFiles.length === 0) {
      alert('Please upload PDF files only.');
      return;
    }

    const items: FileItem[] = [];
    for (const file of pdfFiles) {
      const pageCount = await getPdfPageCount(file);
      items.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        pageCount,
      });
    }

    setFiles((prev) => [...prev, ...items]);
    setMergedPdfUrl(null);
    setMergedPreviews([]);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAdded(e.target.files);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setFiles((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return next;
    });
  };

  const moveDown = (index: number) => {
    if (index === files.length - 1) return;
    setFiles((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return next;
    });
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((item) => item.id !== id));
    setMergedPdfUrl(null);
    setMergedPreviews([]);
  };

  const handleReset = () => {
    setFiles([]);
    setMergedPdfUrl(null);
    setMergedPreviews([]);
    setPreviewModalPage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (addFileInputRef.current) addFileInputRef.current.value = '';
  };

  const renderPreviewsForMergedPdf = async (pdfBytes: Uint8Array) => {
    try {
      const pdfjsLib = await getPdfJsLib();
      const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.buffer });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;

      const previews: MergedPagePreview[] = [];
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
            dataUrl: canvas.toDataURL('image/jpeg', 0.85),
          });
        }
      }
      setMergedPreviews(previews);
    } catch (err) {
      console.error('Failed to render previews for merged PDF:', err);
    }
  };

  const mergePdfs = async () => {
    if (files.length < 2) {
      alert('Please add at least 2 PDF files to merge.');
      return;
    }

    setIsMerging(true);
    setMergedPreviews([]);
    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of files) {
        const arrayBuffer = await item.file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const firstBase = files[0].file.name.replace(/\.pdf$/i, '');
      setMergedFileName(`${firstBase}_merged.pdf`);
      setMergedPdfUrl(url);

      await renderPreviewsForMergedPdf(mergedPdfBytes);
    } catch (err: any) {
      console.error('Failed to merge PDFs:', err);
      alert(`Error merging PDFs: ${err?.message || 'Please check your files.'}`);
    } finally {
      setIsMerging(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.badgeTitle}>{t.badge}</span>
        <h1 className={styles.title}>{t.pdfmerge.title}</h1>
        <p className={styles.subtitle}>{t.pdfmerge.subtitle}</p>
      </header>

      {/* Privacy Banner */}
      <div className={styles.privacyBanner}>
        <IoShieldCheckmarkOutline size={20} />
        <span>{t.privacy.banner}</span>
      </div>

      {/* Empty Dropzone */}
      {files.length === 0 && (
        <div
          className={`${styles.dropzone} ${isDragOver ? styles.dropzoneActive : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <IoCloudUploadOutline size={54} className={styles.uploadIcon} />
          <div className={styles.dropText}>{t.pdfmerge.dropText}</div>
          <div className={styles.subText}>{t.pdfmerge.subText}</div>
          <button className={styles.selectBtn}>{t.pdfmerge.selectBtn}</button>
          <input
            type="file"
            accept=".pdf,application/pdf"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            className={styles.hiddenInput}
          />
        </div>
      )}

      {/* File List & Controls with Drag & Drop Overlay Support */}
      {files.length > 0 && (
        <div
          className={styles.listContainer}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragOver && (
            <div className={styles.dragOverlay}>
              <IoCloudUploadOutline size={48} />
              <span>{t.pdfmerge.dragOverlayText}</span>
            </div>
          )}

          <div className={styles.optionsBar}>
            <div className={styles.fileSummary}>
              <IoDocumentTextOutline size={22} color="#4285f4" />
              <span>{t.pdfmerge.summary.replace('{count}', String(files.length))}</span>
              <span className={styles.dragTip}>{t.pdfmerge.dragTip}</span>
            </div>
            <div className={styles.actionsRight}>
              <button
                onClick={() => addFileInputRef.current?.click()}
                className={styles.addBtn}
              >
                <IoAddOutline size={18} />
                {t.pdfmerge.addFiles}
              </button>
              <input
                type="file"
                accept=".pdf,application/pdf"
                multiple
                ref={addFileInputRef}
                onChange={handleFileChange}
                className={styles.hiddenInput}
              />
              <button onClick={handleReset} className={styles.resetBtn}>
                <IoRefreshOutline size={16} />
                {t.pdfmerge.reset}
              </button>
            </div>
          </div>

          {/* Files List */}
          <div className={styles.fileList}>
            {files.map((item, index) => (
              <div key={item.id} className={styles.fileItem}>
                <div className={styles.itemLeft}>
                  <span className={styles.badgeIndex}>{index + 1}</span>
                  <div className={styles.itemDetails}>
                    <div className={styles.fileName}>{item.file.name}</div>
                    <div className={styles.fileSubText}>
                      {formatSize(item.file.size)}
                      {item.pageCount !== undefined && ` • ${item.pageCount} ${t.pdf2jpg.pageLabel}`}
                    </div>
                  </div>
                </div>

                <div className={styles.itemControls}>
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className={styles.ctrlBtn}
                    title={t.pdfmerge.moveUp}
                  >
                    <IoArrowUpOutline size={18} />
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === files.length - 1}
                    className={styles.ctrlBtn}
                    title={t.pdfmerge.moveDown}
                  >
                    <IoArrowDownOutline size={18} />
                  </button>
                  <button
                    onClick={() => removeFile(item.id)}
                    className={`${styles.ctrlBtn} ${styles.deleteBtn}`}
                    title={t.pdfmerge.delete}
                  >
                    <IoTrashOutline size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Mini Drag & Drop Add Target */}
          <div
            className={styles.miniDropzone}
            onClick={() => addFileInputRef.current?.click()}
          >
            <IoAddOutline size={20} />
            <span>{t.pdfmerge.miniDrop}</span>
          </div>

          {/* Merge Action Area */}
          {!mergedPdfUrl ? (
            <button
              onClick={mergePdfs}
              disabled={isMerging || files.length < 2}
              className={styles.mergeMainBtn}
            >
              {isMerging ? (
                <span>{t.pdfmerge.merging}</span>
              ) : (
                <>
                  <IoDocumentTextOutline size={20} />
                  <span>{t.pdfmerge.mergeBtn.replace('{count}', String(files.length))}</span>
                </>
              )}
            </button>
          ) : (
            <>
              <div className={styles.successBox}>
                <div className={styles.successText}>{t.pdfmerge.successText}</div>
                <a
                  href={mergedPdfUrl}
                  download={mergedFileName}
                  className={styles.downloadBtn}
                >
                  <IoDownloadOutline size={22} />
                  {t.pdfmerge.downloadBtn}
                </a>
              </div>

              {/* Merged PDF Page Previews Section */}
              {mergedPreviews.length > 0 && (
                <div className={styles.previewSection}>
                  <div className={styles.previewHeader}>
                    <div className={styles.previewTitle}>
                      <IoEyeOutline size={22} color="#36b27e" />
                      <span>{t.pdfmerge.previewTitle.replace('{count}', String(mergedPreviews.length))}</span>
                    </div>
                    <span className={styles.previewSub}>{t.pdfmerge.previewSub}</span>
                  </div>

                  <div className={styles.previewGrid}>
                    {mergedPreviews.map((p) => (
                      <div
                        key={p.pageIndex}
                        className={styles.previewCard}
                        onClick={() => setPreviewModalPage(p)}
                        title={t.pdf2jpg.zoomIn}
                      >
                        <div className={styles.previewCardHeader}>
                          <span>{p.pageIndex} {t.pdf2jpg.pageLabel}</span>
                        </div>
                        <div className={styles.previewImgWrapper}>
                          <img src={p.dataUrl} alt={`Page ${p.pageIndex}`} className={styles.previewImg} />
                          <div className={styles.zoomOverlay}>
                            <IoSearchOutline size={24} />
                            <span>{t.pdf2jpg.zoomIn}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Lightbox Preview Modal for Merged PDF Pages */}
      {previewModalPage && (
        <div className={styles.modalOverlay} onClick={() => setPreviewModalPage(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                {t.pdfmerge.modalTitle.replace('{page}', String(previewModalPage.pageIndex))}
              </div>
              <div className={styles.modalActions}>
                {mergedPdfUrl && (
                  <a
                    href={mergedPdfUrl}
                    download={mergedFileName}
                    className={styles.modalDlBtn}
                  >
                    <IoDownloadOutline size={18} />
                    {t.pdf2jpg.modalDownload}
                  </a>
                )}
                <button
                  className={styles.modalCloseBtn}
                  onClick={() => setPreviewModalPage(null)}
                  aria-label={t.pdf2jpg.close}
                >
                  <IoCloseOutline size={24} />
                </button>
              </div>
            </div>
            <div className={styles.modalBody}>
              <img
                src={previewModalPage.dataUrl}
                alt={`Merged Page ${previewModalPage.pageIndex}`}
                className={styles.modalImg}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
