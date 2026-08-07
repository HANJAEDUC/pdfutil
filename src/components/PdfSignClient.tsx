"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './PdfSignClient.module.css';
import { useLanguage } from '@/lib/LanguageContext';
import { PDFDocument, degrees } from 'pdf-lib';
import {
  IoCloudUploadOutline,
  IoShieldCheckmarkOutline,
  IoDownloadOutline,
  IoCheckmarkCircleOutline,
  IoCreateOutline,
  IoTextOutline,
  IoRefreshOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoPencilOutline,
  IoDocumentTextOutline,
  IoCloseCircleOutline,
} from 'react-icons/io5';

type SignMode = 'draw' | 'type';
type TargetPagesMode = 'current' | 'all';

interface DrawPoint {
  x: number;
  y: number;
}

interface DrawStroke {
  points: DrawPoint[];
  color: string;
  width: number;
}

const FONT_OPTIONS = [
  { label: 'Dancing Script', family: "'Dancing Script', cursive" },
  { label: 'Great Vibes', family: "'Great Vibes', cursive" },
  { label: 'Caveat', family: "'Caveat', cursive" },
  { label: 'Sacramento', family: "'Sacramento', cursive" },
];

const COLOR_OPTIONS = [
  '#000000', // Black
  '#0b2545', // Dark Navy
  '#004085', // Deep Blue
  '#b71c1c', // Crimson Red
];

