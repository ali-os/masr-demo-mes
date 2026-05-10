import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '2026');
    const month = parseInt(searchParams.get('month') || '3');
    const monthName = new Date(year, month - 1).toLocaleString('en', { month: 'long' });

    // Fetch all monthly plans with daily entries
    const plans = await prisma.monthlyPlan.findMany({
      where: { year, month },
      include: {
        product: true,
        dailyEntries: { orderBy: [{ date: 'asc' }, { shift: 'asc' }] }
      },
      orderBy: { product: { skuCode: 'asc' } }
    });

    // Build MPS Sheet (replicates MPS Jan sheet)
    const mpsData = [
      ['Code', 'Brand', 'Family', 'Item Description', 'Size', 'Category', 'Machine', 'MPS', 'Bulk (KG)'],
      ...plans.map(p => [
        p.product.skuCode,
        p.product.brand || '',
        p.product.family || '',
        p.product.nameAr || p.product.nameEn,
        p.product.packSizeMl || '',
        p.product.category || '',
        p.machineName || '',
        p.targetQty,
        p.bulkKg.toFixed(2)
      ])
    ];

    // Build Production Summary Sheet (like Prod Summary)
    const summaryData = [
      ['Code', 'Brand', 'Family', 'Category', 'Description', 'Vol', 'Monthly Plan', 'Total Production', 'T Act', 'Balance', 'SL %', 'WIP', 'Rework'],
      ...plans.map(p => {
        const totalAct = p.dailyEntries.reduce((s, e) => s + e.actualQty, 0);
        const wip = p.dailyEntries.reduce((s, e) => s + e.wipQty, 0);
        const rework = p.dailyEntries.reduce((s, e) => s + e.reworkQty, 0);
        const sl = p.targetQty > 0 ? (totalAct / p.targetQty * 100).toFixed(1) + '%' : '0%';
        return [
          p.product.skuCode,
          p.product.brand || '',
          p.product.family || '',
          p.product.category || '',
          p.product.nameAr || p.product.nameEn,
          p.product.packSizeMl || '',
          p.targetQty,
          totalAct,
          totalAct,
          p.targetQty - totalAct,
          sl,
          wip,
          rework
        ];
      })
    ];

    // Build Daily Production Sheet (like Production 1/2)
    // Get all unique dates in this month
    const allDates: Set<string> = new Set();
    plans.forEach(p => p.dailyEntries.forEach(e => allDates.add(e.date.toISOString().split('T')[0])));
    const sortedDates = Array.from(allDates).sort();

    const prodHeaders = ['Code', 'Brand', 'Family', 'Category', 'Description', 'Actual Weight', 'Vol', 'Total'];
    sortedDates.forEach(d => {
      const label = new Date(d).toLocaleDateString('en', { day: '2-digit', month: 'short' });
      prodHeaders.push(`${label} Sh1`, `${label} Sh2`);
    });

    const prodData = [
      prodHeaders,
      ...plans.map(p => {
        const row: any[] = [
          p.product.skuCode,
          p.product.brand || '',
          p.product.family || '',
          p.product.category || '',
          p.product.nameAr || p.product.nameEn,
          p.product.volumeMl || '',
          p.product.packSizeMl || '',
          p.dailyEntries.reduce((s, e) => s + e.actualQty, 0)
        ];
        sortedDates.forEach(d => {
          const sh1 = p.dailyEntries.find(e => e.date.toISOString().split('T')[0] === d && e.shift === 1);
          const sh2 = p.dailyEntries.find(e => e.date.toISOString().split('T')[0] === d && e.shift === 2);
          row.push(sh1?.actualQty || '', sh2?.actualQty || '');
        });
        return row;
      })
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(mpsData), 'MPS');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Prod Summary');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(prodData), 'Production');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="MASR_Production_${monthName}_${year}.xlsx"`
      }
    });

  } catch (error: any) {
    console.error('Export Error:', error);
    return NextResponse.json({ error: 'Export failed', details: error.message }, { status: 500 });
  }
}
