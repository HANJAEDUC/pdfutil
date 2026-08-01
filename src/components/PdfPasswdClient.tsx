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
  IoKeyOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoLockClosedOutline,
} from 'react-icons/io5';
import { PDFDocument } from 'pdf-lib';

export default function PdfPasswdClient() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
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
        setErrorMsg('');
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
        setErrorMsg('');
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
    setErrorMsg('');
    setProtectedPdfUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const protectPdf = async () => {
    if (!file) return;

    if (!password.trim()) {
      setErrorMsg(t.pdfpasswd.emptyPassword);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(t.pdfpasswd.passwordMismatch);
      return;
    }

    setErrorMsg('');
    setIsProtecting(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

      // Encrypt PDF using pdf-lib Standard Security
      const encryptedPdfBytes = await pdfDoc.save({
        userPassword: password,
        ownerPassword: password,
      } as any);
      const blob = new Blob([encryptedPdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const baseName = file.name.replace(/\.pdf$/i, '');
      setProtectedFileName(`${baseName}_protected.pdf`);
      setProtectedPdfUrl(url);
    } catch (err: any) {
      console.error('Failed to encrypt PDF:', err);
      alert(`Error setting password for PDF: ${err?.message || 'Please try another file.'}`);
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
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMsg('');
                    }}
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
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder={t.pdfpasswd.confirmPasswordPlaceholder}
                  />
                </div>
                {errorMsg && <div className={styles.errorText}>{errorMsg}</div>}
              </div>

              <button
                type="submit"
                disabled={isProtecting || !password.trim() || !confirmPassword.trim()}
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
