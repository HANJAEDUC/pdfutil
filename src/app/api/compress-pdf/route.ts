import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';


// Python executable path detection
function getPythonCommand(): string {
  if (process.platform === 'win32') {
    const knownPaths = [
      'C:\\Python312\\python.exe',
      'C:\\Python311\\python.exe',
      'C:\\Python310\\python.exe',
      'C:\\Python39\\python.exe',
      'python.exe',
      'python',
    ];
    for (const p of knownPaths) {
      if (fs.existsSync(p)) return p;
    }
  }
  return 'python3';
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const level = (formData.get('level') as string) || 'medium';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const validLevels = ['strong', 'medium', 'quality'];
    const safeLevel = validLevels.includes(level) ? level : 'medium';

    // Temp file paths
    const tempDir = os.tmpdir();
    const fileId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const inputPath = path.join(tempDir, `input_${fileId}.pdf`);
    const outputPath = path.join(tempDir, `output_${fileId}.pdf`);

    // Write uploaded file to temp path
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(inputPath, fileBuffer);

    // Engine script path
    const engineScript = path.join(process.cwd(), 'src', 'lib', 'pdfCompressEngine.py');
    const pythonCmd = getPythonCommand();

    // Run python compression engine
    await new Promise<void>((resolve, reject) => {
      const proc = spawn(pythonCmd, [
        engineScript,
        '--input',
        inputPath,
        '--output',
        outputPath,
        '--level',
        safeLevel,
      ]);

      let stderr = '';
      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Python compression failed with code ${code}: ${stderr}`));
        }
      });
    });

    if (!fs.existsSync(outputPath)) {
      throw new Error('Compressed output file was not generated.');
    }

    const compressedBuffer = await fs.promises.readFile(outputPath);
    const originalSize = fileBuffer.length;
    const compressedSize = compressedBuffer.length;

    // Clean up temp files asynchronously
    setTimeout(async () => {
      try {
        if (fs.existsSync(inputPath)) await fs.promises.unlink(inputPath);
        if (fs.existsSync(outputPath)) await fs.promises.unlink(outputPath);
      } catch (err) {
        console.error('Error cleaning up temp files:', err);
      }
    }, 1000);

    const safeFilename = encodeURIComponent(
      file.name.replace(/\.pdf$/i, '') + `_compressed_${safeLevel}.pdf`
    );

    return new NextResponse(compressedBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`,
        'X-Original-Size': originalSize.toString(),
        'X-Compressed-Size': compressedSize.toString(),
        'X-Compression-Level': safeLevel,
      },
    });
  } catch (error: any) {
    console.error('API /api/compress-pdf error:', error);
    return NextResponse.json(
      { error: error.message || 'Compression failed' },
      { status: 500 }
    );
  }
}
