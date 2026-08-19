"use client";

import { useState, useRef, useEffect } from 'react';
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
  IoRefreshOutline,
  IoEyeOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
} from 'react-icons/io5';

interface ImageFileItem {
  id: string;
  file: File;
  previewUrl: string;
  rotation: number;
}

export default function ImageToPdfClient() {
  const { t } = useLanguage();
  const tImg = (t as any).img2pdf || {};

  // Image Files List State
  const [images, setImages] = useState<ImageFileItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);

  // Layout Options
  const [margin, setMargin] = useState<number>(0); // 0pt, 10pt, 20pt

  // Processing & Export States
  const [converting, setConverting] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Render live PDF page preview on canvas whenever options or selected image changes
  useEffect(() => {
    if (images.length === 0) return;
    const safeIndex = Math.min(selectedPageIndex, images.length - 1);
    const item = images[safeIndex];
    if (!item) return;

    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = item.previewUrl;
    img.onload = () => {
      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;

      const rotation = ((item.rotation % 360) + 360) % 360;
      const isSwap = rotation === 90 || rotation === 270;
      const imgW = isSwap ? origH : origW;
      const imgH = isSwap ? origW : origH;

      const marginPx = margin;
      const pageW = imgW + marginPx * 2;
      const pageH = imgH + marginPx * 2;

      canvas.width = pageW;
      canvas.height = pageH;

      // Fill background (white paper sheet)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageW, pageH);

      const availW = pageW - marginPx * 2;
      const availH = pageH - marginPx * 2;

      const scale = Math.min(availW / imgW, availH / imgH);
      const drawW = imgW * scale;
      const drawH = imgH * scale;

      const drawX = (pageW - drawW) / 2;
      const drawY = (pageH - drawH) / 2;

      ctx.save();
      ctx.translate(drawX + drawW / 2, drawY + drawH / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(
        img,
        (-origW / 2) * scale,
        (-origH / 2) * scale,
        origW * scale,
        origH * scale
      );
      ctx.restore();

      // Subtle page border
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = Math.max(1, pageW / 500);
      ctx.strokeRect(0, 0, pageW, pageH);
    };
  }, [images, selectedPageIndex, margin]);

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
          rotation: 0,
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

    if (selectedPageIndex === index) {
      setSelectedPageIndex(targetIndex);
    } else if (selectedPageIndex === targetIndex) {
      setSelectedPageIndex(index);
    }
  };

  // Rotate single image 90 degrees
  const rotateImage = (id: string, direction: 'cw' | 'ccw') => {
    setImages((prev) =>
      prev.map((img) => {
        if (img.id !== id) return img;
        const delta = direction === 'cw' ? 90 : 270;
        return {
          ...img,
          rotation: (img.rotation + delta) % 360,
        };
      })
    );
  };

  const deleteImage = (id: string) => {
    setImages((prev) => {
      const targetIndex = prev.findIndex((img) => img.id === id);
      if (targetIndex !== -1) {
        URL.revokeObjectURL(prev[targetIndex].previewUrl);
      }
      const updated = prev.filter((img) => img.id !== id);
      if (selectedPageIndex >= updated.length) {
        setSelectedPageIndex(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  };

  const resetAll = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setDownloaded(false);
    setDownloadUrl(null);
    setSelectedPageIndex(0);
  };

  // Convert Images to PNG/JPG Data URL helper with EXIF normalization & rotation
  const convertFileToEmbeddableBytes = (
    file: File,
    rotationDegrees: number = 0
  ): Promise<{ bytes: ArrayBuffer; format: 'jpg' | 'png'; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.src = url;

      img.onload = () => {
        try {
          const origW = img.naturalWidth || img.width;
          const origH = img.naturalHeight || img.height;

          const normRotation = ((rotationDegrees % 360) + 360) % 360;
          const rad = (normRotation * Math.PI) / 180;
          const isSwap = normRotation === 90 || normRotation === 270;

          const canvasW = isSwap ? origH : origW;
          const canvasH = isSwap ? origW : origH;

          const canvas = document.createElement('canvas');
          canvas.width = canvasW;
          canvas.height = canvasH;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(url);
            reject(new Error('Canvas context creation failed'));
            return;
          }

          // Draw image centered and rotated
          ctx.translate(canvasW / 2, canvasH / 2);
          ctx.rotate(rad);
          ctx.drawImage(img, -origW / 2, -origH / 2);

          const isPng = file.type.toLowerCase() === 'image/png';
          const format = isPng ? 'png' : 'jpg';
          const mime = isPng ? 'image/png' : 'image/jpeg';

          canvas.toBlob(
            async (blob) => {
              URL.revokeObjectURL(url);
              if (!blob) {
                reject(new Error('Canvas blob conversion failed'));
                return;
              }
              const bytes = await blob.arrayBuffer();
              resolve({ bytes, format, width: canvasW, height: canvasH });
            },
            mime,
            0.92
          );
        } catch (err) {
          URL.revokeObjectURL(url);
          reject(err);
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

      for (const item of images) {
        const { bytes, format, width: imgWidth, height: imgHeight } =
          await convertFileToEmbeddableBytes(item.file, item.rotation);

        const embeddedImage =
          format === 'jpg'
            ? await pdfDoc.embedJpg(bytes)
            : await pdfDoc.embedPng(bytes);

        // Auto Page size matching image aspect ratio + margin
        const pageWidth = imgWidth + margin * 2;
        const pageHeight = imgHeight + margin * 2;

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

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
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
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

  const safeSelectedPage = Math.min(selectedPageIndex, Math.max(0, images.length - 1));
  const currentPreviewItem = images[safeSelectedPage];

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
                <div
                  key={item.id}
                  className={`${styles.thumbCard} ${safeSelectedPage === index ? styles.thumbCardActive : ''}`}
                  onClick={() => setSelectedPageIndex(index)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className={styles.pageIndexBadge}>p.{index + 1}</span>
                  <div className={styles.thumbImgWrapper}>
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className={styles.thumbImg}
                      style={{
                        transform: `rotate(${item.rotation || 0}deg)`,
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </div>
                  <div className={styles.imgInfo} title={item.file.name}>
                    {item.file.name}
                  </div>

                  <div className={styles.thumbCardActions} onClick={(e) => e.stopPropagation()}>
                    <button
                      className={styles.actionIconBtn}
                      onClick={() => rotateImage(item.id, 'cw')}
                      title={tImg.rotateCw || '90° 시계방향 회전'}
                    >
                      <IoRefreshOutline size={14} />
                    </button>
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

            {/* Live Real-Time PDF Page Preview Card */}
            {currentPreviewItem && (
              <div className={styles.previewCard}>
                <div className={styles.previewHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <IoEyeOutline color="#8ab4f8" size={18} />
                    <span>실시간 PDF 페이지 미리보기 (p.{safeSelectedPage + 1})</span>
                  </div>
                  {images.length > 1 && (
                    <div className={styles.previewPageNav}>
                      <button
                        className={styles.navArrowBtn}
                        disabled={safeSelectedPage === 0}
                        onClick={() => setSelectedPageIndex((p) => Math.max(0, p - 1))}
                        type="button"
                      >
                        <IoChevronBackOutline size={14} />
                      </button>
                      <span>{safeSelectedPage + 1} / {images.length}</span>
                      <button
                        className={styles.navArrowBtn}
                        disabled={safeSelectedPage === images.length - 1}
                        onClick={() => setSelectedPageIndex((p) => Math.min(images.length - 1, p + 1))}
                        type="button"
                      >
                        <IoChevronForwardOutline size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div className={styles.previewCanvasWrapper}>
                  <canvas ref={previewCanvasRef} className={styles.previewCanvas} />
                </div>

                <div className={styles.previewControls}>
                  <button
                    className={styles.rotateBtn}
                    onClick={() => rotateImage(currentPreviewItem.id, 'cw')}
                    type="button"
                  >
                    <IoRefreshOutline size={18} />
                    <span>이미지 90° 회전</span>
                  </button>
                  <span className={styles.previewHint}>
                    💡 문서 글자가 눕혀져 있다면 위의 '90° 회전' 버튼을 눌러 바로잡으세요.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Layout Settings & Convert Button */}
          <div className={styles.panelCard}>
            <div className={styles.sectionTitle} style={{ marginBottom: '1.25rem' }}>
              <IoOptionsOutline color="#8ab4f8" size={20} />
              <span>{tImg.sectionOptions || '2. PDF 페이지 설정 및 레이아웃'}</span>
            </div>

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
