import { exec } from 'child_process';
import { NextResponse } from 'next/server';
import path from 'path';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  try {
    const pythonScriptPath = path.join(process.cwd(), '..', 'excel_ingest.py');
    
    // Log the import attempt in the DB
    await prisma.importBatch.create({
      data: {
        filename: 'Daily Prod Report Mar 2026.xlsb',
        status: 'PROCESSING'
      }
    });

    return new Promise((resolve) => {
      exec(`python "${pythonScriptPath}"`, async (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          await prisma.importBatch.updateMany({
            where: { status: 'PROCESSING' },
            data: { status: 'FAILED' }
          });
          resolve(NextResponse.json({ error: 'Ingestion failed', details: stderr }, { status: 500 }));
          return;
        }
        
        await prisma.importBatch.updateMany({
          where: { status: 'PROCESSING' },
          data: { status: 'COMPLETED' }
        });
        
        resolve(NextResponse.json({ message: 'Ingestion successful', output: stdout }));
      });
    });
  } catch (error) {
    console.error('Import API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
