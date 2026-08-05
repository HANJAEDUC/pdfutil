"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './PdfStampClient.module.css';
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

export default function PdfStampClient() {
  const { t } = useLanguage();

  // PDF File States
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isPdfDragOver, setIsPdfDragOver] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1); // 1-indexed

  // Stamp Image States
  const [stampFile, setStampFile] = useState<File | null>(null);
  const [stampImgElement, setStampImgElement] = useState<HTMLImageElement | null>(null);

  // Settings
  const [targetPages, setTargetPages] = useState<TargetPagesMode>('current');
  const [stampWidth, setStampWidth] = useState(120); // Width in PDF points / px
  const [opacity, setOpacity] = useState(100); // 10 ~ 100
  const [rotation, setRotation] = useState(0); // -180 ~ 180
  const [stampRatioPos, setStampRatioPos] = useState<{ x: number; y: number }>({ x: 80, y: 80 }); // Percentage (0~100)

  // Dragging state on canvas
  const [isDraggingOnCanvas, setIsDraggingOnCanvas] = useState(false);

  // Canvas Refs
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfBgCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Action States
  const [applying, setApplying] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);

  // Load PDF.js helper
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

  // Render combined preview (PDF background + Stamp Overlay)
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

    // Draw Stamp Image if uploaded
    if (stampImgElement) {
      ctx.save();
      const w = canvas.width;
      const h = canvas.height;

      const centerX = (w * stampRatioPos.x) / 100;
      const centerY = (h * stampRatioPos.y) / 100;

      // Scale stamp relative to canvas scale (scale factor ~ 1.5)
      const scaledWidth = stampWidth * 1.5;
      const aspectRatio = stampImgElement.height / stampImgElement.width;
      const scaledHeight = scaledWidth * aspectRatio;

      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.globalAlpha = opacity / 100;

      ctx.drawImage(
        stampImgElement,
        -scaledWidth / 2,
        -scaledHeight / 2,
        scaledWidth,
        scaledHeight
      );

      // Draw dashed selection outline
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
  }, [stampImgElement, stampRatioPos, stampWidth, opacity, rotation]);

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

  // Handle Stamp image file selection
  const handleStampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const imgFile = e.target.files[0];
      setStampFile(imgFile);

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          setStampImgElement(img);
        };
      };
      reader.readAsDataURL(imgFile);
    }
  };

  // Handle Canvas Drag / Click to position Stamp
  const updateStampPosFromEvent = (e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
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

    setStampRatioPos({ x: xRatio, y: yRatio });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    if (!stampImgElement) return;
    setIsDraggingOnCanvas(true);
    updateStampPosFromEvent(e);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (isDraggingOnCanvas) {
      updateStampPosFromEvent(e);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingOnCanvas(false);
  };

  // Process and Embed Stamp into PDF using pdf-lib
  const handleApplyStamp = async () => {
    if (!pdfFile || !stampFile || !stampImgElement) return;

    setApplying(true);
    try {
      const pdfArrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
      const stampArrayBuffer = await stampFile.arrayBuffer();

      // Embed image based on file type
      let embeddedImage;
      const isPng = stampFile.type.includes('png') || stampFile.name.toLowerCase().endsWith('.png');
      if (isPng) {
        embeddedImage = await pdfDoc.embedPng(stampArrayBuffer);
      } else {
        embeddedImage = await pdfDoc.embedJpg(stampArrayBuffer);
      }

      const totalPagesInDoc = pdfDoc.getPageCount();
      const pagesToProcess =
        targetPages === 'all'
          ? Array.from({ length: totalPagesInDoc }, (_, i) => i)
          : [currentPage - 1];

      const aspectRatio = stampImgElement.height / stampImgElement.width;
      const targetWidth = stampWidth;
      const targetHeight = targetWidth * aspectRatio;

      pagesToProcess.forEach((pageIdx) => {
        const page = pdfDoc.getPage(pageIdx);
        const { width: pageW, height: pageH } = page.getSize();

        // Convert percentage ratio to PDF points (Note: PDF (0,0) is bottom-left)
        const pdfX = (pageW * stampRatioPos.x) / 100 - targetWidth / 2;
        const pdfY = pageH - (pageH * stampRatioPos.y) / 100 - targetHeight / 2;

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
      console.error('Error applying stamp:', err);
      alert('도장/서명을 적용하는 중 오류가 발생했습니다.');
    } finally {
      setApplying(false);
    }
  };

  const handleReset = () => {
    setPdfFile(null);
    setStampFile(null);
    setStampImgElement(null);
    setDownloaded(false);
    setDownloadUrl(null);
    setPageCount(0);
    setCurrentPage(1);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.badgeTitle}>PDF Stamp & Signature</span>
        <h1 className={styles.title}>PDF ✒️ 직인 / 도장 / 서명 추가</h1>
        <p className={styles.subtitle}>
          서버 업로드 없이 100% 브라우저 내부에서 안전하게 PDF 문서의 원하는 위치에 직인, 도장, 서명(사인) 및 PNG/JPG 이미지를 추가합니다.
        </p>
      </div>

      {/* Privacy Banner */}
      <div className={styles.privacyBanner}>
        <IoShieldCheckmarkOutline size={18} />
        <span>100% 개인정보 안전: 모든 파일 처리가 내 컴퓨터 브라우저 내부에서 바로 진행됩니다.</span>
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
          <h3 className={styles.dropText}>도장/서명을 추가할 PDF 파일을 드래그하거나 클릭하세요</h3>
          <p className={styles.subText}>최대 용량 제한 없이 무료로 이용 가능합니다.</p>
          <button className={styles.selectBtn}>PDF 파일 선택</button>
        </div>
      ) : downloaded && downloadUrl ? (
        /* Success Card */
        <div className={styles.successCard}>
          <IoCheckmarkCircleOutline size={60} color="#36b27e" className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">✅ PDF 도장/서명 적용이 완료되었습니다!</h2>
          <p className="text-gray-300 mb-6">아래 버튼을 눌러 새 PDF 문서를 다운로드하세요.</p>

          <div className="flex justify-center gap-4">
            <a
              href={downloadUrl}
              download={`${pdfFile.name.replace(/\.pdf$/i, '')}_stamped.pdf`}
              className={styles.downloadBtn}
            >
              <IoDownloadOutline size={22} />
              도장 적용된 PDF 다운로드
            </a>
            <button onClick={handleReset} className={styles.resetBtn}>
              새 파일 작업
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
                1. 도장 / 서명 이미지 선택
              </h3>

              {/* Upload Stamp Image */}
              {!stampImgElement ? (
                <div
                  className={styles.stampDropzone}
                  onClick={() => stampInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={stampInputRef}
                    onChange={handleStampChange}
                    accept="image/png, image/jpeg, image/jpg"
                    className="hidden"
                  />
                  <IoCloudUploadOutline size={32} color="#4285f4" />
                  <span className="text-sm font-semibold text-white">직인/도장/서명 이미지 선택</span>
                  <span className="text-xs text-emerald-400">💡 투명 배경 PNG 파일 강력 추천</span>
                </div>
              ) : (
                <div className={styles.stampPreviewBox}>
                  <img
                    src={stampImgElement.src}
                    alt="Stamp Preview"
                    className={styles.stampThumb}
                  />
                  <div className="flex flex-col flex-1 mx-3">
                    <span className="text-xs font-semibold text-white truncate max-w-[140px]">
                      {stampFile?.name}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {stampFile?.type.includes('png') ? 'PNG (투명배경)' : 'JPG'}
                    </span>
                  </div>
                  <button
                    onClick={() => stampInputRef.current?.click()}
                    className={styles.stampChangeBtn}
                  >
                    변경
                  </button>
                  <input
                    type="file"
                    ref={stampInputRef}
                    onChange={handleStampChange}
                    accept="image/png, image/jpeg, image/jpg"
                    className="hidden"
                  />
                </div>
              )}

              <hr className="border-gray-800 my-2" />

              <h3 className={styles.panelSectionTitle}>
                <IoMoveOutline size={20} color="#4285f4" />
                2. 도장 옵션 및 배치 설정
              </h3>

              {/* Target Pages */}
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel}>적용 대상 페이지</label>
                <select
                  value={targetPages}
                  onChange={(e) => setTargetPages(e.target.value as TargetPagesMode)}
                  className={styles.selectInput}
                >
                  <option value="current">현재 페이지에만 적용 (p.{currentPage})</option>
                  <option value="all">전체 페이지에 모두 적용 (총 {pageCount}p)</option>
                </select>
              </div>

              {/* Stamp Size */}
              <div className={styles.controlGroup}>
                <div className={styles.controlLabel}>
                  <span>도장 크기 (너비)</span>
                  <span className={styles.controlValue}>{stampWidth}px</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={300}
                  value={stampWidth}
                  onChange={(e) => setStampWidth(Number(e.target.value))}
                  className={styles.rangeInput}
                />
              </div>

              {/* Opacity */}
              <div className={styles.controlGroup}>
                <div className={styles.controlLabel}>
                  <span>투명도</span>
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
                  <span>회전 각도</span>
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
                    {currentPage} / {pageCount} 페이지
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
                onTouchStart={updateStampPosFromEvent}
                onTouchMove={updateStampPosFromEvent}
              >
                <canvas ref={previewCanvasRef} />
              </div>

              <div className={styles.dragOverlayTip}>
                <IoMoveOutline size={16} />
                <span>미리보기 이미지를 마우스로 클릭하거나 드래그하여 도장 위치를 이동하세요.</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionArea}>
            <button
              onClick={handleApplyStamp}
              disabled={!stampImgElement || applying}
              className={styles.applyBtn}
            >
              {applying ? (
                'PDF 도장/서명 적용 중...'
              ) : (
                <>
                  <IoShieldCheckmarkOutline size={20} />
                  ✒️ 도장/서명 적용하고 다운로드
                </>
              )}
            </button>

            <button onClick={handleReset} className={styles.resetBtn}>
              <IoRefreshOutline size={18} className="inline mr-1" />
              초기화
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
