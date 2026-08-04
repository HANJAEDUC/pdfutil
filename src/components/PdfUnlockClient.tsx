"use client";

import { useState, useRef } from 'react';
import styles from './PdfUnlockClient.module.css';
import { useLanguage } from '@/lib/LanguageContext';
import UnlockKeyIcon from './UnlockKeyIcon';
import { PDFDocument } from 'pdf-lib';
import {
  IoCloudUploadOutline,
  IoShieldCheckmarkOutline,
  IoRefreshOutline,
  IoLockOpenOutline,
  IoLockOpen,
  IoKeyOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoCheckmarkCircleOutline,
  IoWarningOutline,
} from 'react-icons/io5';

export default function PdfUnlockClient() {
  const { lang, t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [unlocking, setUnlocking] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const textDict = (t as any).pdfunlock || {
    title: 'PDF 🔓 PDF',
    subtitle: '알고 있는 PDF 암호를 입력하면 100% 브라우저 내부에서 안전하고 빠르게 암호를 완전 해제합니다.',
    dropText: '암호를 해제할 PDF 파일을 이곳에 드래그하거나 클릭하여 선택하세요',
    subText: '파일이 외부 서버로 전송되지 않고 내 컴퓨터 내부에서 바로 암호가 해제됩니다.',
    selectBtn: 'PDF 파일 선택',
    passwdLabel: '현재 PDF 암호(비밀번호) 입력:',
    passwdPlaceholder: '비밀번호를 입력하세요',
    unlockBtn: '🔓 암호 해제하고 다운로드 ➔',
    unlocking: 'PDF 암호 해제 중...',
    successText: '✅ PDF 암호가 완벽하게 해제되었습니다!',
    invalidPasswd: '비밀번호가 올바르지 않거나 파일 암호를 해제할 수 없습니다.',
    newFile: '새 파일',
  };

  const processPdfFile = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      alert(lang === 'ko' ? 'PDF 파일만 선택 가능합니다.' : 'Please select a valid PDF file.');
      return;
    }
    setFile(selectedFile);
    setPassword('');
    setErrorMsg(null);
    setUnlocked(false);
  };

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
          reject(new Error('PDF.js failed to initialize'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load PDF.js'));
      document.head.appendChild(script);
    });
  };

  const handleUnlockPdf = async () => {
    if (!file) return;
    setUnlocking(true);
    setErrorMsg(null);

    try {
      const arrayBuffer = await file.arrayBuffer();

      // Load and authenticate with PDF.js
      const pdfjsLib = await getPdfJsLib();
      let pdf;
      try {
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          password: password,
        });
        pdf = await loadingTask.promise;
      } catch (err) {
        console.error('PDF decryption error:', err);
        setErrorMsg(textDict.invalidPasswd);
        setUnlocking(false);
        return;
      }

      // Create a new unencrypted PDF document
      const newPdfDoc = await PDFDocument.create();
      const numPages = pdf.numPages;
      const scale = 2.0; // High resolution quality

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Failed to get canvas 2d context');
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: ctx,
          viewport: viewport,
        }).promise;

        const imgDataUrl = canvas.toDataURL('image/jpeg', 0.95);
        const imgBytes = await fetch(imgDataUrl).then((res) => res.arrayBuffer());

        const embeddedImg = await newPdfDoc.embedJpg(imgBytes);
        const pdfPage = newPdfDoc.addPage([viewport.width / scale, viewport.height / scale]);

        pdfPage.drawImage(embeddedImg, {
          x: 0,
          y: 0,
          width: viewport.width / scale,
          height: viewport.height / scale,
        });
      }

      const pdfBytes = await newPdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      // Auto Download unlocked PDF
      const link = document.createElement('a');
      link.href = url;
      const baseName = file.name.replace(/\.pdf$/i, '').replace(/_protected$/i, '');
      link.download = `${baseName}_unlocked.pdf`;
      link.click();

      setUnlocked(true);
      setTimeout(() => setUnlocked(false), 3500);
    } catch (err) {
      console.error(err);
      setErrorMsg(textDict.invalidPasswd);
    } finally {
      setUnlocking(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPassword('');
    setErrorMsg(null);
    setUnlocked(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <span className={styles.badgeTitle}>{t.badge}</span>
        <h1 className={styles.title}>{textDict.title}</h1>
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

      {/* Loading */}
      {loading && (
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>PDF 렌더링 중...</p>
        </div>
      )}

      {/* Unlock Workspace */}
      {file && !loading && (
        <div className={styles.workspace}>
          <div className={styles.controlsBar}>
            <div className={styles.fileSummary}>
              📄 {file.name}
            </div>
            <button className={styles.resetBtn} onClick={handleReset}>
              <IoRefreshOutline /> {textDict.newFile || '새 파일'}
            </button>
          </div>

          <div className={styles.unlockCard}>
            <div className={styles.cardTitle}>
              <UnlockKeyIcon size={24} />
              <span>{textDict.passwdLabel}</span>
            </div>

            <div className={styles.inputWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={textDict.passwdPlaceholder}
                className={styles.passwdInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUnlockPdf();
                }}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
              </button>
            </div>

            {errorMsg && (
              <div className={styles.errorBox}>
                <IoWarningOutline size={20} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className={styles.actionWrapper}>
              <button
                onClick={handleUnlockPdf}
                disabled={unlocking}
                className={styles.unlockBtn}
              >
                {unlocking ? (
                  <span>{textDict.unlocking}</span>
                ) : unlocked ? (
                  <>
                    <IoCheckmarkCircleOutline size={20} />
                    <span>{textDict.successText}</span>
                  </>
                ) : (
                  <>
                    <UnlockKeyIcon size={24} />
                    <span>{textDict.unlockBtn}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
