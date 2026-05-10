import prisma from '@/lib/db';
import { DailyEntrySchema } from '@/lib/validations/mes.schema';
import { handleApiError, apiResponse } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    const year = parseInt(searchParams.get('year') || '2026');
    const month = parseInt(searchParams.get('month') || '3');

    const where: any = planId ? { monthlyPlanId: planId } : {
      monthlyPlan: { year, month }
    };

    const entries = await prisma.dailyEntry.findMany({
      where,
      include: { product: true, monthlyPlan: true },
      orderBy: [{ date: 'asc' }, { shift: 'asc' }]
    });

    return apiResponse(entries);
  } catch (error) {
    return handleApiError(error, 'GET_DAILY_ENTRIES');
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = DailyEntrySchema.parse(body);

    const entryDate = new Date(validatedData.date);

    const entry = await prisma.dailyEntry.upsert({
      where: { 
        monthlyPlanId_date_shift: { 
          monthlyPlanId: validatedData.monthlyPlanId, 
          date: entryDate, 
          shift: validatedData.shift 
        } 
      },
      update: {
        actualQty: validatedData.actualQty,
        bulkUsedKg: validatedData.bulkUsedKg,
        headcount: validatedData.headcount,
        wipQty: validatedData.wipQty,
        reworkQty: validatedData.reworkQty,
        notes: validatedData.notes
      },
      create: {
        monthlyPlanId: validatedData.monthlyPlanId,
        productId: validatedData.productId,
        lineId: validatedData.lineId,
        date: entryDate,
        shift: validatedData.shift,
        actualQty: validatedData.actualQty,
        bulkUsedKg: validatedData.bulkUsedKg,
        headcount: validatedData.headcount,
        wipQty: validatedData.wipQty,
        reworkQty: validatedData.reworkQty,
        notes: validatedData.notes
      }
    });

    await prisma.auditLog.create({
      data: { 
        userId: body.userId || 'SYSTEM', 
        action: 'UPSERT_DAILY_ENTRY', 
        entity: 'DailyEntry', 
        details: validatedData 
      }
    });

    return apiResponse(entry);
  } catch (error) {
    return handleApiError(error, 'UPSERT_DAILY_ENTRY');
  }
}
