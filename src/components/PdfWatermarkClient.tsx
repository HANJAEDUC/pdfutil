"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './PdfWatermarkClient.module.css';
import { useLanguage } from '@/lib/LanguageContext';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import {
  IoCloudUploadOutline,
  IoShieldCheckmarkOutline,
  IoRefreshOutline,
  IoDownloadOutline,
  IoCheckmarkCircleOutline,
  IoWaterOutline,
  IoMoveOutline,
} from 'react-icons/io5';

type WatermarkPosition = 'center' | 'tile' | 'topRight' | 'bottomRight' | 'custom';

interface ColorOption {
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
}

const COLOR_OPTIONS: ColorOption[] = [
  { name: 'Red', hex: '#ef4444', rgb: { r: 239 / 255, g: 68 / 255, b: 68 / 255 } },
  { name: 'Gray', hex: '#6b7280', rgb: { r: 107 / 255, g: 114 / 255, b: 128 / 255 } },
  { name: 'Blue', hex: '#3b82f6', rgb: { r: 59 / 255, g: 130 / 255, b: 246 / 255 } },
  { name: 'Dark', hex: '#1f2937', rgb: { r: 31 / 255, g: 41 / 255, b: 55 / 255 } },
  { name: 'Emerald', hex: '#10b981', rgb: { r: 16 / 255, g: 185 / 255, b: 129 / 255 } },
  { name: 'Purple', hex: '#a855f7', rgb: { r: 168 / 255, g: 85 / 255, b: 247 / 255 } },
];

const PRESET_TAGS = ['CONFIDENTIAL', 'SAMPLE', '기밀문서', '사본불가', '개인정보보호', 'DO NOT COPY'];

