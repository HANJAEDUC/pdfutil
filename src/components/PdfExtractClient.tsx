"use client";

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
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
  pageIndex: number; // 1-based index
  dataUrl: string;
}

export default function PdfExtractClient() {
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
      const previews: PagePreview[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.6 }); // Lightweight thumbnail

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
      // Select all by default
      setSelectedPages(previews.map((p) => p.pageIndex));
    } catch (error: any) {
      console.error('Error processing PDF for extraction:', error);
      if (error?.name !== 'PasswordException') {
        alert(`PDF 로딩 중 오류가 발생했습니다: ${error?.message || '다른 PDF 파일로 시도해 주세요.'}`);
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
        processPdf(droppedFile);
      } else {
        alert('PDF 파일만 업로드할 수 있습니다.');
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
      alert('추출할 페이지를 최소 1개 이상 선택해 주세요.');
      return;
    }

    setIsExtracting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const newPdf = await PDFDocument.create();

      // Convert 1-based pageIndex to 0-based index for pdf-lib
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
      console.error('PDF 페이지 추출 실패:', err);
      alert(`PDF 페이지 추출 중 오류가 발생했습니다: ${err?.message || '확인 후 다시 시도해 주세요.'}`);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-5 py-10">
      <header className="text-center mb-10">
        <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-[#4285f4] text-xs font-bold uppercase tracking-wider mb-3">
          Free & Private Utility
        </span>
        <h1 className="text-4xl font-bold text-[#e3e3e3] mb-3 tracking-tight">
          PDF 페이지 추출기 (PdfExtract)
        </h1>
        <p className="text-[#9aa0a6] text-base max-w-xl mx-auto leading-relaxed">
          서버 업로드 없이 100% 브라우저 내부에서 특정 페이지를 선택하여 독립된 PDF로 추출합니다.
        </p>
      </header>

      {/* Privacy Banner */}
      <div className="bg-[#36b27e]/10 border border-[#36b27e]/20 rounded-xl p-3 px-5 flex items-center justify-center gap-2.5 text-[#36b27e] text-sm font-medium mb-8 max-w-2xl mx-auto">
        <IoShieldCheckmarkOutline size={20} />
        <span>개인정보 안전: 파일이 외부 서버로 전송되지 않고 컴퓨터 내에서 바로 추출됩니다.</span>
      </div>

      {/* Dropzone */}
      {!file && (
        <div
          className={`border-2 border-dashed ${
            isDragOver ? 'border-[#4285f4] bg-[#4285f4]/10' : 'border-[#4285f4]/40 bg-[#1e1f20]'
          } rounded-2xl p-12 text-center cursor-pointer hover:border-[#4285f4] hover:bg-[#4285f4]/5 transition-all max-w-2xl mx-auto shadow-lg`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <IoCloudUploadOutline size={54} className="text-[#4285f4] mx-auto mb-4" />
          <div className="text-xl font-semibold text-[#e3e3e3] mb-2">
            추출할 PDF 파일을 이곳에 드래그하거나 클릭하여 선택하세요
          </div>
          <div className="text-[#9aa0a6] text-sm mb-6">
            최대 파일 크기 제한 없이 안전하게 미리보고 추출합니다.
          </div>
          <button className="bg-[#4285f4] hover:bg-[#3367d6] text-white px-6 py-3 rounded-full font-medium transition-colors">
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

      {/* Loading Progress */}
      {loading && (
        <div className="bg-[#1e1f20] border border-white/10 rounded-2xl p-8 max-w-md mx-auto text-center space-y-4">
          <div className="text-[#e3e3e3] font-semibold text-base">
            PDF 페이지 로딩 중... ({progress.current} / {progress.total} 페이지)
          </div>
          <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-[#4285f4] h-full transition-all duration-300"
              style={{
                width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%',
              }}
            />
          </div>
        </div>
      )}

      {/* Control Bar & Options */}
      {file && !loading && (
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#1e1f20] border border-white/10 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#e3e3e3]">
              <IoDocumentTextOutline size={22} className="text-[#4285f4]" />
              <span>{file.name} (총 {pages.length}페이지 중 {selectedPages.length}페이지 선택됨)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="bg-white/10 hover:bg-white/15 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                전체 선택
              </button>
              <button
                onClick={deselectAll}
                className="bg-white/10 hover:bg-white/15 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                전체 해제
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ml-2"
              >
                <IoRefreshOutline size={14} />
                새 파일
              </button>
            </div>
          </div>

          {/* Action Header */}
          {!extractedPdfUrl ? (
            <div className="mb-8">
              <button
                onClick={extractSelectedPages}
                disabled={isExtracting || selectedPages.length === 0}
                className="w-full bg-[#4285f4] hover:bg-[#3367d6] disabled:bg-white/10 disabled:text-white/40 text-white font-semibold py-4 rounded-xl shadow-lg transition-all text-base flex items-center justify-center gap-2"
              >
                {isExtracting ? (
                  <span>PDF 페이지 추출 중...</span>
                ) : (
                  <>
                    <IoCutOutline size={20} />
                    <span>선택한 {selectedPages.length}개 페이지 추출하여 새 PDF로 저장</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-[#36b27e]/10 border border-[#36b27e]/30 rounded-2xl p-6 text-center space-y-4 mb-8">
              <div className="text-[#36b27e] font-semibold text-lg">
                ✅ 선택한 {selectedPages.length}개 페이지 추출이 완료되었습니다!
              </div>
              <a
                href={extractedPdfUrl}
                download={extractedFileName}
                className="inline-flex items-center gap-2 bg-[#36b27e] hover:bg-[#2e9c6e] text-white px-8 py-3.5 rounded-full font-bold transition-all shadow-lg text-base"
              >
                <IoDownloadOutline size={22} />
                추출된 PDF 다운로드
              </a>
            </div>
          )}

          {/* Page Preview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pages.map((p) => {
              const isSelected = selectedPages.includes(p.pageIndex);
              return (
                <div
                  key={p.pageIndex}
                  onClick={() => togglePageSelection(p.pageIndex)}
                  className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#4285f4] bg-[#4285f4]/10 shadow-lg scale-[1.02]'
                      : 'border-white/10 bg-[#1e1f20] opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="p-2 bg-white/5 flex items-center justify-between border-b border-white/5">
                    <span className="text-xs font-semibold text-[#e3e3e3]">
                      {p.pageIndex} 페이지
                    </span>
                    {isSelected ? (
                      <IoCheckmarkCircle size={20} className="text-[#4285f4]" />
                    ) : (
                      <IoEllipseOutline size={20} className="text-[#9aa0a6]" />
                    )}
                  </div>
                  <div className="p-2 flex items-center justify-center bg-[#121212] min-h-[160px]">
                    <img
                      src={p.dataUrl}
                      alt={`Page ${p.pageIndex}`}
                      className="max-h-[160px] object-contain shadow-sm rounded"
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
