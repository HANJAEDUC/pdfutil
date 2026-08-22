import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';

export interface HwpParsedSection {
  textBlocks: {
    type: 'paragraph' | 'table' | 'image';
    text?: string;
    isHeading?: boolean;
    bold?: boolean;
    align?: 'left' | 'center' | 'right';
    tableData?: {
      rows: {
        cells: {
          text: string;
          colSpan?: number;
          rowSpan?: number;
          bgColor?: string;
        }[];
      }[];
    };
    imageData?: {
      src: string;
      width?: number;
      height?: number;
    };
  }[];
}

/**
 * Parses HWPX (XML in ZIP format)
 */
export async function parseHwpxFile(file: File): Promise<HwpParsedSection> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  
  // Extract images from BinData/ folder
  const imageMap: { [key: string]: string } = {};
  const binDataFiles = Object.keys(zip.files).filter(path => path.includes('BinData/'));
  
  for (const binPath of binDataFiles) {
    const binFile = zip.file(binPath);
    if (binFile) {
      const blob = await binFile.async('blob');
      const filename = binPath.split('/').pop() || '';
      const objectUrl = URL.createObjectURL(blob);
      imageMap[filename] = objectUrl;
      imageMap[filename.toLowerCase()] = objectUrl;
    }
  }

  // Locate section XML files inside Contents/
  const sectionFiles = Object.keys(zip.files)
    .filter(path => path.startsWith('Contents/section') && path.endsWith('.xml'))
    .sort();

  const blocks: HwpParsedSection['textBlocks'] = [];

  for (const sectionPath of sectionFiles) {
    const sectionXmlText = await zip.file(sectionPath)?.async('string');
    if (!sectionXmlText) continue;

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(sectionXmlText, 'text/xml');

    const elements = xmlDoc.querySelectorAll('hp\\:p, p, hp\\:tbl, tbl, hp\\:pic, pic');

    elements.forEach(node => {
      const nodeName = node.tagName.toLowerCase();

      // TABLE Node
      if (nodeName.includes('tbl')) {
        const rowsNode = node.querySelectorAll('hp\\:tr, tr');
        const rows: { cells: { text: string; bgColor?: string }[] }[] = [];

        rowsNode.forEach(tr => {
          const cellsNode = tr.querySelectorAll('hp\\:tc, tc');
          const cells: { text: string; bgColor?: string }[] = [];

          cellsNode.forEach(tc => {
            const cellText = tc.textContent?.trim() || '';
            cells.push({ text: cellText });
          });

          if (cells.length > 0) {
            rows.push({ cells });
          }
        });

        if (rows.length > 0) {
          blocks.push({
            type: 'table',
            tableData: { rows }
          });
        }
      } 
      // IMAGE Node
      else if (nodeName.includes('pic')) {
        const imgNode = node.querySelector('hc\\:img, img, hp\\:img');
        const binRef = imgNode?.getAttribute('binaryCodeRef') || imgNode?.getAttribute('src') || '';
        if (binRef && (imageMap[binRef] || imageMap[binRef.toLowerCase()])) {
          blocks.push({
            type: 'image',
            imageData: {
              src: imageMap[binRef] || imageMap[binRef.toLowerCase()]
            }
          });
        }
      } 
      // PARAGRAPH Node
      else if (nodeName.includes('p')) {
        const textContent = node.textContent?.trim() || '';
        if (textContent) {
          blocks.push({
            type: 'paragraph',
            text: textContent
          });
        }
      }
    });
  }

  // Fallback if section XML returned no blocks
  if (blocks.length === 0) {
    const section0Text = await zip.file('Contents/section0.xml')?.async('string');
    if (section0Text) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(section0Text, 'text/xml');
      const allText = xmlDoc.documentElement.textContent || '';
      const paragraphs = allText.split('\n').map(line => line.trim()).filter(Boolean);
      paragraphs.forEach(p => {
        blocks.push({ type: 'paragraph', text: p });
      });
    }
  }

  return { textBlocks: blocks };
}

/**
 * Parses HWP 5.0 (.hwp binary OLE compound document)
 */
