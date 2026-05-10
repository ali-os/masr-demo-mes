import prisma from '@/lib/db';
import { apiResponse, handleApiError } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));

    // Get OEE records for quality stats
    const oeeRecords = await prisma.oEERecord.findMany({
      where: {
        date: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1)
        }
      },
      include: { machine: true },
      orderBy: { date: 'desc' }
    });

    const totalOutput = oeeRecords.reduce((s, r) => s + r.outputQty, 0);
    const totalRejects = oeeRecords.reduce((s, r) => s + r.rejectQty, 0);
    const qualityRate = (totalOutput + totalRejects) > 0 
      ? (totalOutput / (totalOutput + totalRejects) * 100) : 100;

    // Get quality events
    const qualityEvents = await prisma.qualityEvent.findMany({
      where: {
        createdAt: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1)
        }
      },
      include: { workOrder: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Daily entries with rework data
    const reworkEntries = await prisma.dailyEntry.findMany({
      where: {
        monthlyPlan: { year, month },
        reworkQty: { gt: 0 }
      },
      include: { product: true },
      orderBy: { date: 'desc' },
      take: 20
    });

    return apiResponse({
      summary: {
        qualityRate: Math.round(qualityRate * 10) / 10,
        totalOutput,
        totalRejects,
        reworkTotal: reworkEntries.reduce((s, e) => s + e.reworkQty, 0),
        oeeRecordCount: oeeRecords.length
      },
      qualityEvents,
      reworkEntries: reworkEntries.map(e => ({
        date: e.date,
        sku: e.product?.skuCode,
        nameEn: e.product?.nameEn,
        shift: e.shift,
        reworkQty: e.reworkQty,
        actualQty: e.actualQty
      })),
      period: { year, month }
    });
  } catch (error) {
    return handleApiError(error, 'GET_QUALITY');
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const event = await prisma.qualityEvent.create({
      data: {
        workOrderId: body.workOrderId,
        rejectQty: body.rejectQty,
        reason: body.reason,
        sourceTag: 'MANUAL'
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: body.userId || 'SYSTEM',
        action: 'CREATE_QUALITY_EVENT',
        entity: 'QualityEvent',
        details: body
      }
    });

    return apiResponse(event);
  } catch (error) {
    return handleApiError(error, 'CREATE_QUALITY_EVENT');
  }
}
