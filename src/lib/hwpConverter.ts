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

  const pageWidth = 794;
  const pageHeight = 1123;
  canvas.width = pageWidth * 2;
  canvas.height = pageHeight * 2;

  const marginX = 60 * 2;
  const marginY = 60 * 2;
  const contentWidth = canvas.width - marginX * 2;

  let currentY = marginY;

  const renderNewPageHeader = () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    currentY = marginY;
  };

  renderNewPageHeader();

  // Document Title
  ctx.font = 'bold 36px sans-serif';
  ctx.fillStyle = '#111827';

  const title = fileName.replace(/\.(hwp|hwpx)$/i, '');
  ctx.fillText(title, marginX, currentY);
  currentY += 60;

  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(marginX, currentY);
  ctx.lineTo(canvas.width - marginX, currentY);
  ctx.stroke();
  currentY += 40;

  const totalBlocks = parsed.textBlocks.length || 1;

  for (let idx = 0; idx < parsed.textBlocks.length; idx++) {
    if (onProgress) onProgress(idx + 1, totalBlocks);

    const block = parsed.textBlocks[idx];

    if (currentY > canvas.height - marginY - 100) {
      const pageImgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdfImage = await pdfDoc.embedJpg(pageImgData);
      const pdfPage = pdfDoc.addPage([595.28, 841.89]);
      pdfPage.drawImage(pdfImage, {
        x: 0,
        y: 0,
        width: 595.28,
        height: 841.89,
      });
      renderNewPageHeader();
    }

    // Render PARAGRAPH
    if (block.type === 'paragraph' && block.text) {
      ctx.font = '24px "Malgun Gothic", "Noto Sans KR", sans-serif';
      ctx.fillStyle = '#1f2937';

      const words = block.text.split('');
      let currentLine = '';

      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + words[i];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > contentWidth && i > 0) {
          ctx.fillText(currentLine, marginX, currentY);
          currentLine = words[i];
          currentY += 36;

          if (currentY > canvas.height - marginY - 60) {
            const pageImgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdfImage = await pdfDoc.embedJpg(pageImgData);
            const pdfPage = pdfDoc.addPage([595.28, 841.89]);
            pdfPage.drawImage(pdfImage, { x: 0, y: 0, width: 595.28, height: 841.89 });
            renderNewPageHeader();
          }
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        ctx.fillText(currentLine, marginX, currentY);
        currentY += 44;
      }
    }
    // Render TABLE
    else if (block.type === 'table' && block.tableData) {
      currentY += 10;
      const rows = block.tableData.rows;
      if (rows.length > 0) {
        const colCount = Math.max(...rows.map(r => r.cells.length));
        const cellWidth = contentWidth / Math.max(1, colCount);
        const cellHeight = 50;

        for (const row of rows) {
          if (currentY + cellHeight > canvas.height - marginY) {
            const pageImgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdfImage = await pdfDoc.embedJpg(pageImgData);
            const pdfPage = pdfDoc.addPage([595.28, 841.89]);
            pdfPage.drawImage(pdfImage, { x: 0, y: 0, width: 595.28, height: 841.89 });
            renderNewPageHeader();
          }

          row.cells.forEach((cell, cIdx) => {
            const cellX = marginX + cIdx * cellWidth;
            
            ctx.fillStyle = '#f9fafb';
            ctx.fillRect(cellX, currentY, cellWidth, cellHeight);

            ctx.strokeStyle = '#9ca3af';
            ctx.lineWidth = 2;
            ctx.strokeRect(cellX, currentY, cellWidth, cellHeight);

            ctx.fillStyle = '#111827';
            ctx.font = '20px "Malgun Gothic", "Noto Sans KR", sans-serif';
            const cellText = cell.text.length > 25 ? cell.text.substring(0, 24) + '…' : cell.text;
            ctx.fillText(cellText, cellX + 12, currentY + 32);
          });

          currentY += cellHeight;
        }
        currentY += 30;
      }
    }
    // Render IMAGE
    else if (block.type === 'image' && block.imageData?.src) {
      currentY += 10;
      try {
        const img = new Image();
        img.src = block.imageData.src;
        await new Promise((res) => {
          img.onload = res;
          img.onerror = res;
        });

        const maxImgWidth = contentWidth;
        const maxImgHeight = 400 * 2;
        let imgW = img.width || 400;
        let imgH = img.height || 300;

        if (imgW > maxImgWidth) {
          imgH = (maxImgWidth / imgW) * imgH;
          imgW = maxImgWidth;
        }
        if (imgH > maxImgHeight) {
          imgW = (maxImgHeight / imgH) * imgW;
          imgH = maxImgHeight;
        }

        if (currentY + imgH > canvas.height - marginY) {
          const pageImgData = canvas.toDataURL('image/jpeg', 0.95);
          const pdfImage = await pdfDoc.embedJpg(pageImgData);
          const pdfPage = pdfDoc.addPage([595.28, 841.89]);
          pdfPage.drawImage(pdfImage, { x: 0, y: 0, width: 595.28, height: 841.89 });
          renderNewPageHeader();
        }

        ctx.drawImage(img, marginX, currentY, imgW, imgH);
        currentY += imgH + 40;
      } catch (err) {
        console.error('Failed to render embedded HWP image:', err);
      }
    }
  }

  // Flush final canvas page
  const finalPageImgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdfImage = await pdfDoc.embedJpg(finalPageImgData);
  const pdfPage = pdfDoc.addPage([595.28, 841.89]);
  pdfPage.drawImage(pdfImage, { x: 0, y: 0, width: 595.28, height: 841.89 });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}