export async function parseHwpBinaryFile(file: File): Promise<HwpParsedSection> {
  const arrayBuffer = await file.arrayBuffer();
  const dataView = new DataView(arrayBuffer);
  const uint8Array = new Uint8Array(arrayBuffer);

  const blocks: HwpParsedSection['textBlocks'] = [];
  const imagesFound: string[] = [];
  
  for (let i = 0; i < uint8Array.length - 8; i++) {
    // PNG Magic Header: 89 50 4E 47 0D 0A 1A 0A
    if (
      uint8Array[i] === 0x89 &&
      uint8Array[i + 1] === 0x50 &&
      uint8Array[i + 2] === 0x4e &&
      uint8Array[i + 3] === 0x47
    ) {
      let endIdx = i + 8;
      while (endIdx < uint8Array.length - 8) {
        if (
          uint8Array[endIdx] === 0x49 &&
          uint8Array[endIdx + 1] === 0x45 &&
          uint8Array[endIdx + 2] === 0x4e &&
          uint8Array[endIdx + 3] === 0x44
        ) {
          endIdx += 8;
          break;
        }
        endIdx++;
      }
      if (endIdx > i + 10 && endIdx <= uint8Array.length) {
        const pngBytes = uint8Array.subarray(i, endIdx);
        const blob = new Blob([pngBytes], { type: 'image/png' });
        imagesFound.push(URL.createObjectURL(blob));
        i = endIdx;
      }
    }
    // JPEG Magic Header: FF D8 FF
    else if (
      uint8Array[i] === 0xff &&
      uint8Array[i + 1] === 0xd8 &&
      uint8Array[i + 2] === 0xff
    ) {
      let endIdx = i + 2;
      while (endIdx < uint8Array.length - 2) {
        if (uint8Array[endIdx] === 0xff && uint8Array[endIdx + 1] === 0xd9) {
          endIdx += 2;
          break;
        }
        endIdx++;
      }
      if (endIdx > i + 4 && endIdx - i < 10000000) {
        const jpegBytes = uint8Array.subarray(i, endIdx);
        const blob = new Blob([jpegBytes], { type: 'image/jpeg' });
        imagesFound.push(URL.createObjectURL(blob));
        i = endIdx;
      }
    }
  }

  // Extract UTF-16LE text blocks from HWP binary
  let textBuffer = '';
  for (let i = 0; i < arrayBuffer.byteLength - 1; i += 2) {
    const charCode = dataView.getUint16(i, true);
    if (
      (charCode >= 0x20 && charCode <= 0x7e) ||
      (charCode >= 0xac00 && charCode <= 0xd7a3) ||
      (charCode >= 0x3130 && charCode <= 0x318f) ||
      charCode === 0x0a ||
      charCode === 0x0d
    ) {
      textBuffer += String.fromCharCode(charCode);
    } else {
      if (textBuffer.length > 5) {
        const cleaned = textBuffer.trim();
        if (cleaned.length > 2 && !/^[0-9a-f]{8,}$/i.test(cleaned)) {
          blocks.push({ type: 'paragraph', text: cleaned });
        }
      }
      textBuffer = '';
    }
  }

  if (textBuffer.length > 5) {
    blocks.push({ type: 'paragraph', text: textBuffer.trim() });
  }

  imagesFound.forEach(imgUrl => {
    blocks.push({
      type: 'image',
      imageData: { src: imgUrl }
    });
  });

  return { textBlocks: blocks };
}

/**
 * Converts HWP/HWPX parsed structure to PDF Blob via Canvas and pdf-lib
 */
