"use client";

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
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
} from 'react-icons/io5';
import { PDFDocument } from 'pdf-lib';

interface FileItem {
  id: string;
  file: File;
  pageCount?: number;
}

export default function PdfMergeClient() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const [mergedFileName, setMergedFileName] = useState<string>('merged_document.pdf');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);

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
      alert('PDF 파일만 업로드할 수 있습니다.');
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
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAdded(e.target.files);
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
  };

  const handleReset = () => {
    setFiles([]);
    setMergedPdfUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (addFileInputRef.current) addFileInputRef.current.value = '';
  };

  const mergePdfs = async () => {
    if (files.length < 2) {
      alert('PDF를 병합하려면 최소 2개 이상의 파일을 추가해 주세요.');
      return;
    }

    setIsMerging(true);
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
    } catch (err: any) {
      console.error('PDF 병합 실패:', err);
      alert(`PDF 병합 중 오류가 발생했습니다: ${err?.message || '파일을 확인해 주세요.'}`);
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
    <div className="max-w-[1000px] mx-auto px-5 py-10">
      <header className="text-center mb-10">
        <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-[#4285f4] text-xs font-bold uppercase tracking-wider mb-3">
          Free & Private Utility
        </span>
        <h1 className="text-4xl font-bold text-[#e3e3e3] mb-3 tracking-tight">
          PDF 병합기 (PdfMerge)
        </h1>
        <p className="text-[#9aa0a6] text-base max-w-xl mx-auto leading-relaxed">
          서버 업로드 없이 100% 브라우저 내부에서 안전하고 빠르게 여러 개의 PDF를 1개 파일로 합칩니다.
        </p>
      </header>

      {/* Privacy Banner */}
      <div className="bg-[#36b27e]/10 border border-[#36b27e]/20 rounded-xl p-3 px-5 flex items-center justify-center gap-2.5 text-[#36b27e] text-sm font-medium mb-8 max-w-2xl mx-auto">
        <IoShieldCheckmarkOutline size={20} />
        <span>개인정보 안전: 파일이 외부 서버로 전송되지 않고 컴퓨터 내에서 바로 병합됩니다.</span>
      </div>

      {/* Empty Dropzone */}
      {files.length === 0 && (
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
            병합할 PDF 파일들을 이곳에 드래그하거나 클릭하세요
          </div>
          <div className="text-[#9aa0a6] text-sm mb-6">
            여러 개의 PDF를 선택하여 순서를 자유롭게 조정하고 하나로 합칩니다.
          </div>
          <button className="bg-[#4285f4] hover:bg-[#3367d6] text-white px-6 py-3 rounded-full font-medium transition-colors">
            PDF 파일들 선택
          </button>
          <input
            type="file"
            accept=".pdf,application/pdf"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* File List & Controls */}
      {files.length > 0 && (
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between bg-[#1e1f20] border border-white/10 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#e3e3e3]">
              <IoDocumentTextOutline size={22} className="text-[#4285f4]" />
              <span>총 {files.length}개 파일 선택됨</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => addFileInputRef.current?.click()}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                <IoAddOutline size={18} />
                파일 추가
              </button>
              <input
                type="file"
                accept=".pdf,application/pdf"
                multiple
                ref={addFileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                <IoRefreshOutline size={16} />
                초기화
              </button>
            </div>
          </div>

          {/* Files List */}
          <div className="space-y-3 mb-6">
            {files.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-[#1e1f20] border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-4">
                  <span className="w-7 h-7 flex items-center justify-center rounded-full bg-[#4285f4]/20 text-[#4285f4] text-xs font-bold shrink-0">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#e3e3e3] truncate">
                      {item.file.name}
                    </div>
                    <div className="text-xs text-[#9aa0a6] mt-0.5">
                      {formatSize(item.file.size)}
                      {item.pageCount !== undefined && ` • ${item.pageCount}페이지`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="p-2 text-[#9aa0a6] hover:text-white disabled:opacity-30 disabled:hover:text-[#9aa0a6] transition-colors"
                    title="위로 이동"
                  >
                    <IoArrowUpOutline size={18} />
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === files.length - 1}
                    className="p-2 text-[#9aa0a6] hover:text-white disabled:opacity-30 disabled:hover:text-[#9aa0a6] transition-colors"
                    title="아래로 이동"
                  >
                    <IoArrowDownOutline size={18} />
                  </button>
                  <button
                    onClick={() => removeFile(item.id)}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors ml-1"
                    title="삭제"
                  >
                    <IoTrashOutline size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Merge Action Area */}
          {!mergedPdfUrl ? (
            <div className="text-center pt-2">
              <button
                onClick={mergePdfs}
                disabled={isMerging || files.length < 2}
                className="w-full bg-[#4285f4] hover:bg-[#3367d6] disabled:bg-white/10 disabled:text-white/40 text-white font-semibold py-4 rounded-xl shadow-lg transition-all text-base flex items-center justify-center gap-2"
              >
                {isMerging ? (
                  <span>PDF 병합 중...</span>
                ) : (
                  <>
                    <IoDocumentTextOutline size={20} />
                    <span>{files.length}개 PDF 하나로 병합하기</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-[#36b27e]/10 border border-[#36b27e]/30 rounded-2xl p-6 text-center space-y-4">
              <div className="text-[#36b27e] font-semibold text-lg">
                ✅ PDF 병합이 완료되었습니다!
              </div>
              <a
                href={mergedPdfUrl}
                download={mergedFileName}
                className="inline-flex items-center gap-2 bg-[#36b27e] hover:bg-[#2e9c6e] text-white px-8 py-3.5 rounded-full font-bold transition-all shadow-lg text-base"
              >
                <IoDownloadOutline size={22} />
                병합된 PDF 다운로드
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