export default function PdfWatermarkClient() {
  const { lang, t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageCount, setPageCount] = useState(0);

  // Watermark Settings
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(42);
  const [opacity, setOpacity] = useState(35); // 10 to 100
  const [rotation, setRotation] = useState(-45); // -90 to 90
  const [selectedColor, setSelectedColor] = useState<ColorOption>(COLOR_OPTIONS[0]);
  const [position, setPosition] = useState<WatermarkPosition>('center');

  // Custom Position Ratio (Percentage 0% ~ 100% of Width / Height)
  const [customRatio, setCustomRatio] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isCanvasDragging, setIsCanvasDragging] = useState(false);

  // Preview Canvas
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfPageCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Action States
  const [applying, setApplying] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

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

  const renderPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    const bgCanvas = pdfPageCanvasRef.current;
    if (!canvas || !bgCanvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = bgCanvas.width;
    canvas.height = bgCanvas.height;

    // Draw PDF page background
    ctx.drawImage(bgCanvas, 0, 0);

    if (!watermarkText.trim()) return;

    // Watermark styling
    ctx.save();
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = selectedColor.hex;
    ctx.globalAlpha = opacity / 100;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const w = canvas.width;
    const h = canvas.height;

    if (position === 'center') {
      ctx.translate(w / 2, h / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.fillText(watermarkText, 0, 0);
    } else if (position === 'tile') {
      const stepX = 220;
      const stepY = 180;
      for (let y = 60; y < h; y += stepY) {
        for (let x = 60; x < w; x += stepX) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.fillText(watermarkText, 0, 0);
          ctx.restore();
        }
      }
    } else if (position === 'topRight') {
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.translate(w - 30, 30);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.fillText(watermarkText, 0, 0);
    } else if (position === 'bottomRight') {
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.translate(w - 30, h - 30);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.fillText(watermarkText, 0, 0);
    } else if (position === 'custom') {
      ctx.translate((w * customRatio.x) / 100, (h * customRatio.y) / 100);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.fillText(watermarkText, 0, 0);
    }

    ctx.restore();
  }, [watermarkText, fontSize, opacity, rotation, selectedColor, position, customRatio]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  // Pointer & Drag Handlers for Preview Canvas
  const updatePointerPosition = (clientX: number, clientY: number) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;

    const ratioX = Math.min(96, Math.max(4, (rawX / rect.width) * 100));
    const ratioY = Math.min(96, Math.max(4, (rawY / rect.height) * 100));

    setCustomRatio({ x: ratioX, y: ratioY });
    setPosition('custom');
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsCanvasDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    updatePointerPosition(clientX, clientY);
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isCanvasDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    updatePointerPosition(clientX, clientY);
  };

  const handlePointerUp = () => {
    setIsCanvasDragging(false);
  };

  const processPdfFile = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      alert(lang === 'ko' ? 'PDF 파일만 선택 가능합니다.' : 'Please select a valid PDF file.');
      return;
    }

    setFile(selectedFile);
    setLoading(true);
    setDownloadUrl(null);

    try {
      const pdfjsLib = await getPdfJsLib();
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPageCount(pdf.numPages);

      // Render Page 1 for Preview Canvas
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.8 });

      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = viewport.width;
      tempCanvas.height = viewport.height;

      if (tempCtx) {
        await page.render({ canvasContext: tempCtx, viewport }).promise;
        pdfPageCanvasRef.current = tempCanvas;
        renderPreview();
      }
    } catch (err) {
      console.error(err);
      alert(lang === 'ko' ? 'PDF 미리보기를 불러오는 중 오류가 발생했습니다.' : 'Error rendering PDF preview.');
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyWatermark = async () => {
    if (!file || !watermarkText.trim()) return;
    setApplying(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const colorRgb = rgb(selectedColor.rgb.r, selectedColor.rgb.g, selectedColor.rgb.b);
      const alpha = opacity / 100;
      const pdfRotation = -rotation;
      const angleDegrees = degrees(pdfRotation);
      const pdfRad = (pdfRotation * Math.PI) / 180;
      const cos = Math.cos(pdfRad);
      const sin = Math.sin(pdfRad);

      pages.forEach((p) => {
        const { width, height } = p.getSize();

        if (position === 'center') {
          const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
          const textHeight = fontSize * 0.35;

          const hw = textWidth / 2;
          const hh = textHeight;

          const rotatedDx = hw * cos - hh * sin;
          const rotatedDy = hw * sin + hh * cos;

          const originX = width / 2 - rotatedDx;
          const originY = height / 2 - rotatedDy;

          p.drawText(watermarkText, {
            x: originX,
            y: originY,
            size: fontSize,
            font,
            color: colorRgb,
            opacity: alpha,
            rotate: angleDegrees,
          });
        } else if (position === 'tile') {
          const stepX = 220;
          const stepY = 180;
          for (let y = 60; y < height; y += stepY) {
            for (let x = 60; x < width; x += stepX) {
              p.drawText(watermarkText, {
                x,
                y,
                size: fontSize,
                font,
                color: colorRgb,
                opacity: alpha,
                rotate: angleDegrees,
              });
            }
          }
        } else if (position === 'topRight') {
          const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
          const originX = width - 30 - textWidth * Math.max(0.1, cos);
          const originY = Math.min(height - 40, Math.max(30, height - 40 - textWidth * sin));

          p.drawText(watermarkText, {
            x: originX,
            y: originY,
            size: fontSize,
            font,
            color: colorRgb,
            opacity: alpha,
            rotate: angleDegrees,
          });
        } else if (position === 'bottomRight') {
          const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
          const originX = width - 30 - textWidth * Math.max(0.1, cos);
          const originY = Math.max(25, Math.min(height - 40, 40 - textWidth * sin));

          p.drawText(watermarkText, {
            x: originX,
            y: originY,
            size: fontSize,
            font,
            color: colorRgb,
            opacity: alpha,
            rotate: angleDegrees,
          });
        } else if (position === 'custom') {
          const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
          const textHeight = fontSize * 0.35;

          const targetX = (width * customRatio.x) / 100;
          const targetY = height - (height * customRatio.y) / 100;

          const hw = textWidth / 2;
          const hh = textHeight;

          const rotatedDx = hw * cos - hh * sin;
          const rotatedDy = hw * sin + hh * cos;

          const originX = targetX - rotatedDx;
          const originY = targetY - rotatedDy;

          p.drawText(watermarkText, {
            x: originX,
            y: originY,
            size: fontSize,
            font,
            color: colorRgb,
            opacity: alpha,
            rotate: angleDegrees,
          });
        }
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      // Auto Download
      const link = document.createElement('a');
      link.href = url;
      const baseName = file.name.replace(/\.pdf$/i, '');
      link.download = `${baseName}_watermarked.pdf`;
      link.click();

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3500);
    } catch (err) {
      console.error(err);
      alert(lang === 'ko' ? '워터마크 처리 중 오류가 발생했습니다.' : 'Failed to apply watermark.');
    } finally {
      setApplying(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setDownloadUrl(null);
    pdfPageCanvasRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const textDict = (t as any).pdfwatermark || {
    title: 'PDF 💧 PDF',
    subtitle: '서버 업로드 없이 100% 브라우저 내부에서 안전하고 빠르게 PDF 문서에 워터마크를 삽입합니다.',
    dropText: '워터마크를 추가할 PDF 파일을 이곳에 드래그하거나 클릭하여 선택하세요',
    subText: '최대 파일 크기 제한 없이 안전하게 내 컴퓨터에서 바로 설정됩니다.',
    selectBtn: 'PDF 파일 선택',
    textLabel: '워터마크 문구 입력:',
    textPlaceholder: '예: CONFIDENTIAL, 사본불가, 개인정보보호',
    fontSizeLabel: '글자 크기',
    opacityLabel: '투명도',
    rotationLabel: '회전 각도',
    colorLabel: '워터마크 색상',
    positionLabel: '배치 방식',
    posCenter: '중앙 (1개)',
    posTile: '전체 타일 반복 (격자)',
    posTopRight: '우측 상단',
    posBottomRight: '우측 하단',
    posCustom: '🎯 자유 이동 (드래그)',
    dragTipText: '💡 미리보기 이미지를 마우스로 클릭하거나 드래그하면 원하는 위치로 자유롭게 이동합니다.',
    previewTitle: '👁️ 워터마크 1페이지 실시간 미리보기',
    saveBtn: '💧 워터마크 적용하고 다운로드 ➔',
    saving: 'PDF 워터마크 적용 중...',
    successText: '✅ PDF 워터마크 삽입이 완료되었습니다!',
    downloadBtn: '워터마크 적용된 PDF 다운로드',
    newFile: '새 파일',
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <span className={styles.badgeTitle}>{t.badge}</span>
        <h1 className={styles.title}>{textDict.title || 'PDF 💧 PDF'}</h1>
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

      {/* Watermark Workspace */}
      {file && !loading && (
        <div className={styles.workspace}>
          <div className={styles.controlsBar}>
            <div className={styles.fileSummary}>
              📄 {file.name} ({pageCount} {lang === 'ko' ? '페이지' : 'pages'})
            </div>
            <button className={styles.resetBtn} onClick={handleReset}>
              <IoRefreshOutline /> {textDict.newFile || '새 파일'}
            </button>
          </div>

          <div className={styles.mainGrid}>
            {/* Control Panel Card */}
            <div className={styles.panelCard}>
              {/* Text Input */}
              <div>
                <div className={styles.sectionLabel}>{textDict.textLabel}</div>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder={textDict.textPlaceholder}
                  className={styles.textInput}
                />
                {/* Preset Chips */}
                <div className={styles.presetWrapper}>
                  {PRESET_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setWatermarkText(tag)}
                      className={styles.chipBtn}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size & Opacity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div className={styles.sectionLabel}>
                    <span>{textDict.fontSizeLabel}</span>
                    <span className={styles.highlightVal}>{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="96"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className={styles.rangeSlider}
                  />
                </div>
                <div>
                  <div className={styles.sectionLabel}>
                    <span>{textDict.opacityLabel}</span>
                    <span className={styles.highlightVal}>{opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className={styles.rangeSlider}
                  />
                </div>
              </div>

              {/* Rotation Angle */}
              <div>
                <div className={styles.sectionLabel}>
                  <span>
                    {textDict.rotationLabel}: <span className={styles.highlightVal}>{rotation}°</span>
                  </span>
                  <div className={styles.presetAngles}>
                    <button onClick={() => setRotation(-45)} className={styles.angleBtn}>-45°</button>
                    <button onClick={() => setRotation(0)} className={styles.angleBtn}>0°</button>
                    <button onClick={() => setRotation(45)} className={styles.angleBtn}>45°</button>
                  </div>
                </div>
                <input
                  type="range"
                  min="-90"
                  max="90"
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className={styles.rangeSlider}
                />
              </div>

              {/* Color Selection */}
              <div>
                <div className={styles.sectionLabel}>
                  <span>{textDict.colorLabel}</span>
                  <span style={{ fontWeight: 500, color: '#a1a3a1' }}>{selectedColor.name}</span>
                </div>
                <div className={styles.colorGrid}>
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c)}
                      className={`${styles.colorCircle} ${selectedColor.name === c.name ? styles.colorCircleSelected : ''}`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Layout Position */}
              <div>
                <div className={styles.sectionLabel}>{textDict.positionLabel}</div>
                <div className={styles.posGrid}>
                  <button
                    onClick={() => {
                      setPosition('center');
                      setCustomRatio({ x: 50, y: 50 });
                    }}
                    className={`${styles.posBtn} ${position === 'center' ? styles.posBtnActive : ''}`}
                  >
                    {textDict.posCenter}
                  </button>
                  <button
                    onClick={() => setPosition('tile')}
                    className={`${styles.posBtn} ${position === 'tile' ? styles.posBtnActive : ''}`}
                  >
                    {textDict.posTile}
                  </button>
                  <button
                    onClick={() => {
                      setPosition('topRight');
                      setCustomRatio({ x: 88, y: 12 });
                    }}
                    className={`${styles.posBtn} ${position === 'topRight' ? styles.posBtnActive : ''}`}
                  >
                    {textDict.posTopRight}
                  </button>
                  <button
                    onClick={() => {
                      setPosition('bottomRight');
                      setCustomRatio({ x: 88, y: 88 });
                    }}
                    className={`${styles.posBtn} ${position === 'bottomRight' ? styles.posBtnActive : ''}`}
                  >
                    {textDict.posBottomRight}
                  </button>
                  <button
                    onClick={() => setPosition('custom')}
                    className={`${styles.posBtn} ${position === 'custom' ? styles.posBtnActive : ''}`}
                    style={{ gridColumn: 'span 2' }}
                  >
                    {textDict.posCustom || '🎯 자유 이동 (드래그)'}
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Card */}
            <div className={styles.previewCard}>
              <div className={styles.previewHeader}>
                {textDict.previewTitle}
              </div>

              <div className={styles.canvasBox}>
                <canvas
                  ref={previewCanvasRef}
                  className={styles.canvasImg}
                  onMouseDown={handlePointerDown}
                  onMouseMove={handlePointerMove}
                  onMouseUp={handlePointerUp}
                  onMouseLeave={handlePointerUp}
                  onTouchStart={handlePointerDown}
                  onTouchMove={handlePointerMove}
                  onTouchEnd={handlePointerUp}
                />
              </div>

              <div className={styles.dragTip}>
                <IoMoveOutline size={16} />
                <span>{textDict.dragTipText}</span>
              </div>
            </div>
          </div>

          {/* Action Button Section */}
          <div className={styles.actionWrapper}>
            <button
              onClick={handleApplyWatermark}
              disabled={applying || !watermarkText.trim()}
              className={styles.applyBtn}
            >
              {applying ? (
                <span>{textDict.saving || '적용 중...'}</span>
              ) : downloaded ? (
                <>
                  <IoCheckmarkCircleOutline size={20} />
                  <span>{textDict.successText || '✅ PDF 워터마크 적용 완료!'}</span>
                </>
              ) : (
                <>
                  <IoWaterOutline size={20} />
                  <span>{textDict.saveBtn || '💧 워터마크 적용하고 다운로드 ➔'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
