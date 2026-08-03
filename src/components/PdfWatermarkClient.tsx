"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './PdfExtractClient.module.css';
import { useLanguage } from '@/lib/LanguageContext';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import {
  IoCloudUploadOutline,
  IoShieldCheckmarkOutline,
  IoRefreshOutline,
  IoDownloadOutline,
  IoCheckmarkCircleOutline,
  IoWaterOutline,
} from 'react-icons/io5';

type WatermarkPosition = 'center' | 'tile' | 'topRight' | 'bottomRight';

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

  // Preview Canvas
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfPageCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Action States
  const [applying, setApplying] = useState(false);
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
      ctx.translate(w - 40, 50);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.fillText(watermarkText, 0, 0);
    } else if (position === 'bottomRight') {
      ctx.textAlign = 'right';
      ctx.translate(w - 40, h - 50);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.fillText(watermarkText, 0, 0);
    }

    ctx.restore();
  }, [watermarkText, fontSize, opacity, rotation, selectedColor, position]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

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
      const angleDegrees = degrees(rotation);

      pages.forEach((p) => {
        const { width, height } = p.getSize();

        if (position === 'center') {
          const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
          p.drawText(watermarkText, {
            x: width / 2 - textWidth / 2,
            y: height / 2,
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
          p.drawText(watermarkText, {
            x: width - textWidth - 30,
            y: height - 50,
            size: fontSize,
            font,
            color: colorRgb,
            opacity: alpha,
            rotate: angleDegrees,
          });
        } else if (position === 'bottomRight') {
          const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
          p.drawText(watermarkText, {
            x: width - textWidth - 30,
            y: 40,
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-6">
            {/* Control Panel */}
            <div className="lg:col-span-6 space-y-5 bg-white/[0.03] p-6 rounded-2xl border border-white/10 shadow-xl">
              {/* Text Input */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  {textDict.textLabel}
                </label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder={textDict.textPlaceholder}
                  className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white font-semibold focus:outline-none focus:border-blue-500 transition-all text-sm"
                />
                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {PRESET_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setWatermarkText(tag)}
                      className="px-2.5 py-1 bg-white/10 hover:bg-blue-500/20 text-gray-300 hover:text-blue-300 rounded-lg text-xs font-medium transition-all border border-white/10"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size & Opacity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    {textDict.fontSizeLabel}: <span className="text-blue-400 font-extrabold">{fontSize}px</span>
                  </label>
                  <input
                    type="range"
                    min="18"
                    max="96"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    {textDict.opacityLabel}: <span className="text-blue-400 font-extrabold">{opacity}%</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Rotation Angle */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-gray-300">
                    {textDict.rotationLabel}: <span className="text-blue-400 font-extrabold">{rotation}°</span>
                  </label>
                  <div className="space-x-1">
                    <button
                      onClick={() => setRotation(-45)}
                      className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-[11px] text-gray-300 rounded"
                    >
                      -45°
                    </button>
                    <button
                      onClick={() => setRotation(0)}
                      className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-[11px] text-gray-300 rounded"
                    >
                      0°
                    </button>
                    <button
                      onClick={() => setRotation(45)}
                      className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-[11px] text-gray-300 rounded"
                    >
                      45°
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="-90"
                  max="90"
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-2">
                  {textDict.colorLabel}: <span className="text-gray-400 font-normal">{selectedColor.name}</span>
                </label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c)}
                      className={`w-9 h-9 rounded-xl border-2 transition-all flex items-center justify-center ${
                        selectedColor.name === c.name ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Layout Position */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-2">
                  {textDict.positionLabel}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPosition('center')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      position === 'center'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {textDict.posCenter}
                  </button>
                  <button
                    onClick={() => setPosition('tile')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      position === 'tile'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {textDict.posTile}
                  </button>
                  <button
                    onClick={() => setPosition('topRight')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      position === 'topRight'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {textDict.posTopRight}
                  </button>
                  <button
                    onClick={() => setPosition('bottomRight')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      position === 'bottomRight'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {textDict.posBottomRight}
                  </button>
                </div>
              </div>
            </div>

            {/* Live Preview Canvas */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center bg-black/30 p-6 rounded-2xl border border-white/10 shadow-xl">
              <div className="text-xs font-bold text-gray-300 mb-3 flex items-center gap-1.5">
                {textDict.previewTitle}
              </div>

              <div className="relative border border-white/20 rounded-xl overflow-hidden shadow-2xl bg-white max-w-full">
                <canvas ref={previewCanvasRef} className="max-h-[460px] w-auto object-contain" />
              </div>
            </div>
          </div>

          {/* Action Button Section */}
          <div className="my-8 text-center">
            <button
              onClick={handleApplyWatermark}
              disabled={applying || !watermarkText.trim()}
              className="px-9 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base rounded-2xl transition-all shadow-xl inline-flex items-center gap-3 cursor-pointer disabled:opacity-50"
            >
              {applying ? (
                <span>{textDict.saving || '적용 중...'}</span>
              ) : (
                <>
                  <IoWaterOutline className="text-xl" />
                  <span>{textDict.saveBtn || '💧 워터마크 적용하고 다운로드 ➔'}</span>
                </>
              )}
            </button>
          </div>

          {/* Success Download Card */}
          {downloadUrl && (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center my-6 shadow-xl">
              <div className="text-emerald-400 font-bold text-lg mb-2 flex items-center justify-center gap-2">
                <IoCheckmarkCircleOutline size={24} />
                <span>{textDict.successText || '✅ PDF 워터마크 삽입이 완료되었습니다!'}</span>
              </div>
              <a
                href={downloadUrl}
                download={`${file.name.replace(/\.pdf$/i, '')}_watermarked.pdf`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-xl text-sm transition-all shadow-lg mt-2"
              >
                <IoDownloadOutline size={18} />
                <span>{textDict.downloadBtn || '워터마크 적용된 PDF 다운로드'}</span>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
