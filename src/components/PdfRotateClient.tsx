"use client";

import { useState, useRef } from 'react';
import styles from './PdfExtractClient.module.css';
import { useLanguage } from '@/lib/LanguageContext';
import { PDFDocument, degrees } from 'pdf-lib';
import {
  IoCloudUploadOutline,
  IoShieldCheckmarkOutline,
  IoRefreshOutline,
  IoDownloadOutline,
  IoCheckmarkCircleOutline,
  IoSyncOutline,
} from 'react-icons/io5';

interface PageRenderItem {
  pageIndex: number;
  dataUrl: string;
}

export default function PdfRotateClient() {
  const { lang, t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [pages, setPages] = useState<PageRenderItem[]>([]);
  const [rotations, setRotations] = useState<{ [pageIndex: number]: number }>({});
  const [saving, setSaving] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

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

  const processPdfFile = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      alert(lang === 'ko' ? 'PDF 파일만 선택 가능합니다.' : 'Please select a valid PDF file.');
      return;
    }

    setFile(selectedFile);
    setLoading(true);
    setPages([]);
    setRotations({});
    setDownloadUrl(null);

    try {
      const pdfjsLib = await getPdfJsLib();
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;

      setProgress({ current: 0, total: numPages });
      const loadedPages: PageRenderItem[] = [];
      const initialRotations: { [key: number]: number } = {};

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          loadedPages.push({
            pageIndex: i - 1,
            dataUrl: canvas.toDataURL('image/jpeg', 0.8),
          });
        }
        initialRotations[i - 1] = 0;
        setProgress({ current: i, total: numPages });
      }

      setPages(loadedPages);
      setRotations(initialRotations);
    } catch (err) {
      console.error(err);
      alert(lang === 'ko' ? 'PDF 파일을 불러오는 도중 오류가 발생했습니다.' : 'Error loading PDF file.');
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRotatePage = (pageIndex: number, delta: number) => {
    setRotations((prev) => {
      const current = prev[pageIndex] || 0;
      const next = (current + delta + 360) % 360;
      return { ...prev, [pageIndex]: next };
    });
  };

  const handleRotateAll = (delta: number) => {
    setRotations((prev) => {
      const updated: { [key: number]: number } = {};
      pages.forEach((p) => {
        const current = prev[p.pageIndex] || 0;
        updated[p.pageIndex] = (current + delta + 360) % 360;
      });
      return updated;
    });
  };

  const handleResetRotations = () => {
    setRotations((prev) => {
      const updated: { [key: number]: number } = {};
      pages.forEach((p) => {
        updated[p.pageIndex] = 0;
      });
      return updated;
    });
  };

  const handleSaveRotatedPdf = async () => {
    if (!file || pages.length === 0) return;
    setSaving(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pdfPages = pdfDoc.getPages();

      pdfPages.forEach((pdfPage, index) => {
        const addedAngle = rotations[index] || 0;
        if (addedAngle !== 0) {
          const currentAngle = pdfPage.getRotation().angle;
          pdfPage.setRotation(degrees((currentAngle + addedAngle) % 360));
        }
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      // Auto download
      const link = document.createElement('a');
      link.href = url;
      const baseName = file.name.replace(/\.pdf$/i, '');
      link.download = `${baseName}_rotated.pdf`;
      link.click();
    } catch (err) {
      console.error(err);
      alert(lang === 'ko' ? 'PDF 회전 처리 중 오류가 발생했습니다.' : 'Failed to save rotated PDF.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPages([]);
    setRotations({});
    setDownloadUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const textDict = (t as any).pdfrotate || {
    title: 'PDF 🔄 PDF',
    subtitle: '서버 업로드 없이 100% 브라우저 내부에서 안전하고 빠르게 PDF 페이지를 90도/180도 회전시킵니다.',
    dropText: '회전할 PDF 파일을 이곳에 드래그하거나 클릭하여 선택하세요',
    subText: '최대 파일 크기 제한 없이 안전하게 미리보고 회전합니다.',
    selectBtn: 'PDF 파일 선택',
    rotateAllCw: '전체 시계방향 90°',
    rotateAllCcw: '전체 반시계방향 90°',
    rotateAll180: '전체 180° 회전',
    resetAll: '회전 초기화',
    newFile: '새 파일',
    saveBtn: '회전된 PDF 저장 및 다운로드 ➔',
    saving: '회전된 PDF 생성 중...',
    successText: '✅ PDF 회전이 완료되었습니다!',
    downloadBtn: '회전된 PDF 다운로드',
    pageLabel: '페이지',
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <span className={styles.badgeTitle}>{t.badge}</span>
        <h1 className={styles.title}>{textDict.title || 'PDF 🔄 PDF'}</h1>
        <p className={styles.subtitle}>{textDict.subtitle}</p>
      </header>

      {/* Privacy Banner */}
      <div className={styles.privacyBanner}>
        <IoShieldCheckmarkOutline size={20} />
        <span>{t.privacy.banner}</span>
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
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              processPdfFile(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <IoCloudUploadOutline size={54} className={styles.uploadIcon} />
          <div className={styles.dropText}>{textDict.dropText}</div>
          <div className={styles.subText}>{textDict.subText}</div>
          <button className={styles.selectBtn} type="button">{textDict.selectBtn}</button>
          <input
            type="file"
            accept=".pdf,application/pdf"
            ref={fileInputRef}
            className={styles.hiddenInput}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processPdfFile(e.target.files[0]);
              }
            }}
          />
        </div>
      )}

      {/* Loading Progress */}
      {loading && (
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>
            {textDict.loadingProgress?.replace('{current}', String(progress.current)).replace('{total}', String(progress.total))}
          </p>
        </div>
      )}

      {/* Interactive Page Rotation Workspace */}
      {file && pages.length > 0 && !loading && (
        <div className={styles.workspace}>
          {/* Controls Bar */}
          <div className={styles.controlsBar}>
            <div className={styles.fileSummary}>
              📄 {file.name} ({pages.length} {textDict.pageLabel || '페이지'})
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleRotateAll(90)}
                className="px-3 py-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 rounded-lg text-xs font-semibold border border-blue-500/30 transition-all"
              >
                ↻ {textDict.rotateAllCw || '전체 90° ↻'}
              </button>
              <button
                onClick={() => handleRotateAll(-90)}
                className="px-3 py-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 rounded-lg text-xs font-semibold border border-blue-500/30 transition-all"
              >
                ↺ {textDict.rotateAllCcw || '↺ 전체 90°'}
              </button>
              <button
                onClick={() => handleRotateAll(180)}
                className="px-3 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 rounded-lg text-xs font-semibold border border-purple-500/30 transition-all"
              >
                🔄 {textDict.rotateAll180 || '전체 180°'}
              </button>
              <button
                onClick={handleResetRotations}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-xs font-semibold border border-white/10 transition-all"
              >
                {textDict.resetAll || '초기화'}
              </button>
              <button
                className={styles.resetBtn}
                onClick={handleReset}
              >
                <IoRefreshOutline /> {textDict.newFile || '새 파일'}
              </button>
            </div>
          </div>

          {/* Action Button Section */}
          <div className="my-6 text-center">
            <button
              onClick={handleSaveRotatedPdf}
              disabled={saving}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base rounded-2xl transition-all shadow-xl inline-flex items-center gap-3 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <span>{textDict.saving || '생성 중...'}</span>
              ) : (
                <>
                  <IoSyncOutline className="text-xl animate-spin-slow" />
                  <span>{textDict.saveBtn || '회전된 PDF 저장 및 다운로드 ➔'}</span>
                </>
              )}
            </button>
          </div>

          {/* Success Download Card */}
          {downloadUrl && (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center my-6 shadow-xl">
              <div className="text-emerald-400 font-bold text-lg mb-2 flex items-center justify-center gap-2">
                <IoCheckmarkCircleOutline size={24} />
                <span>{textDict.successText || '✅ PDF 회전이 완료되었습니다!'}</span>
              </div>
              <a
                href={downloadUrl}
                download={`${file.name.replace(/\.pdf$/i, '')}_rotated.pdf`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-xl text-sm transition-all shadow-lg mt-2"
              >
                <IoDownloadOutline size={18} />
                <span>{textDict.downloadBtn || '회전된 PDF 다운로드'}</span>
              </a>
            </div>
          )}

          {/* Page Grid */}
          <div className={styles.grid}>
            {pages.map((p) => {
              const currentAngle = rotations[p.pageIndex] || 0;
              return (
                <div key={p.pageIndex} className={styles.pageCard}>
                  <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/[0.02]">
                    <span className="text-xs font-bold text-gray-300">
                      {textDict.pageLabel || '페이지'} {p.pageIndex + 1}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {currentAngle}°
                    </span>
                  </div>

                  <div className="p-4 flex items-center justify-center min-h-[220px] bg-black/20 overflow-hidden">
                    <img
                      src={p.dataUrl}
                      alt={`Page ${p.pageIndex + 1}`}
                      className="max-h-[180px] max-w-full object-contain transition-transform duration-300 rounded shadow"
                      style={{ transform: `rotate(${currentAngle}deg)` }}
                    />
                  </div>

                  <div className="flex items-center justify-around p-2 bg-white/[0.04] border-t border-white/10">
                    <button
                      onClick={() => handleRotatePage(p.pageIndex, -90)}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 text-xs font-semibold text-gray-200 rounded transition-all"
                      title="반시계방향 90도 회전"
                    >
                      ↺ 90°
                    </button>
                    <button
                      onClick={() => handleRotatePage(p.pageIndex, 90)}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 text-xs font-semibold text-gray-200 rounded transition-all"
                      title="시계방향 90도 회전"
                    >
                      90° ↻
                    </button>
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
