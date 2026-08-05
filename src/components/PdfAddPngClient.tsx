"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './PdfAddPngClient.module.css';
import { useLanguage } from '@/lib/LanguageContext';
import { PDFDocument, degrees } from 'pdf-lib';
import {
  IoCloudUploadOutline,
  IoShieldCheckmarkOutline,
  IoRefreshOutline,
  IoDownloadOutline,
  IoCheckmarkCircleOutline,
  IoImageOutline,
  IoMoveOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
} from 'react-icons/io5';

type TargetPagesMode = 'current' | 'all';

export default function PdfAddPngClient() {
  const { t } = useLanguage();

  // PDF File States
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isPdfDragOver, setIsPdfDragOver] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1); // 1-indexed

  // PNG/Image File States
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  // Image Control Settings
  const [targetPages, setTargetPages] = useState<TargetPagesMode>('current');
  const [imgWidth, setImgWidth] = useState(150); // Width in px / pt
  const [opacity, setOpacity] = useState(100); // 10 ~ 100
  const [rotation, setRotation] = useState(0); // -180 ~ 180
  const [imgRatioPos, setImgRatioPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 }); // Center by default

  // Canvas Dragging State
  const [isDraggingOnCanvas, setIsDraggingOnCanvas] = useState(false);

  // Canvas Refs
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfBgCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Action States
  const [applying, setApplying] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  // Dynamic loader for PDF.js
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
          reject(new Error('PDF.js failed to initialize'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load PDF.js'));
      document.head.appendChild(script);
    });
  };

  // Render current PDF page into background canvas
  const renderPdfPage = useCallback(
    async (file: File, pageNum: number) => {
      try {
        const pdfjsLib = await getPdfJsLib();
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setPageCount(pdfDoc.numPages);

        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });

        const bgCanvas = document.createElement('canvas');
        bgCanvas.width = viewport.width;
        bgCanvas.height = viewport.height;
        const ctx = bgCanvas.getContext('2d');

        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          pdfBgCanvasRef.current = bgCanvas;
          renderPreview();
        }
      } catch (err) {
        console.error('PDF Page render error:', err);
      }
    },
    []
  );

  // Render combined preview (PDF background + PNG Image Overlay)
  const renderPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    const bgCanvas = pdfBgCanvasRef.current;
    if (!canvas || !bgCanvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = bgCanvas.width;
    canvas.height = bgCanvas.height;

    // Draw PDF page background
    ctx.drawImage(bgCanvas, 0, 0);

    // Draw PNG image if loaded
    if (imgElement) {
      ctx.save();
      const w = canvas.width;
      const h = canvas.height;

      const centerX = (w * imgRatioPos.x) / 100;
      const centerY = (h * imgRatioPos.y) / 100;

      // Scale image relative to canvas rendering scale (1.5)
      const scaledWidth = imgWidth * 1.5;
      const aspectRatio = imgElement.height / imgElement.width;
      const scaledHeight = scaledWidth * aspectRatio;

      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.globalAlpha = opacity / 100;

      ctx.drawImage(
        imgElement,
        -scaledWidth / 2,
        -scaledHeight / 2,
        scaledWidth,
        scaledHeight
      );

      // Selection outline
      ctx.strokeStyle = '#4285f4';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(
        -scaledWidth / 2 - 2,
        -scaledHeight / 2 - 2,
        scaledWidth + 4,
        scaledHeight + 4
      );

      ctx.restore();
    }
  }, [imgElement, imgRatioPos, imgWidth, opacity, rotation]);

  // Re-render when settings or current page change
  useEffect(() => {
    if (pdfFile) {
      renderPdfPage(pdfFile, currentPage);
    }
  }, [pdfFile, currentPage, renderPdfPage]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  // Handle PDF file selection
  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setPdfFile(selected);
      setCurrentPage(1);
      setDownloaded(false);
      setDownloadUrl(null);
    }
  };

  // Handle Image (PNG/JPG) file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const imageFile = e.target.files[0];
      setImgFile(imageFile);

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          setImgElement(img);
        };
      };
      reader.readAsDataURL(imageFile);
    }
  };

  // Update image position from mouse/touch event on canvas wrapper
  const updatePosFromEvent = (
    e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>
  ) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const xRatio = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const yRatio = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));

    setImgRatioPos({ x: xRatio, y: yRatio });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    if (!imgElement) return;
    setIsDraggingOnCanvas(true);
    updatePosFromEvent(e);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (isDraggingOnCanvas) {
      updatePosFromEvent(e);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingOnCanvas(false);
  };

  // Embed Image into PDF using pdf-lib
  // Embed Image into PDF using pdf-lib
  const handleApplyImage = async () => {
    if (!pdfFile || !imgFile || !imgElement) return;

    setApplying(true);
    try {
      const pdfArrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
      const imageArrayBuffer = await imgFile.arrayBuffer();

      let embeddedImage;
      const isPng = imgFile.type.includes('png') || imgFile.name.toLowerCase().endsWith('.png');
      const isJpg =
        imgFile.type.includes('jpeg') ||
        imgFile.type.includes('jpg') ||
        imgFile.name.toLowerCase().endsWith('.jpg') ||
        imgFile.name.toLowerCase().endsWith('.jpeg');

      try {
        if (isPng) {
          embeddedImage = await pdfDoc.embedPng(imageArrayBuffer);
        } else if (isJpg) {
          embeddedImage = await pdfDoc.embedJpg(imageArrayBuffer);
        } else {
          // Canvas fallback for WebP, GIF, BMP, etc.
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = imgElement.naturalWidth || imgElement.width;
          tempCanvas.height = imgElement.naturalHeight || imgElement.height;
          const ctx = tempCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(imgElement, 0, 0);
            const dataUrl = tempCanvas.toDataURL('image/png');
            const base64Data = dataUrl.split(',')[1];
            const pngBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
            embeddedImage = await pdfDoc.embedPng(pngBytes);
          } else {
            throw new Error('Canvas context unavailable');
          }
        }
      } catch (err) {
        // Fallback: draw imgElement on canvas to get PNG bytes
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imgElement.naturalWidth || imgElement.width;
        tempCanvas.height = imgElement.naturalHeight || imgElement.height;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(imgElement, 0, 0);
          const dataUrl = tempCanvas.toDataURL('image/png');
          const base64Data = dataUrl.split(',')[1];
          const pngBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
          embeddedImage = await pdfDoc.embedPng(pngBytes);
        } else {
          throw err;
        }
      }

      const totalPagesInDoc = pdfDoc.getPageCount();
      const pagesToProcess =
        targetPages === 'all'
          ? Array.from({ length: totalPagesInDoc }, (_, i) => i)
          : [currentPage - 1];

      const aspectRatio = imgElement.height / imgElement.width;
      const targetWidth = imgWidth;
      const targetHeight = targetWidth * aspectRatio;

      pagesToProcess.forEach((pageIdx) => {
        const page = pdfDoc.getPage(pageIdx);
        const { width: pageW, height: pageH } = page.getSize();

        // Convert percentage ratio to PDF points (PDF (0,0) is bottom-left)
        const pdfX = (pageW * imgRatioPos.x) / 100 - targetWidth / 2;
        const pdfY = pageH - (pageH * imgRatioPos.y) / 100 - targetHeight / 2;

        page.drawImage(embeddedImage, {
          x: pdfX,
          y: pdfY,
          width: targetWidth,
          height: targetHeight,
          opacity: opacity / 100,
          rotate: degrees(-rotation),
        });
      });

      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(modifiedPdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);
      setDownloaded(true);
    } catch (err) {
      console.error('Error embedding image into PDF:', err);
      alert('PDF에 이미지(PNG/JPG)를 적용하는 도중 오류가 발생했습니다.');
    } finally {
      setApplying(false);
    }
  };

  const handleReset = () => {
    setPdfFile(null);
    setImgFile(null);
    setImgElement(null);
    setDownloaded(false);
    setDownloadUrl(null);
    setPageCount(0);
    setCurrentPage(1);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.badgeTitle}>{(t.pdfxxx as any)?.badgeTitle || 'Insert Logo & Image (PNG / JPG)'}</span>
        <h1 className={styles.title}>{(t.pdfxxx as any)?.title || 'PDF + LOGO'}</h1>
        <p className={styles.subtitle}>
          {(t.pdfxxx as any)?.subtitle || '서버 업로드 없이 100% 브라우저 내부에서 안전하고 빠르게 PDF 문서 원하는 위치에 대표로고, 직인, PNG/JPG 이미지를 추가합니다.'}
        </p>
      </div>

      {/* Privacy Banner */}
      <div className={styles.privacyBanner}>
        <IoShieldCheckmarkOutline size={18} />
        <span>{t.privacy?.banner || '100% 개인정보 안전: 모든 파일 처리가 내 컴퓨터 브라우저 내부에서 바로 진행됩니다.'}</span>
      </div>

      {/* Step 1: Upload PDF */}
      {!pdfFile ? (
        <div
          className={`${styles.dropzone} ${isPdfDragOver ? styles.dropzoneActive : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsPdfDragOver(true);
          }}
          onDragLeave={() => setIsPdfDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsPdfDragOver(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              setPdfFile(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => pdfInputRef.current?.click()}
        >
          <input
            type="file"
            ref={pdfInputRef}
            onChange={handlePdfChange}
            accept=".pdf"
            className="hidden"
          />
          <IoCloudUploadOutline size={64} className={styles.uploadIcon} />
          <h3 className={styles.dropText}>{(t.pdfxxx as any)?.dropText || '대표로고 및 PNG/JPG 이미지를 추가할 PDF 파일을 드래그하거나 클릭하세요'}</h3>
          <p className={styles.subText}>{(t.pdfxxx as any)?.subText || '최대 용량 제한 없이 무료로 이용 가능합니다.'}</p>
          <button className={styles.selectBtn}>{(t.pdfxxx as any)?.selectBtn || 'PDF 파일 선택'}</button>
        </div>
      ) : downloaded && downloadUrl ? (
        /* Success Card */
        <div className={styles.successCard}>
          <IoCheckmarkCircleOutline size={60} color="#36b27e" className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">{(t.pdfxxx as any)?.successTitle || '✅ PDF에 이미지 삽입 완료!'}</h2>
          <p className="text-gray-300 mb-6">{(t.pdfxxx as any)?.successSub || '아래 버튼을 눌러 새 PDF 문서를 다운로드하세요.'}</p>

          <div className="flex justify-center gap-4">
            <a
              href={downloadUrl}
              download={`${pdfFile.name.replace(/\.pdf$/i, '')}_with_logo.pdf`}
              className={styles.downloadBtn}
            >
              <IoDownloadOutline size={22} />
              {(t.pdfxxx as any)?.downloadBtn || '이미지 포함된 PDF 다운로드'}
            </a>
            <button onClick={handleReset} className={styles.resetBtn}>
              {(t.pdfxxx as any)?.newFile || '새 파일 작업'}
            </button>
          </div>
        </div>
      ) : (
        /* Step 2: Editor Grid */
        <div className="space-y-6">
          <div className={styles.editorGrid}>
            {/* Control Panel */}
            <div className={styles.controlPanel}>
              <h3 className={styles.panelSectionTitle}>
                <IoImageOutline size={20} color="#4285f4" />
                {(t.pdfxxx as any)?.sectionImageSelect || '1. 대표로고 / PNG·JPG 이미지 선택'}
              </h3>

              {/* Upload Image */}
              {!imgElement ? (
                <div
                  className={styles.stampDropzone}
                  onClick={() => imgInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={imgInputRef}
                    onChange={handleImageChange}
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/*"
                    className="hidden"
                  />
                  <IoCloudUploadOutline size={32} color="#4285f4" />
                  <span className="text-sm font-semibold text-white">{(t.pdfxxx as any)?.imageSelectBtn || 'PNG / JPG / 이미지 파일 선택'}</span>
                  <span className="text-xs text-emerald-400">{(t.pdfxxx as any)?.imageSelectTip || '💡 PNG, JPG, WebP 이미지 지원'}</span>
                </div>
              ) : (
                <div className={styles.stampPreviewBox}>
                  <img
                    src={imgElement.src}
                    alt="Image Preview"
                    className={styles.stampThumb}
                  />
                  <div className="flex flex-col flex-1 mx-3">
                    <span className="text-xs font-semibold text-white truncate max-w-[140px]">
                      {imgFile?.name}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {imgFile?.type.includes('png')
                        ? 'PNG'
                        : imgFile?.type.includes('jpeg') || imgFile?.type.includes('jpg')
                        ? 'JPG'
                        : imgFile?.type.toUpperCase()}
                    </span>
                  </div>
                  <button
                    onClick={() => imgInputRef.current?.click()}
                    className={styles.stampChangeBtn}
                  >
                    {(t.pdfxxx as any)?.imageChangeBtn || '변경'}
                  </button>
                  <input
                    type="file"
                    ref={imgInputRef}
                    onChange={handleImageChange}
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/*"
                    className="hidden"
                  />
                </div>
              )}

              <hr className="border-gray-800 my-2" />

              <h3 className={styles.panelSectionTitle}>
                <IoMoveOutline size={20} color="#4285f4" />
                {(t.pdfxxx as any)?.sectionOptions || '2. 이미지 위치 및 옵션 설정'}
              </h3>

              {/* Target Pages */}
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel}>{(t.pdfxxx as any)?.targetPagesLabel || '적용할 페이지 선택:'}</label>
                <select
                  value={targetPages}
                  onChange={(e) => setTargetPages(e.target.value as TargetPagesMode)}
                  className={styles.selectInput}
                >
                  <option value="current">
                    {((t.pdfxxx as any)?.currentPageOnly || '현재 페이지에만 적용 (p.{page})').replace('{page}', String(currentPage))}
                  </option>
                  <option value="all">
                    {((t.pdfxxx as any)?.allPages || '전체 페이지에 모두 적용 (총 {total}p)').replace('{total}', String(pageCount))}
                  </option>
                </select>
              </div>

              {/* Image Size */}
              <div className={styles.controlGroup}>
                <div className={styles.controlLabel}>
                  <span>{(t.pdfxxx as any)?.sizeLabel || '이미지 크기 (너비)'}</span>
                  <span className={styles.controlValue}>{imgWidth}px</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={500}
                  value={imgWidth}
                  onChange={(e) => setImgWidth(Number(e.target.value))}
                  className={styles.rangeInput}
                />
              </div>

              {/* Opacity */}
              <div className={styles.controlGroup}>
                <div className={styles.controlLabel}>
                  <span>{(t.pdfxxx as any)?.opacityLabel || '불투명도'}</span>
                  <span className={styles.controlValue}>{opacity}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className={styles.rangeInput}
                />
              </div>

              {/* Rotation */}
              <div className={styles.controlGroup}>
                <div className={styles.controlLabel}>
                  <span>{(t.pdfxxx as any)?.rotationLabel || '회전 각도'}</span>
                  <span className={styles.controlValue}>{rotation}°</span>
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className={styles.rangeInput}
                />
              </div>
            </div>

            {/* Canvas Preview Panel */}
            <div className={styles.previewPanel}>
              <div className={styles.previewHeader}>
                <span className="text-sm font-semibold text-gray-300 truncate max-w-[200px]">
                  📄 {pdfFile.name}
                </span>

                {/* Page Navigator */}
                <div className={styles.pageNav}>
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={styles.pageNavBtn}
                  >
                    <IoChevronBackOutline size={18} />
                  </button>
                  <span className="text-sm font-bold text-white">
                    {((t.pdfxxx as any)?.pageIndicator || '{current} / {total} 페이지')
                      .replace('{current}', String(currentPage))
                      .replace('{total}', String(pageCount))}
                  </span>
                  <button
                    disabled={currentPage >= pageCount}
                    onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
                    className={styles.pageNavBtn}
                  >
                    <IoChevronForwardOutline size={18} />
                  </button>
                </div>
              </div>

              {/* Canvas Interactive Wrapper */}
              <div
                className={styles.canvasWrapper}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onTouchStart={updatePosFromEvent}
                onTouchMove={updatePosFromEvent}
              >
                <canvas ref={previewCanvasRef} />
              </div>

              <div className={styles.dragOverlayTip}>
                <IoMoveOutline size={16} />
                <span>{(t.pdfxxx as any)?.dragTip || '미리보기 화면을 클릭하거나 드래그하여 이미지 위치를 이동하세요.'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionArea}>
            <button
              onClick={handleApplyImage}
              disabled={!imgElement || applying}
              className={styles.applyBtn}
            >
              {applying ? (
                (t.pdfxxx as any)?.applying || 'PDF에 이미지 합성 중...'
              ) : (
                <>
                  <IoShieldCheckmarkOutline size={20} />
                  {(t.pdfxxx as any)?.applyBtn || 'PDF에 이미지 적용하고 저장하기 ➔'}
                </>
              )}
            </button>

            <button onClick={handleReset} className={styles.resetBtn}>
              <IoRefreshOutline size={18} className="inline mr-1" />
              {(t.pdfxxx as any)?.newFile || '새 파일'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
