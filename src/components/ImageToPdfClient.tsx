"use client";

import { useState, useRef } from 'react';
import styles from './ImageToPdfClient.module.css';
import { useLanguage } from '@/lib/LanguageContext';
import { PDFDocument } from 'pdf-lib';
import {
  IoCloudUploadOutline,
  IoShieldCheckmarkOutline,
  IoDownloadOutline,
  IoCheckmarkCircleOutline,
  IoImagesOutline,
  IoAddOutline,
  IoTrashOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoOptionsOutline,
} from 'react-icons/io5';

interface ImageFileItem {
  id: string;
  file: File;
  previewUrl: string;
}

type PageSizeMode = 'fit' | 'a4';
type OrientationMode = 'auto' | 'portrait' | 'landscape';

export default function ImageToPdfClient() {
  const { t } = useLanguage();
  const tImg = (t as any).img2pdf || {};

  // Image Files List State
  const [images, setImages] = useState<ImageFileItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Layout & Page Options
  const [pageSize, setPageSize] = useState<PageSizeMode>('a4');
  const [orientation, setOrientation] = useState<OrientationMode>('auto');
  const [margin, setMargin] = useState<number>(0); // 0pt, 10pt, 20pt

  // Processing & Export States
  const [converting, setConverting] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  // Handle image files selection
  const handleFilesSelect = (filesList: FileList | null) => {
    if (!filesList) return;
    const validImageFiles: ImageFileItem[] = [];

    Array.from(filesList).forEach((file) => {
      if (file.type.startsWith('image/')) {
        validImageFiles.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }
    });

    if (validImageFiles.length > 0) {
      setImages((prev) => [...prev, ...validImageFiles]);
      setDownloaded(false);
      setDownloadUrl(null);
    }
  };

  // Reorder images
  const moveImage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    setImages((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  const deleteImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  const resetAll = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setDownloaded(false);
    setDownloadUrl(null);
  };

  // Convert Images to PNG/JPG Data URL helper
  const convertFileToEmbeddableBytes = async (
    file: File
  ): Promise<{ bytes: ArrayBuffer; format: 'jpg' | 'png' }> => {
    const arrayBuffer = await file.arrayBuffer();
    const type = file.type.toLowerCase();

    if (type === 'image/jpeg' || type === 'image/jpg') {
      return { bytes: arrayBuffer, format: 'jpg' };
    }

    if (type === 'image/png') {
      return { bytes: arrayBuffer, format: 'png' };
    }

    // For WebP, GIF, or other image types, draw to Canvas and export PNG
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.src = url;
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          const pngBuffer = await fetch(dataUrl).then((res) => res.arrayBuffer());
          URL.revokeObjectURL(url);
          resolve({ bytes: pngBuffer, format: 'png' });
        } else {
          URL.revokeObjectURL(url);
          reject(new Error('Canvas context creation failed'));
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image file'));
      };
    });
  };

  // Convert selected images to PDF
  const handleConvertToPdf = async () => {
    if (images.length === 0) return;

    setConverting(true);
    try {
      const pdfDoc = await PDFDocument.create();

      // Standard A4 dimensions in points (72 DPI)
      const A4_WIDTH = 595.28;
      const A4_HEIGHT = 841.89;

      for (const item of images) {
        const { bytes, format } = await convertFileToEmbeddableBytes(item.file);
        const embeddedImage =
          format === 'jpg'
            ? await pdfDoc.embedJpg(bytes)
            : await pdfDoc.embedPng(bytes);

        const imgWidth = embeddedImage.width;
        const imgHeight = embeddedImage.height;

        let pageWidth = imgWidth;
        let pageHeight = imgHeight;

        if (pageSize === 'a4') {
          // Determine A4 orientation
          let isLandscape = false;
          if (orientation === 'landscape') {
            isLandscape = true;
          } else if (orientation === 'portrait') {
            isLandscape = false;
          } else {
            // Auto: match image aspect ratio
            isLandscape = imgWidth > imgHeight;
          }

          pageWidth = isLandscape ? A4_HEIGHT : A4_WIDTH;
          pageHeight = isLandscape ? A4_WIDTH : A4_HEIGHT;
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Calculate printable area taking margin into account
        const availWidth = pageWidth - margin * 2;
        const availHeight = pageHeight - margin * 2;

        const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight);
        const drawWidth = imgWidth * scale;
        const drawHeight = imgHeight * scale;

        const drawX = (pageWidth - drawWidth) / 2;
        const drawY = (pageHeight - drawHeight) / 2;

        page.drawImage(embeddedImage, {
          x: drawX,
          y: drawY,
          width: drawWidth,
          height: drawHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);
      setDownloaded(true);
    } catch (err) {
      console.error('Image to PDF conversion error:', err);
      alert(tImg.errorMsg || '이미지를 PDF로 변환하는 도중 오류가 발생했습니다.');
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header Banner */}
      <div className={styles.hero}>
        <div className={styles.badge}>
          <IoShieldCheckmarkOutline /> {tImg.badge || 'Browser-based Image to PDF Converter'}
        </div>
        <h1 className={styles.title}>{tImg.title || 'JPG/PNG ➡️ PDF 변환'}</h1>
        <p className={styles.subtitle}>{tImg.subtitle || '서버 업로드 없이 100% 내 컴퓨터 브라우저 내부에서 여러 장의 이미지(JPG, PNG, WebP)를 깔끔하게 하나의 PDF로 묶어 만듭니다.'}</p>

        <div className={styles.privacyBanner}>
          <IoShieldCheckmarkOutline color="#36b27e" />
          <span>100% Client-Side Privacy Protection — Zero Server Upload</span>
        </div>
      </div>

      {/* Step 1: Upload Drop Zone */}
      {images.length === 0 && (
        <div
          className={`${styles.dropZone} ${isDragOver ? styles.dragOver : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            handleFilesSelect(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <IoCloudUploadOutline className={styles.uploadIcon} />
          <h3 className={styles.dropText}>{tImg.dropText || 'PDF로 변환할 이미지 파일들을 이곳에 드래그하거나 클릭하세요'}</h3>
          <p className={styles.subText}>{tImg.subText || 'JPG, PNG, WebP, GIF 이미지를 여러 장 선택할 수 있습니다.'}</p>
          <button className={styles.selectBtn} type="button">
            {tImg.selectBtn || '이미지 파일들 선택'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            className={styles.hiddenInput}
            onChange={(e) => handleFilesSelect(e.target.files)}
          />
        </div>
      )}

      {/* Step 2: Images Reorder & Page Layout Options */}
      {images.length > 0 && !downloaded && (
        <div className={styles.editorGrid}>
          {/* Left Panel: Thumbnails Grid & Order */}
          <div className={styles.panelCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <IoImagesOutline color="#4285f4" size={22} />
                <span>
                  {tImg.sectionImages
                    ? tImg.sectionImages.replace('{count}', images.length.toString())
                    : `1. 선택된 이미지 목록 및 순서 (총 ${images.length}장)`}
                </span>
              </div>
              <div className={styles.headerActions}>
                <button
                  className={styles.smallBtn}
                  onClick={() => addFileInputRef.current?.click()}
                  type="button"
                >
                  <IoAddOutline size={16} /> {tImg.addMoreImages || '이미지 추가'}
                </button>
                <button className={styles.smallBtn} onClick={resetAll} type="button">
                  {tImg.reset || '초기화'}
                </button>
                <input
                  ref={addFileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className={styles.hiddenInput}
                  onChange={(e) => handleFilesSelect(e.target.files)}
                />
              </div>
            </div>

            <div className={styles.thumbGrid}>
              {images.map((item, index) => (
                <div key={item.id} className={styles.thumbCard}>
                  <span className={styles.pageIndexBadge}>p.{index + 1}</span>
                  <div className={styles.thumbImgWrapper}>
                    <img src={item.previewUrl} alt={item.file.name} className={styles.thumbImg} />
                  </div>
                  <div className={styles.imgInfo} title={item.file.name}>
                    {item.file.name}
                  </div>

                  <div className={styles.thumbCardActions}>
                    <button
                      className={styles.actionIconBtn}
                      disabled={index === 0}
                      onClick={() => moveImage(index, 'up')}
                      title={tImg.moveUp || '위로 이동'}
                    >
                      <IoArrowUpOutline size={14} />
                    </button>
                    <button
                      className={styles.actionIconBtn}
                      disabled={index === images.length - 1}
                      onClick={() => moveImage(index, 'down')}
                      title={tImg.moveDown || '아래로 이동'}
                    >
                      <IoArrowDownOutline size={14} />
                    </button>
                    <button
                      className={`${styles.actionIconBtn} ${styles.actionIconBtnDanger}`}
                      onClick={() => deleteImage(item.id)}
                      title={tImg.delete || '삭제'}
                    >
                      <IoTrashOutline size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Layout Settings & Convert Button */}
          <div className={styles.panelCard}>
            <div className={styles.sectionTitle} style={{ marginBottom: '1.25rem' }}>
              <IoOptionsOutline color="#8ab4f8" size={20} />
              <span>{tImg.sectionOptions || '2. PDF 페이지 설정 및 레이아웃'}</span>
            </div>

            {/* Page Size */}
            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <span>{tImg.pageSizeLabel || '페이지 크기 규격'}</span>
              </div>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as PageSizeMode)}
                className={styles.selectInput}
              >
                <option value="a4">{tImg.sizeA4 || '표준 A4 크기 (210 x 297 mm)'}</option>
                <option value="fit">{tImg.sizeFit || '이미지 원본 비율/크기 맞춤'}</option>
              </select>
            </div>

            {/* Orientation */}
            {pageSize === 'a4' && (
              <div className={styles.formGroup}>
                <div className={styles.labelRow}>
                  <span>{tImg.orientationLabel || '페이지 방향'}</span>
                </div>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as OrientationMode)}
                  className={styles.selectInput}
                >
                  <option value="auto">{tImg.orientAuto || '자동 (이미지 비율에 맞춤)'}</option>
                  <option value="portrait">{tImg.orientPortrait || '세로 (Portrait)'}</option>
                  <option value="landscape">{tImg.orientLandscape || '가로 (Landscape)'}</option>
                </select>
              </div>
            )}

            {/* Margins */}
            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <span>{tImg.marginLabel || '페이지 여백'}</span>
              </div>
              <select
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className={styles.selectInput}
              >
                <option value={0}>{tImg.marginNone || '여백 없음 (0pt - 꽉 차게)'}</option>
                <option value={10}>{tImg.marginSmall || '좁은 여백 (10pt)'}</option>
                <option value={20}>{tImg.marginNormal || '보통 여백 (20pt)'}</option>
              </select>
            </div>

            {/* Convert Button */}
            <button
              className={styles.convertPrimaryBtn}
              onClick={handleConvertToPdf}
              disabled={converting || images.length === 0}
            >
              <IoCheckmarkCircleOutline size={22} />
              <span>
                {converting
                  ? tImg.converting || 'PDF 문서 결합 변환 중...'
                  : tImg.convertBtn
                  ? tImg.convertBtn.replace('{count}', images.length.toString())
                  : `🖼️ ${images.length}장 이미지를 PDF로 변환하기 ➔`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success Screen */}
      {downloaded && downloadUrl && (
        <div className={styles.successCard}>
          <IoCheckmarkCircleOutline className={styles.successIcon} />
          <h2 className={styles.successTitle}>{tImg.successTitle || '✅ PDF 변환 완료!'}</h2>
          <p className={styles.successSub}>{tImg.successSub || '아래 버튼을 눌러 결합된 새 PDF 문서를 다운로드하세요.'}</p>

          <a
            href={downloadUrl}
            download={`converted_images_${Date.now()}.pdf`}
            className={styles.downloadBtn}
          >
            <IoDownloadOutline size={22} />
            <span>{tImg.downloadBtn || '변환된 PDF 다운로드'}</span>
          </a>

          <button className={styles.resetBtn} onClick={resetAll} type="button">
            {tImg.newFile || '새 파일 작업'}
          </button>
        </div>
      )}
    </div>
  );
}
