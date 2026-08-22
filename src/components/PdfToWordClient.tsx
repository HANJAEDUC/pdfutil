"use client";

import React, { useState, useRef } from 'react';
import { Document, Paragraph, TextRun, Packer } from 'docx';
import { useLanguage } from '@/lib/LanguageContext';
import styles from './PdfConverterClient.module.css';
import {
  IoCloudUploadOutline,
  IoDownloadOutline,
  IoRefreshOutline,
  IoCheckmarkCircleOutline,
  IoShieldCheckmarkOutline,
} from 'react-icons/io5';

export default function PdfToWordClient() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [isDragging, setIsDragging] = useState(false);
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

  const resetState = () => {
    setFile(null);
    setIsConverting(false);
    setProgress({ current: 0, total: 0 });
    setConvertedBlob(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      alert('PDF 파일만 선택 가능합니다.');
      return;
    }
    setFile(selectedFile);
    setConvertedBlob(null);
    convertToWord(selectedFile);
  };

  const convertToWord = async (pdfFile: File) => {
    setIsConverting(true);
    setConvertedBlob(null);

    try {
      const pdfjsLib = await getPdfJsLib();
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      setProgress({ current: 0, total: numPages });

      const docSections: any[] = [];

      for (let i = 1; i <= numPages; i++) {
        setProgress({ current: i, total: numPages });
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        const items = textContent.items as any[];
        const lineGroups: { [yKey: number]: any[] } = {};

        items.forEach((item) => {
          if (!item.str || item.str.trim() === '') return;
          const y = Math.round(item.transform[5] / 12) * 12;
          if (!lineGroups[y]) lineGroups[y] = [];
          lineGroups[y].push(item);
        });

        const sortedYKeys = Object.keys(lineGroups)
          .map(Number)
          .sort((a, b) => b - a);

        const pageParagraphs: Paragraph[] = [];

        pageParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `--- ${i} 페이지 ---`,
                bold: true,
                color: '888888',
                size: 20,
              }),
            ],
            spacing: { before: 200, after: 100 },
          })
        );

        sortedYKeys.forEach((y) => {
          const lineItems = lineGroups[y];
          lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
          const lineText = lineItems.map((item) => item.str).join(' ');

          if (lineText.trim()) {
            pageParagraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: lineText,
                    size: 22,
                  }),
                ],
                spacing: { after: 120 },
              })
            );
          }
        });

        docSections.push({
          properties: {},
          children: pageParagraphs,
        });
      }

      const doc = new Document({
        sections: docSections,
      });

      const blob = await Packer.toBlob(doc);
      setConvertedBlob(blob);
    } catch (err: any) {
      console.error('PDF to Word conversion failed:', err);
      alert('PDF Word 변환 중 오류가 발생했습니다.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!convertedBlob || !file) return;
    const wordFilename = file.name.replace(/\.pdf$/i, '') + '.docx';
    const url = URL.createObjectURL(convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = wordFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.badgeTitle}>{(t as any).badge}</span>
        <h1 className={styles.title}>
          {(t as any).pdf2word?.title || 'PDF ➡️ Word (DOCX)'}
        </h1>
        <p className={styles.subtitle}>
          {(t as any).pdf2word?.subtitle || '서버 업로드 없이 100% 브라우저 내부에서 안전하고 빠르게 PDF를 Word(.docx) 문서로 변환합니다.'}
        </p>
      </header>

      <div className={styles.privacyBanner}>
        <IoShieldCheckmarkOutline size={20} />
        <span>{(t as any).privacy?.banner}</span>
      </div>

      {!file && (
        <div
          className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileSelect(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <IoCloudUploadOutline size={54} className={styles.uploadIcon} />
          <h2 className={styles.dropText}>
            {(t as any).pdf2word?.dropText || 'Word로 변환할 PDF 파일을 이곳에 드래그하거나 클릭하세요'}
          </h2>
          <p className={styles.subText}>
            {(t as any).pdf2word?.subText || '최대 파일 크기 제한 없이 안전하게 내 컴퓨터에서 바로 변환됩니다.'}
          </p>
          <button className={styles.selectBtn} type="button">
            {(t as any).pdf2word?.selectBtn || 'PDF 파일 선택'}
          </button>
          <input
            type="file"
            accept=".pdf,application/pdf"
            ref={fileInputRef}
            className={styles.hiddenInput}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />
        </div>
      )}

      {file && (
        <div className={styles.workspace}>
          <div className={styles.controlsBar}>
            <div className={styles.fileSummary}>
              <span className={styles.fileName}>📄 {file.name}</span>
              <span className={styles.fileSize}>
                ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>

            <button className={styles.newFileBtn} onClick={resetState}>
              <IoRefreshOutline /> {(t as any).pdf2word?.newFile || '새 파일'}
            </button>
          </div>

          {isConverting && (
            <div className={styles.progressContainer}>
              <p className={styles.progressText}>
                🔄 PDF 텍스트 구조 분석 및 Word 파일 생성 중... ({progress.current} / {progress.total} 페이지)
              </p>
              <div className={styles.progressBarBg}>
                <div
                  className={styles.progressBarFill}
                  style={{
                    width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}

          {convertedBlob && !isConverting && (
            <div className="bg-[#1e1f20] border border-white/10 rounded-2xl p-8 text-center my-6 shadow-2xl">
              <IoCheckmarkCircleOutline className="text-6xl text-emerald-400 mx-auto mb-4 animate-bounce" />
              <h3 className="text-xl font-bold text-gray-100 mb-2">
                {(t as any).pdf2word?.successText || '✅ Word(.docx) 문서 변환이 완료되었습니다!'}
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                서버 전송 없이 안전하게 브라우저에서 생성된 Microsoft Word 파일입니다.
              </p>

              <button
                onClick={handleDownload}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-base transition-all shadow-lg inline-flex items-center gap-3 cursor-pointer"
              >
                <IoDownloadOutline size={22} />
                <span>{(t as any).pdf2word?.downloadBtn || 'Word(.docx) 파일 다운로드'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
