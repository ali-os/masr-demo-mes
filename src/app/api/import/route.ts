import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { execSync } from 'child_process';
import prisma from '@/lib/db';

// POST /api/import — accepts multipart file upload
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const importType = formData.get('type') as string || 'DAILY_PROD';
    const year = parseInt(formData.get('year') as string || '2026');
    const month = parseInt(formData.get('month') as string || '3');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Save the uploaded file to temp directory
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `import_${Date.now()}_${file.name}`;
    const tmpPath = join(tmpdir(), filename);
    await writeFile(tmpPath, buffer);

    // Create an ImportBatch record
    const batch = await prisma.importBatch.create({
      data: { filename: file.name, type: importType, status: 'PENDING' }
    });

    // Run the Python parser
    const scriptPath = join(process.cwd(), 'excel_ingest_full.py');
    let result;
    try {
      const output = execSync(
        `python "${scriptPath}" --file "${tmpPath}" --type ${importType} --year ${year} --month ${month} --db-url "${process.env.DATABASE_URL}"`,
        { encoding: 'utf-8', timeout: 120000 }
      );
      result = JSON.parse(output);
    } catch (pyError: any) {
      await prisma.importBatch.update({
        where: { id: batch.id },
        data: { status: 'FAILED', errors: { message: pyError.message } }
      });
      return NextResponse.json({
        error: 'Python parser failed',
        details: pyError.stderr || pyError.message
      }, { status: 500 });
    }

    // Update batch with results
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: 'SUCCESS',
        recordCount: result.inserted || 0,
        errors: result.warnings?.length > 0 ? { warnings: result.warnings } : undefined
      }
    });

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      inserted: result.inserted,
      skipped: result.skipped,
      warnings: result.warnings
    });

  } catch (error: any) {
    console.error('Import Error:', error);
    return NextResponse.json({ error: 'Import failed', details: error.message }, { status: 500 });
  }
}
