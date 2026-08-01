"use client";

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import styles from './PdfMergeClient.module.css';
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
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.badgeTitle}>Free & Private Utility</span>
        <h1 className={styles.title}>PDF 병합기 (PdfMerge)</h1>
        <p className={styles.subtitle}>
          서버 업로드 없이 100% 브라우저 내부에서 안전하고 빠르게 여러 개의 PDF를 1개 파일로 합칩니다.
        </p>
      </header>

      {/* Privacy Banner */}
      <div className={styles.privacyBanner}>
        <IoShieldCheckmarkOutline size={20} />
        <span>개인정보 안전: 파일이 외부 서버로 전송되지 않고 컴퓨터 내에서 바로 병합됩니다.</span>
      </div>

      {/* Dropzone */}
      {files.length === 0 && (
        <div
          className={`${styles.dropzone} ${isDragOver ? styles.dropzoneActive : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <IoCloudUploadOutline size={54} className={styles.uploadIcon} />
          <div className={styles.dropText}>병합할 PDF 파일들을 이곳에 드래그하거나 클릭하세요</div>
          <div className={styles.subText}>여러 개의 PDF를 선택하여 순서를 자유롭게 조정하고 하나로 합칩니다.</div>
          <button className={styles.selectBtn}>PDF 파일들 선택</button>
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

      {/* File List & Controls */}
      {files.length > 0 && (
        <div className={styles.listContainer}>
          <div className={styles.optionsBar}>
            <div className={styles.fileSummary}>
              <IoDocumentTextOutline size={22} color="#4285f4" />
              <span>총 {files.length}개 파일 선택됨</span>
            </div>
            <div className={styles.actionsRight}>
              <button
                onClick={() => addFileInputRef.current?.click()}
                className={styles.addBtn}
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
                className={styles.hiddenInput}
              />
              <button onClick={handleReset} className={styles.resetBtn}>
                <IoRefreshOutline size={16} />
                초기화
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
                      {item.pageCount !== undefined && ` • ${item.pageCount}페이지`}
                    </div>
                  </div>
                </div>

                <div className={styles.itemControls}>
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className={styles.ctrlBtn}
                    title="위로 이동"
                  >
                    <IoArrowUpOutline size={18} />
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === files.length - 1}
                    className={styles.ctrlBtn}
                    title="아래로 이동"
                  >
                    <IoArrowDownOutline size={18} />
                  </button>
                  <button
                    onClick={() => removeFile(item.id)}
                    className={`${styles.ctrlBtn} ${styles.deleteBtn}`}
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
            <button
              onClick={mergePdfs}
              disabled={isMerging || files.length < 2}
              className={styles.mergeMainBtn}
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
          ) : (
            <div className={styles.successBox}>
              <div className={styles.successText}>✅ PDF 병합이 완료되었습니다!</div>
              <a
                href={mergedPdfUrl}
                download={mergedFileName}
                className={styles.downloadBtn}
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
