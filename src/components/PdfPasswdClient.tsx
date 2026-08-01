"use client";

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import styles from './PdfPasswdClient.module.css';
import { useLanguage } from '@/lib/LanguageContext';
import {
  IoCloudUploadOutline,
  IoDownloadOutline,
  IoShieldCheckmarkOutline,
  IoDocumentTextOutline,
  IoRefreshOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoLockClosedOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
} from 'react-icons/io5';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';

export default function PdfPasswdClient() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProtecting, setIsProtecting] = useState(false);
  const [protectedPdfUrl, setProtectedPdfUrl] = useState<string | null>(null);
  const [protectedFileName, setProtectedFileName] = useState<string>('protected.pdf');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf')) {
        setFile(selectedFile);
        setPassword('');
        setConfirmPassword('');
        setProtectedPdfUrl(null);
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
        setPassword('');
        setConfirmPassword('');
        setProtectedPdfUrl(null);
      } else {
        alert('Please upload PDF files only.');
      }
    }
  };

  const handleReset = () => {
    setFile(null);
    setPassword('');
    setConfirmPassword('');
    setProtectedPdfUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isPasswordEntered = password.trim().length > 0;
  const isConfirmEntered = confirmPassword.trim().length > 0;
  const isMatch = isPasswordEntered && isConfirmEntered && password === confirmPassword;
  const isFormValid = isMatch;

  const protectPdf = async () => {
    if (!file || !isFormValid) return;

    setIsProtecting(true);

    try {
      const arrayBuffer = await file.arrayBuffer();

      // Client-side WebCrypto PDF password encryption using AES/Standard Security
      const encryptedBytes = await encryptPDF(new Uint8Array(arrayBuffer), password);
      const blob = new Blob([encryptedBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const baseName = file.name.replace(/\.pdf$/i, '');
      setProtectedFileName(`${baseName}_protected.pdf`);
      setProtectedPdfUrl(url);
    } catch (err: any) {
      console.error('Failed to encrypt PDF:', err);
      alert(`PDF 암호화 오류: ${err?.message || '파일을 확인해 주세요.'}`);
    } finally {
      setIsProtecting(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.badgeTitle}>{t.badge}</span>
        <h1 className={styles.title}>
          <span>PDF 🔑 PDF</span>
        </h1>
        <p className={styles.subtitle}>{t.pdfpasswd.subtitle}</p>
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
          <div className={styles.dropText}>{t.pdfpasswd.dropText}</div>
          <div className={styles.subText}>{t.pdfpasswd.subText}</div>
          <button className={styles.selectBtn}>{t.pdfpasswd.selectBtn}</button>
          <input
            type="file"
            accept=".pdf,application/pdf"
            ref={fileInputRef}
            onChange={handleFileChange}
            className={styles.hiddenInput}
          />
        </div>
      )}

      {/* Password Setting Card Container */}
      {file && (
        <div className={styles.passwdContainer}>
          <div className={styles.fileSummary}>
            <div className={styles.fileInfoLeft}>
              <IoDocumentTextOutline size={24} color="#4285f4" />
              <span className={styles.fileName}>{file.name}</span>
            </div>
            <button onClick={handleReset} className={styles.resetBtn}>
              <IoRefreshOutline size={14} />
              {t.pdfpasswd.newFile}
            </button>
          </div>

          {!protectedPdfUrl ? (
            <form onSubmit={(e) => { e.preventDefault(); protectPdf(); }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>{t.pdfpasswd.passwordLabel}</label>
                <div className={styles.inputWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={styles.input}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.pdfpasswd.passwordPlaceholder}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle Password Visibility"
                  >
                    {showPassword ? <IoEyeOffOutline size={20} /> : <IoEyeOutline size={20} />}
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{t.pdfpasswd.confirmPasswordLabel}</label>
                <div className={styles.inputWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={styles.input}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t.pdfpasswd.confirmPasswordPlaceholder}
                  />
                </div>

                {/* Password Validation Indicator */}
                {isConfirmEntered && (
                  <div style={{ marginTop: '8px', fontSize: '13px' }}>
                    {isMatch ? (
                      <span style={{ color: '#36b27e', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <IoCheckmarkCircleOutline size={16} /> 비밀번호가 일치합니다.
                      </span>
                    ) : (
                      <span style={{ color: '#ea4335', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <IoAlertCircleOutline size={16} /> {t.pdfpasswd.passwordMismatch}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isProtecting || !isFormValid}
                className={styles.protectMainBtn}
              >
                {isProtecting ? (
                  <span>{t.pdfpasswd.protecting}</span>
                ) : (
                  <>
                    <IoLockClosedOutline size={20} />
                    <span>{t.pdfpasswd.protectBtn}</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className={styles.successBox}>
              <div className={styles.successText}>{t.pdfpasswd.successText}</div>
              <a
                href={protectedPdfUrl}
                download={protectedFileName}
                className={styles.downloadBtn}
              >
                <IoDownloadOutline size={22} />
                {t.pdfpasswd.downloadBtn}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
