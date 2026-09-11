"use client";

import { useState, useRef } from 'react';
import styles from './PdfUnlockClient.module.css';
import { useLanguage } from '@/lib/LanguageContext';
import UnlockKeyIcon from './UnlockKeyIcon';
import {
  IoCloudUploadOutline,
  IoShieldCheckmarkOutline,
  IoRefreshOutline,
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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
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

  const handleUnlockPdf = async () => {
    if (!file) return;
    setUnlocking(true);
    setErrorMsg(null);
    setElapsedSeconds(0);
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    let qpdf: any = null;
    try {
      const { createQpdfRunner } = await import('qpdf-run');
      const origin = typeof window !== 'undefined' ? window.location.origin : '';

      qpdf = await createQpdfRunner({
        workerUrl: `${origin}/qpdf/worker.js`,
        qpdfJsUrl: `${origin}/qpdf/qpdf.js`,
        wasmUrl: `${origin}/qpdf/qpdf.wasm`,
        timeoutMs: 600000,
      });

      const arrayBuffer = await file.arrayBuffer();
      const inputBytes = new Uint8Array(arrayBuffer);

      const args = password
        ? ['--password=' + password, '--decrypt', '--', 'input.pdf', 'output.pdf']
        : ['--decrypt', '--', 'input.pdf', 'output.pdf'];

      const outputBytes = await qpdf.runOne({
        input: inputBytes,
        inputName: 'input.pdf',
        outputName: 'output.pdf',
        args,
      });

      const blob = new Blob([outputBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      // Auto Download unlocked PDF
      const link = document.createElement('a');
      link.href = url;
      const baseName = file.name.replace(/\.pdf$/i, '').replace(/_protected$/i, '');
      link.download = `${baseName}_unlocked.pdf`;
      link.click();

      setUnlocked(true);
      setTimeout(() => setUnlocked(false), 3500);
    } catch (err: any) {
      console.error('PDF decryption error:', err);
      const msg = (err?.message || '').toLowerCase();
      const stderrStr = Array.isArray(err?.stderr) ? err.stderr.join(' ').toLowerCase() : '';

      const isPasswdError =
        err?.exitCode === 2 ||
        msg.includes('invalid password') ||
        stderrStr.includes('invalid password') ||
        (stderrStr.includes('password') && !stderrStr.includes('memory') && !stderrStr.includes('oom'));

      const isMemoryError =
        msg.includes('memory') ||
        msg.includes('oom') ||
        stderrStr.includes('memory') ||
        stderrStr.includes('oom') ||
        msg.includes('aborted');

      if (isPasswdError) {
        setErrorMsg(
          lang === 'ko'
            ? '입력하신 비밀번호가 올바르지 않습니다. 정확한 암호를 확인 후 다시 입력해 주세요.'
            : 'The password entered is incorrect. Please check and try again.'
        );
      } else if (isMemoryError) {
        setErrorMsg(
          lang === 'ko'
            ? '문서 크기 또는 페이지 수(수천 페이지)가 너무 방대하여 브라우저 메모리 한도를 초과했습니다.'
            : 'The document is too large and exceeded browser memory limits.'
        );
      } else {
        setErrorMsg(
          lang === 'ko'
            ? (err?.message ? `암호 해제 처리 중 오류가 발생했습니다: ${err.message}` : textDict.invalidPasswd)
            : 'An error occurred while unlocking the PDF.'
        );
      }
    } finally {
      clearInterval(timer);
      if (qpdf) {
        try {
          await qpdf.destroy();
        } catch (e) {
          console.error('Failed to destroy qpdf runner:', e);
        }
      }
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
                  <span>
                    ⏳ {lang === 'ko' ? `복호화 처리 중... (${elapsedSeconds}초 경과)` : `Decrypting... (${elapsedSeconds}s)`}
                  </span>
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
              {unlocking && elapsedSeconds > 5 && (
                <p style={{ marginTop: '12px', fontSize: '13px', color: '#94a3b8', textAlign: 'center', lineHeight: '1.5' }}>
                  {lang === 'ko'
                    ? '💡 수천 페이지 규모의 초대형 문서는 수백만 개 객체를 복호화하므로 약 3~4분이 소요될 수 있습니다. 창을 닫지 마세요.'
                    : '💡 Massive documents (thousands of pages) may take 3-4 minutes to decrypt. Please keep this tab open.'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