export async function convertHwpParsedToPdf(
  parsed: HwpParsedSection,
  fileName: string,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Base A4 dimensions in points (72 DPI)
  const a4WidthPt = 595.28;
  const a4HeightPt = 841.89;

  // High Resolution Scale Factor (3.5x = ~250-300 DPI for crisp vector-like text rendering)
  const scale = 3.5;

  canvas.width = Math.round(a4WidthPt * scale);   // ~2083 px
  canvas.height = Math.round(a4HeightPt * scale); // ~2947 px

  const marginX = Math.round(40 * scale);
  const marginY = Math.round(45 * scale);
  const contentWidth = canvas.width - marginX * 2;

  let currentY = marginY;

  const renderNewPageHeader = () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    currentY = marginY;
  };

  renderNewPageHeader();

  // Document Title Header
  ctx.font = `bold ${Math.round(20 * scale)}px "Malgun Gothic", "Noto Sans KR", sans-serif`;
  ctx.fillStyle = '#111827';

  const title = fileName.replace(/\.(hwp|hwpx)$/i, '');
  ctx.fillText(title, marginX, currentY);
  currentY += Math.round(32 * scale);

  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = Math.max(1, Math.round(1.5 * scale));
  ctx.beginPath();
  ctx.moveTo(marginX, currentY);
  ctx.lineTo(canvas.width - marginX, currentY);
  ctx.stroke();
  currentY += Math.round(24 * scale);

  const totalBlocks = parsed.textBlocks.length || 1;

  const flushPageToPdf = async () => {
    const pageImgData = canvas.toDataURL('image/png');
    const pdfImage = await pdfDoc.embedPng(pageImgData);
    const pdfPage = pdfDoc.addPage([a4WidthPt, a4HeightPt]);
    pdfPage.drawImage(pdfImage, {
      x: 0,
      y: 0,
      width: a4WidthPt,
      height: a4HeightPt,
    });
    renderNewPageHeader();
  };

  for (let idx = 0; idx < parsed.textBlocks.length; idx++) {
    if (onProgress) onProgress(idx + 1, totalBlocks);

    const block = parsed.textBlocks[idx];

    if (currentY > canvas.height - marginY - Math.round(50 * scale)) {
      await flushPageToPdf();
    }

    // Render PARAGRAPH
    if (block.type === 'paragraph' && block.text) {
      const fontSize = Math.round(13 * scale);
      const lineHeight = Math.round(20 * scale);
      const paragraphSpacing = Math.round(24 * scale);

      ctx.font = `${fontSize}px "Malgun Gothic", "Noto Sans KR", "Apple SD Gothic Neo", sans-serif`;
      ctx.fillStyle = '#1f2937';

      const chars = block.text.split('');
      let currentLine = '';

      for (let i = 0; i < chars.length; i++) {
        const testLine = currentLine + chars[i];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > contentWidth && i > 0) {
          ctx.fillText(currentLine, marginX, currentY);
          currentLine = chars[i];
          currentY += lineHeight;

          if (currentY > canvas.height - marginY - Math.round(35 * scale)) {
            await flushPageToPdf();
            ctx.font = `${fontSize}px "Malgun Gothic", "Noto Sans KR", "Apple SD Gothic Neo", sans-serif`;
            ctx.fillStyle = '#1f2937';
          }
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        ctx.fillText(currentLine, marginX, currentY);
        currentY += paragraphSpacing;
      }
    }
    // Render TABLE
    else if (block.type === 'table' && block.tableData) {
      currentY += Math.round(6 * scale);
      const rows = block.tableData.rows;
      if (rows.length > 0) {
        const colCount = Math.max(...rows.map(r => r.cells.length));
        const cellWidth = contentWidth / Math.max(1, colCount);
        const cellHeight = Math.round(28 * scale);
        const fontSize = Math.round(11 * scale);

        for (const row of rows) {
          if (currentY + cellHeight > canvas.height - marginY) {
            await flushPageToPdf();
          }

          row.cells.forEach((cell, cIdx) => {
            const cellX = marginX + cIdx * cellWidth;
            
            ctx.fillStyle = '#f9fafb';
            ctx.fillRect(cellX, currentY, cellWidth, cellHeight);

            ctx.strokeStyle = '#9ca3af';
            ctx.lineWidth = Math.max(1, Math.round(1 * scale));
            ctx.strokeRect(cellX, currentY, cellWidth, cellHeight);

            ctx.fillStyle = '#111827';
            ctx.font = `${fontSize}px "Malgun Gothic", "Noto Sans KR", sans-serif`;
            const cellText = cell.text.length > 30 ? cell.text.substring(0, 29) + '…' : cell.text;
            ctx.fillText(cellText, cellX + Math.round(6 * scale), currentY + Math.round(18 * scale));
          });

          currentY += cellHeight;
        }
        currentY += Math.round(16 * scale);
      }
    }
    // Render IMAGE
    else if (block.type === 'image' && block.imageData?.src) {
      currentY += Math.round(6 * scale);
      try {
        const img = new Image();
        img.src = block.imageData.src;
        await new Promise((res) => {
          img.onload = res;
          img.onerror = res;
        });

        const maxImgWidth = contentWidth;
        const maxImgHeight = Math.round(350 * scale);
        let imgW = (img.width || 400) * scale;
        let imgH = (img.height || 300) * scale;

        if (imgW > maxImgWidth) {
          imgH = (maxImgWidth / imgW) * imgH;
          imgW = maxImgWidth;
        }
        if (imgH > maxImgHeight) {
          imgW = (maxImgHeight / imgH) * imgW;
          imgH = maxImgHeight;
        }

        if (currentY + imgH > canvas.height - marginY) {
          await flushPageToPdf();
        }

        ctx.drawImage(img, marginX, currentY, imgW, imgH);
        currentY += imgH + Math.round(20 * scale);
      } catch (err) {
        console.error('Failed to render embedded HWP image:', err);
      }
    }
  }

  // Flush final canvas page
  const finalPageImgData = canvas.toDataURL('image/png');
  const pdfImage = await pdfDoc.embedPng(finalPageImgData);
  const pdfPage = pdfDoc.addPage([a4WidthPt, a4HeightPt]);
  pdfPage.drawImage(pdfImage, {
    x: 0,
    y: 0,
    width: a4WidthPt,
    height: a4HeightPt,
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}