export default function PdfSignClient() {
  const { t } = useLanguage();
  const tSign = (t as any).pdfsign || {};

  // PDF File States
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isPdfDragOver, setIsPdfDragOver] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Signature Mode State
  const [signMode, setSignMode] = useState<SignMode>('draw');

  // Draw Signature States
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#000000');
  const [penWidth, setPenWidth] = useState(3);
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const currentStrokeRef = useRef<DrawStroke | null>(null);

  // Type Signature States
  const [typedText, setTypedText] = useState('홍길동 Signature');
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].family);
  const [textColor, setTextColor] = useState('#000000');

  // Signature Control & Position Settings
  const [targetPages, setTargetPages] = useState<TargetPagesMode>('current');
  const [signWidth, setSignWidth] = useState(160); // Width in px
  const [opacity, setOpacity] = useState(100); // 10 ~ 100
  const [rotation, setRotation] = useState(0); // -180 ~ 180
  const [signRatioPos, setSignRatioPos] = useState<{ x: number; y: number }>({ x: 50, y: 75 }); // Default bottom centerish

  // Dragging on PDF Canvas State
  const [isDraggingOnCanvas, setIsDraggingOnCanvas] = useState(false);

  // Canvas Refs for PDF Preview
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfBgCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Action & Export States
  const [applying, setApplying] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Load PDF.js dynamically
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

  // Generate transparent PNG Data URL from signature canvas (Draw or Type)
  const getSignatureDataUrl = useCallback((): string | null => {
    if (signMode === 'draw') {
      const canvas = drawCanvasRef.current;
      if (!canvas || strokes.length === 0) return null;
      return canvas.toDataURL('image/png');
    } else {
      if (!typedText.trim()) return null;
      const textCanvas = document.createElement('canvas');
      textCanvas.width = 500;
      textCanvas.height = 200;
      const ctx = textCanvas.getContext('2d');
      if (!ctx) return null;

      ctx.clearRect(0, 0, textCanvas.width, textCanvas.height);
      ctx.font = `64px ${fontFamily}`;
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedText, textCanvas.width / 2, textCanvas.height / 2);

      return textCanvas.toDataURL('image/png');
    }
  }, [signMode, strokes, typedText, fontFamily, textColor]);

  // Render combined preview (PDF page + Signature overlay)
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

    // Get Signature Image
    const sigDataUrl = getSignatureDataUrl();
    if (sigDataUrl) {
      const img = new Image();
      img.src = sigDataUrl;
      img.onload = () => {
        ctx.save();
        const w = canvas.width;
        const h = canvas.height;

        const centerX = (w * signRatioPos.x) / 100;
        const centerY = (h * signRatioPos.y) / 100;

        const scaledWidth = signWidth * 1.5;
        const aspectRatio = img.height / img.width;
        const scaledHeight = scaledWidth * aspectRatio;

        ctx.translate(centerX, centerY);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.globalAlpha = opacity / 100;

        ctx.drawImage(
          img,
          -scaledWidth / 2,
          -scaledHeight / 2,
          scaledWidth,
          scaledHeight
        );

        // Selection Dashed Outline
        ctx.strokeStyle = '#4285f4';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(
          -scaledWidth / 2 - 4,
          -scaledHeight / 2 - 4,
          scaledWidth + 8,
          scaledHeight + 8
        );

        ctx.restore();
      };
    }
  }, [getSignatureDataUrl, signRatioPos, signWidth, opacity, rotation]);

  // Re-draw signature drawing pad whenever strokes change
  const redrawDrawCanvas = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  }, [strokes]);

  useEffect(() => {
    redrawDrawCanvas();
  }, [redrawDrawCanvas]);

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

  // Drawing Event Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current;
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

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    setIsDrawing(true);
    const newStroke: DrawStroke = {
      points: [{ x, y }],
      color: penColor,
      width: penWidth,
    };
    currentStrokeRef.current = newStroke;
    setStrokes((prev) => [...prev, newStroke]);
  };

  const drawMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStrokeRef.current) return;
    const canvas = drawCanvasRef.current;
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

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    currentStrokeRef.current.points.push({ x, y });
    setStrokes((prev) => [...prev.slice(0, -1), { ...currentStrokeRef.current! }]);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    currentStrokeRef.current = null;
  };

  const clearDrawCanvas = () => {
    setStrokes([]);
  };

  const undoDrawCanvas = () => {
    setStrokes((prev) => prev.slice(0, -1));
  };

  // Dragging on PDF Canvas Handlers
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

    setSignRatioPos({ x: xRatio, y: yRatio });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLElement>) => {
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

  // Embed Signature into PDF using pdf-lib
  const handleApplySignature = async () => {
    const sigDataUrl = getSignatureDataUrl();
    if (!pdfFile || !sigDataUrl) return;

    setApplying(true);
    try {
      const pdfArrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfArrayBuffer);

      // Convert PNG Data URL to bytes and embed
      const pngImageBytes = await fetch(sigDataUrl).then((res) => res.arrayBuffer());
      const embeddedImage = await pdfDoc.embedPng(pngImageBytes);

      const imgWidthPdf = signWidth; // width in points
      const aspectRatio = embeddedImage.height / embeddedImage.width;
      const imgHeightPdf = imgWidthPdf * aspectRatio;

      const pagesToApply =
        targetPages === 'all'
          ? pdfDoc.getPages()
          : [pdfDoc.getPage(currentPage - 1)];

      pagesToApply.forEach((page) => {
        const { width: pWidth, height: pHeight } = page.getSize();

        // Calculate center position in PDF point coordinates (PDF Y axis points upwards)
        const centerX = (pWidth * signRatioPos.x) / 100;
        const centerY = pHeight - (pHeight * signRatioPos.y) / 100;

        page.drawImage(embeddedImage, {
          x: centerX - imgWidthPdf / 2,
          y: centerY - imgHeightPdf / 2,
          width: imgWidthPdf,
          height: imgHeightPdf,
          opacity: opacity / 100,
          rotate: degrees(-rotation), // PDF rotation direction
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);
      setDownloaded(true);
    } catch (err) {
      console.error('Failed to embed signature into PDF:', err);
      alert(tSign.errorMsg || 'PDF 서명 합성 중 오류가 발생했습니다.');
    } finally {
      setApplying(false);
    }
  };

  const resetAll = () => {
    setPdfFile(null);
    setStrokes([]);
    setDownloaded(false);
    setDownloadUrl(null);
    setCurrentPage(1);
  };

  return (
    <div className={styles.container}>
      {/* Header Banner */}
      <div className={styles.hero}>
        <div className={styles.badge}>
          <IoShieldCheckmarkOutline /> {tSign.badge || 'Browser-based Electronic Signature'}
        </div>
        <h1 className={styles.title}>{tSign.title || 'PDF ✍️ 서명 추가'}</h1>
        <p className={styles.subtitle}>{tSign.subtitle || '서버 업로드 없이 100% 내 브라우저 내부에서 마우스로 그리거나 텍스트를 입력하여 나만의 전자 서명을 PDF에 합성합니다.'}</p>

        <div className={styles.privacyBanner}>
          <IoShieldCheckmarkOutline color="#36b27e" />
          <span>100% Client-Side Privacy Protection — Zero Server Upload</span>
        </div>
      </div>

      {/* Step 1: Upload PDF File */}
      {!pdfFile && (
        <div
          className={`${styles.dropZone} ${isPdfDragOver ? styles.dragOver : ''}`}
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
          <IoCloudUploadOutline className={styles.uploadIcon} />
          <h3 className={styles.dropText}>{tSign.dropText || '서명을 추가할 PDF 파일을 이곳에 드래그하거나 클릭하세요'}</h3>
          <p className={styles.subText}>{tSign.subText || '최대 파일 크기 제한 없이 내 컴퓨터에서 안전하게 처리됩니다.'}</p>
          <button className={styles.selectBtn} type="button">
            {tSign.selectBtn || 'PDF 파일 선택'}
          </button>
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf"
            className={styles.hiddenInput}
            onChange={handlePdfChange}
          />
        </div>
      )}

      {/* Step 2: Editor & Signature Overlay Settings */}
      {pdfFile && !downloaded && (
        <div className={styles.editorContainer}>
          {/* Top File Action Bar */}
          <div className={styles.fileBarHeader}>
            <div className={styles.fileInfo}>
              <IoDocumentTextOutline size={22} color="#8ab4f8" />
              <span className={styles.fileName}>{pdfFile.name}</span>
              <span className={styles.fileSize}>
                ({(pdfFile.size / (1024 * 1024)).toFixed(2)} MB, {pageCount}p)
              </span>
            </div>
            <button
              type="button"
              className={styles.changeFileBtn}
              onClick={() => {
                resetAll();
                setTimeout(() => pdfInputRef.current?.click(), 100);
              }}
              title={tSign.changeFileBtn || '취소하고 다른 PDF 파일 선택'}
            >
              <IoRefreshOutline size={16} />
              <span>{tSign.changeFileBtn || '다른 PDF 파일 선택 (취소)'}</span>
            </button>
          </div>

          <div className={styles.editorGrid}>
          {/* Left Panel: Signature Creation & Options */}
          <div className={styles.panelCard}>
            <div className={styles.sectionTitle}>
              <IoCreateOutline color="#4285f4" size={22} />
              <span>{tSign.sectionSignMake || '1. 전자 서명 만들기'}</span>
            </div>

            {/* Tabs: Draw vs Type */}
            <div className={styles.tabsRow}>
              <button
                className={`${styles.tabBtn} ${signMode === 'draw' ? styles.tabBtnActive : ''}`}
                onClick={() => setSignMode('draw')}
              >
                {tSign.tabDraw || '✍️ 직접 그리기'}
              </button>
              <button
                className={`${styles.tabBtn} ${signMode === 'type' ? styles.tabBtnActive : ''}`}
                onClick={() => setSignMode('type')}
              >
                {tSign.tabType || '🔤 텍스트 입력'}
              </button>
            </div>

            {/* Mode 1: Draw Signature Pad */}
            {signMode === 'draw' && (
              <div className={styles.drawPadWrapper}>
                <canvas
                  ref={drawCanvasRef}
                  width={340}
                  height={180}
                  className={styles.drawCanvas}
                  onMouseDown={startDrawing}
                  onMouseMove={drawMove}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={drawMove}
                  onTouchEnd={stopDrawing}
                />
                <div className={styles.drawControls}>
                  <div className={styles.colorPickerGroup}>
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        className={`${styles.colorDot} ${penColor === c ? styles.colorDotActive : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setPenColor(c)}
                        title={c}
                      />
                    ))}
                  </div>

                  <div className={styles.actionBtnGroup}>
                    <button className={styles.smallBtn} onClick={undoDrawCanvas} type="button">
                      {tSign.undoCanvas || '되돌리기'}
                    </button>
                    <button className={styles.smallBtn} onClick={clearDrawCanvas} type="button">
                      {tSign.clearCanvas || '초기화'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Type Signature */}
            {signMode === 'type' && (
              <div className={styles.typeInputWrapper}>
                <input
                  type="text"
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  placeholder={tSign.typePlaceholder || '이름 입력'}
                  className={styles.formInput}
                />

                <div className={styles.fontSelectGrid}>
                  {FONT_OPTIONS.map((f) => (
                    <button
                      key={f.label}
                      className={`${styles.fontOptionBtn} ${fontFamily === f.family ? styles.fontOptionBtnActive : ''}`}
                      style={{ fontFamily: f.family }}
                      onClick={() => setFontFamily(f.family)}
                    >
                      {typedText || f.label}
                    </button>
                  ))}
                </div>

                <div className={styles.colorPickerGroup}>
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      className={`${styles.colorDot} ${textColor === c ? styles.colorDotActive : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setTextColor(c)}
                    />
                  ))}
                </div>
              </div>
            )}

            <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '1.5rem 0' }} />

            {/* Section 2: Layout & Position Controls */}
            <div className={styles.sectionTitle}>
              <IoPencilOutline color="#8ab4f8" size={20} />
              <span>{tSign.sectionOptions || '2. 위치 및 옵션 설정'}</span>
            </div>

            {/* Target Pages */}
            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <span>{tSign.targetPagesLabel || '적용 대상 페이지:'}</span>
              </div>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="targetPages"
                    value="current"
                    checked={targetPages === 'current'}
                    onChange={() => setTargetPages('current')}
                  />
                  {tSign.currentPageOnly
                    ? tSign.currentPageOnly.replace('{page}', currentPage.toString())
                    : `현재 페이지에만 적용 (p.${currentPage})`}
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="targetPages"
                    value="all"
                    checked={targetPages === 'all'}
                    onChange={() => setTargetPages('all')}
                  />
                  {tSign.allPages
                    ? tSign.allPages.replace('{total}', pageCount.toString())
                    : `전체 페이지에 모두 적용 (총 ${pageCount}p)`}
                </label>
              </div>
            </div>

            {/* Signature Width */}
            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <span>{tSign.sizeLabel || '서명 크기'}</span>
                <span>{signWidth}px</span>
              </div>
              <input
                type="range"
                min="60"
                max="400"
                value={signWidth}
                onChange={(e) => setSignWidth(Number(e.target.value))}
                className={styles.rangeInput}
              />
            </div>

            {/* Opacity */}
            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <span>{tSign.opacityLabel || '불투명도'}</span>
                <span>{opacity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className={styles.rangeInput}
              />
            </div>

            {/* Rotation */}
            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <span>{tSign.rotationLabel || '회전 각도'}</span>
                <span>{rotation}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className={styles.rangeInput}
              />
            </div>

            {/* Save & Apply Button */}
            <button
              className={styles.applyPrimaryBtn}
              onClick={handleApplySignature}
              disabled={applying}
            >
              <IoCheckmarkCircleOutline size={20} />
              <span>{applying ? tSign.applying || '서명 합성 중...' : tSign.applyBtn || '✍️ PDF에 서명 적용하고 저장하기 ➔'}</span>
            </button>
          </div>

          {/* Right Panel: Interactive PDF Preview Canvas */}
          <div className={styles.previewWrapper}>
            <div className={styles.pageHeaderControls}>
              <button
                className={styles.navBtn}
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <IoChevronBackOutline /> {tSign.prevPage || '이전'}
              </button>

              <span className={styles.pageBadge}>
                {tSign.pageIndicator
                  ? tSign.pageIndicator.replace('{current}', currentPage.toString()).replace('{total}', pageCount.toString())
                  : `${currentPage} / ${pageCount} 페이지`}
              </span>

              <button
                className={styles.navBtn}
                disabled={currentPage >= pageCount}
                onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
              >
                {tSign.nextPage || '다음'} <IoChevronForwardOutline />
              </button>
            </div>

            <div
              className={styles.canvasContainer}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onTouchStart={updatePosFromEvent}
              onTouchMove={updatePosFromEvent}
            >
              <canvas ref={previewCanvasRef} className={styles.previewCanvas} />
            </div>

            <div className={styles.dragTipNotice}>
              {tSign.dragTip || '💡 미리보기 화면을 클릭하거나 드래그하여 서명 위치를 자유롭게 이동하세요.'}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Step 3: Download Signed PDF Success Screen */}
      {downloaded && downloadUrl && (
        <div className={styles.successCard}>
          <IoCheckmarkCircleOutline className={styles.successIcon} />
          <h2 className={styles.successTitle}>{tSign.successTitle || '✅ PDF 서명 추가 완료!'}</h2>
          <p className={styles.successSub}>{tSign.successSub || '아래 버튼을 눌러 서명이 포함된 새 PDF 문서를 다운로드하세요.'}</p>

          <a
            href={downloadUrl}
            download={`signed_${pdfFile?.name || 'document.pdf'}`}
            className={styles.downloadBtn}
          >
            <IoDownloadOutline size={22} />
            <span>{tSign.downloadBtn || '서명 포함된 PDF 다운로드'}</span>
          </a>

          <button className={styles.resetBtn} onClick={resetAll} type="button">
            {tSign.newFile || '새 파일 작업'}
          </button>
        </div>
      )}
    </div>
  );
}
