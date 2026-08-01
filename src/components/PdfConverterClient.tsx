"use client";

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import {
  IoCloudUploadOutline,
  IoDownloadOutline,
  IoShieldCheckmarkOutline,
  IoDocumentTextOutline,
  IoRefreshOutline,
  IoGridOutline,
  IoLayersOutline,
} from 'react-icons/io5';
import JSZip from 'jszip';

interface PageResult {
  pageIndex: number;
  dataUrl: string;
  width: number;
  height: number;
}

export default function PdfConverterClient() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [scale, setScale] = useState<number>(2.0); // Default 2.0x High Quality
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [pages, setPages] = useState<PageResult[]>([]);
  const [outputMode, setOutputMode] = useState<'separate' | 'merged'>('separate');
  const [mergedDataUrl, setMergedDataUrl] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to load PDF.js via CDN dynamically
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
          reject(new Error('PDF.js 라이브러리 초기화 실패'));
        }
      };
      script.onerror = () => reject(new Error('CDN에서 PDF.js 스크립트를 불러오는데 실패했습니다.'));
      document.head.appendChild(script);
    });
  };

  // Helper to merge all converted pages into a single vertical JPG canvas
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

  const processPdf = async (pdfFile: File, renderScale: number) => {
    setLoading(true);
    setPages([]);
    setMergedDataUrl(null);
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
            ? '🔒 이 PDF 파일은 암호로 보호되어 있습니다. 비밀번호를 입력해 주세요:'
            : '❌ 비밀번호가 올바르지 않습니다. 다시 입력해 주세요:'
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
      if (error?.name === 'PasswordException') {
        return;
      }
      alert(`PDF 변환 중 오류가 발생했습니다: ${error?.message || '다른 PDF 파일로 시도해 주세요.'}`);
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
        alert('PDF 파일만 업로드할 수 있습니다.');
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
        alert('PDF 파일만 업로드할 수 있습니다.');
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
    setOutputMode('separate');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-[1000px] mx-auto px-5 pt-10 pb-20">
      {/* Header matching vpe.co.kr dark screenshot */}
      <header className="text-center mb-10">
        <span className="inline-block px-3.5 py-1.5 rounded-full bg-[#1b273d] text-[#8ab4f8] text-xs font-bold tracking-wider mb-4 uppercase border border-blue-500/20">
          FREE &amp; PRIVATE UTILITY
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#f1f3f4] mb-3 tracking-tight">
          PDF ➡️ JPG 변환기
        </h1>
        <p className="text-base text-[#9aa0a6] max-w-[600px] mx-auto leading-relaxed">
          서버 업로드 없이 100% 브라우저 내부에서 고화질 JPG 이미지로 변환합니다.
        </p>
      </header>

      {/* Privacy Banner matching vpe.co.kr */}
      <div className="bg-[rgba(54,178,126,0.08)] border border-[rgba(54,178,126,0.25)] rounded-xl px-4 py-3 flex items-center justify-center gap-2.5 text-[#81c995] text-sm font-medium mb-8 max-w-[650px] mx-auto">
        <IoShieldCheckmarkOutline className="w-5 h-5 shrink-0 text-[#81c995]" />
        <span>개인정보 안전: 파일이 외부 서버로 전송되지 않고 컴퓨터 내에서 바로 변환됩니다.</span>
      </div>

      {/* Dropzone matching vpe.co.kr */}
      {!file && (
        <div
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 bg-[#1e1f20] mb-8 relative max-w-[900px] mx-auto ${
            isDragOver
              ? 'border-[#8ab4f8] bg-[#28292a] scale-[1.01]'
              : 'border-[rgba(138,180,248,0.35)] hover:border-[#8ab4f8] hover:bg-[#252729]'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <IoCloudUploadOutline className="w-14 h-14 text-[#8ab4f8] mx-auto mb-4" />
          <div className="text-lg font-bold text-[#e3e3e3] mb-2">
            PDF 파일을 이곳에 드래그하거나 클릭하여 선택하세요
          </div>
          <div className="text-sm text-[#9aa0a6] mb-6">
            최대 파일 크기 제한 없이 무료로 이용 가능합니다.
          </div>
          <button className="bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#121212] border-0 px-7 py-3 rounded-full text-base font-bold shadow-md transition-transform active:scale-95">
            PDF 파일 선택
          </button>
          <input
            type="file"
            accept=".pdf,application/pdf"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Options Bar */}
      {file && (
        <div className="bg-[#1e1f20] border border-[rgba(255,255,255,0.12)] rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 mb-8 shadow-md">
          <div className="flex items-center gap-2.5 font-semibold text-[#e3e3e3] text-sm sm:text-base">
            <IoDocumentTextOutline className="w-6 h-6 text-[#8ab4f8]" />
            <span>{file.name} ({pages.length} 페이지)</span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-[#9aa0a6]">
              <span>화질:</span>
              <select
                className="px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.15)] bg-[#121212] text-[#e3e3e3] text-sm font-medium outline-none cursor-pointer"
                value={scale}
                onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                disabled={loading}
              >
                <option value={1.5}>일반 (1.5x)</option>
                <option value={2.0}>고화질 (2.0x 추천)</option>
                <option value={3.0}>초고화질 (3.0x)</option>
              </select>
            </div>

            {pages.length > 0 && outputMode === 'separate' && (
              <button
                onClick={downloadAllAsZip}
                className="bg-[#34a853] hover:bg-[#2d8a46] text-white border-0 px-5.5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 shadow-md transition-all hover:translate-y-[-1px]"
              >
                <IoDownloadOutline className="w-4 h-4" />
                <span>전체 ZIP 다운로드 ({pages.length}장)</span>
              </button>
            )}

            {pages.length > 0 && outputMode === 'merged' && mergedDataUrl && (
              <button
                onClick={downloadMergedImage}
                className="bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#121212] border-0 px-5.5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-md transition-all hover:translate-y-[-1px]"
              >
                <IoDownloadOutline className="w-4 h-4" />
                <span>통합 JPG 다운로드 (1장)</span>
              </button>
            )}

            <button
              onClick={handleReset}
              className="bg-[rgba(234,67,53,0.15)] hover:bg-[rgba(234,67,53,0.25)] text-[#f28b82] border-0 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors flex items-center gap-1.5"
            >
              <IoRefreshOutline className="w-4 h-4" />
              <span>새 파일</span>
            </button>
          </div>
        </div>
      )}

      {/* Mode Switcher */}
      {file && pages.length >= 2 && !loading && (
        <div className="bg-[#1e1f20] border border-[rgba(138,180,248,0.25)] rounded-2xl p-4 sm:p-5 mb-8 flex flex-wrap items-center justify-between gap-4 shadow-md">
          <div className="text-base font-bold text-[#e3e3e3]">저장 형식 선택:</div>
          <div className="flex gap-2.5 bg-black/20 p-1 rounded-xl flex-wrap">
            <button
              onClick={() => setOutputMode('separate')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-0 text-sm font-semibold transition-all cursor-pointer ${
                outputMode === 'separate'
                  ? 'bg-[#8ab4f8] text-[#121212] shadow-md'
                  : 'text-[#9aa0a6] hover:text-[#e3e3e3]'
              }`}
            >
              <IoGridOutline className="w-4 h-4" />
              <span>각 페이지별 JPG ({pages.length}개 파일)</span>
            </button>

            <button
              onClick={() => setOutputMode('merged')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-0 text-sm font-semibold transition-all cursor-pointer ${
                outputMode === 'merged'
                  ? 'bg-[#8ab4f8] text-[#121212] shadow-md'
                  : 'text-[#9aa0a6] hover:text-[#e3e3e3]'
              }`}
            >
              <IoLayersOutline className="w-4 h-4" />
              <span>1개의 통합 JPG (세로 연속 이미지)</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading Progress */}
      {loading && (
        <div className="bg-[#1e1f20] border border-[rgba(255,255,255,0.12)] rounded-2xl p-8 text-center mb-8 shadow-md">
          <div className="text-base font-semibold text-[#e3e3e3] mb-3">
            PDF 렌더링 변환 중... ({progress.current} / {progress.total} 페이지)
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#8ab4f8] to-[#34a853] transition-all duration-300"
              style={{
                width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%',
              }}
            />
          </div>
        </div>
      )}

      {/* Pages Grid (Separate Mode) */}
      {!loading && pages.length > 0 && (outputMode === 'separate' || pages.length === 1) && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
          {pages.map((p) => (
            <div
              key={p.pageIndex}
              className="bg-[#1e1f20] border border-[rgba(255,255,255,0.12)] rounded-2xl overflow-hidden shadow-md flex flex-col transition-all hover:translate-y-[-3px]"
            >
              <div className="bg-slate-900/60 p-3 flex items-center justify-center min-h-[200px] border-b border-white/5">
                <img
                  src={p.dataUrl}
                  alt={`Page ${p.pageIndex}`}
                  className="max-w-full h-auto max-h-[350px] object-contain shadow-md rounded"
                />
              </div>
              <div className="p-3.5 flex items-center justify-between bg-[#1e1f20]">
                <span className="text-sm font-bold text-[#e3e3e3]">{p.pageIndex} 페이지</span>
                <button
                  onClick={() => downloadSinglePage(p)}
                  className="bg-blue-500/15 text-[#8ab4f8] hover:bg-[#8ab4f8] hover:text-[#121212] border-0 px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <IoDownloadOutline className="w-4 h-4" />
                  <span>JPG 다운로드</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Merged Single Long Image View */}
      {!loading && pages.length >= 2 && outputMode === 'merged' && (
        <div className="bg-[#1e1f20] border border-[rgba(255,255,255,0.12)] rounded-2xl p-6 shadow-md overflow-hidden">
          {isMerging ? (
            <div className="p-10 text-center text-base font-semibold text-[#9aa0a6]">
              1개의 통합 JPG 합성 중...
            </div>
          ) : mergedDataUrl ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-5 pb-5 border-b border-[rgba(255,255,255,0.1)] mb-6">
                <div className="flex items-center gap-3.5">
                  <IoLayersOutline className="w-6 h-6 text-[#8ab4f8]" />
                  <div>
                    <h3 className="text-lg font-bold text-[#e3e3e3] mb-1">
                      통합 이미지 ({pages.length}개 페이지 결합)
                    </h3>
                    <p className="text-sm text-[#9aa0a6]">
                      모든 페이지가 세로 순서대로 합쳐진 1개의 JPG 파일입니다.
                    </p>
                  </div>
                </div>
                <button
                  onClick={downloadMergedImage}
                  className="bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#121212] border-0 px-6 py-3 rounded-full text-base font-bold flex items-center gap-2.5 shadow-md transition-all hover:translate-y-[-2px]"
                >
                  <IoDownloadOutline className="w-5 h-5" />
                  <span>1개의 통합 JPG 다운로드</span>
                </button>
              </div>
              <div className="bg-[#121212] rounded-xl p-6 flex justify-center max-h-[700px] overflow-y-auto border border-white/5">
                <img
                  src={mergedDataUrl}
                  alt="Merged PDF pages"
                  className="max-w-full h-auto shadow-lg rounded"
                />
              </div>
            </>
          ) : (
            <div className="p-10 text-center text-base font-semibold text-[#9aa0a6]">
              통합 이미지를 생성할 수 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
