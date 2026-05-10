import prisma from '@/lib/db';
import { OEERecordSchema } from '@/lib/validations/mes.schema';
import { handleApiError, apiResponse } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const machineId = searchParams.get('machineId');
    const date = searchParams.get('date');

    const where: any = {};
    if (machineId) where.machineId = machineId;
    if (date) where.date = new Date(date);

    const records = await prisma.oEERecord.findMany({
      where,
      include: { machine: true },
      orderBy: { date: 'desc' }
    });
    return apiResponse(records);
  } catch (error) {
    return handleApiError(error, 'GET_OEE_RECORDS');
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = OEERecordSchema.parse(body);

    const recDate = new Date(validatedData.date);

    // Calculate OEE
    const totalDowntime = 
      validatedData.adjustMins + 
      validatedData.mechFailMins + 
      validatedData.minorStopMins + 
      validatedData.changeoverMins + 
      validatedData.utilityMins + 
      validatedData.waitMins + 
      validatedData.manageMins;
    
    const runtime = validatedData.plannedTimeMins - totalDowntime;
    const availability = (validatedData.plannedTimeMins > 0) ? (runtime / validatedData.plannedTimeMins * 100) : 0;
    
    // Performance and Quality
    const totalOutput = validatedData.outputQty + validatedData.rejectQty;
    const quality = totalOutput > 0 ? (validatedData.outputQty / totalOutput * 100) : 100;
      
    // Calculate real performance based on product's ideal speed
    let performance = 0;
    if (validatedData.productId && runtime > 0) {
      const product = await prisma.product.findUnique({ where: { id: validatedData.productId } });
      const idealRate = product?.idealSpeed || 60; // fallback to 60 units/min
      const idealOutput = idealRate * runtime;
      performance = Math.min((totalOutput / idealOutput) * 100, 100);
    } else {
      performance = 92; // Default if no product specified
    }

    const oee = (availability/100) * (performance/100) * (quality/100) * 100;

    const record = await prisma.oEERecord.upsert({
      where: { 
        machineId_date_shift: { 
          machineId: validatedData.machineId, 
          date: recDate, 
          shift: validatedData.shift 
        } 
      },
      update: {
        plannedTimeMins: validatedData.plannedTimeMins,
        adjustMins: validatedData.adjustMins,
        mechFailMins: validatedData.mechFailMins,
        minorStopMins: validatedData.minorStopMins,
        changeoverMins: validatedData.changeoverMins,
        qualityLossMins: validatedData.qualityLossMins,
        utilityMins: validatedData.utilityMins,
        waitMins: validatedData.waitMins,
        manageMins: validatedData.manageMins,
        outputQty: validatedData.outputQty,
        rejectQty: validatedData.rejectQty,
        productId: validatedData.productId,
        notes: validatedData.notes,
        availability, performance, quality, oee
      },
      create: {
        machineId: validatedData.machineId,
        date: recDate,
        shift: validatedData.shift,
        plannedTimeMins: validatedData.plannedTimeMins,
        adjustMins: validatedData.adjustMins,
        mechFailMins: validatedData.mechFailMins,
        minorStopMins: validatedData.minorStopMins,
        changeoverMins: validatedData.changeoverMins,
        qualityLossMins: validatedData.qualityLossMins,
        utilityMins: validatedData.utilityMins,
        waitMins: validatedData.waitMins,
        manageMins: validatedData.manageMins,
        outputQty: validatedData.outputQty,
        rejectQty: validatedData.rejectQty,
        productId: validatedData.productId,
        notes: validatedData.notes,
        availability, performance, quality, oee
      }
    });

    await prisma.auditLog.create({
      data: { 
        userId: body.userId || '22e2500c-2682-4106-8d52-b96b2b270bd6', 
        action: 'UPSERT_OEE', 
        entity: 'OEERecord', 
        details: validatedData 
      }
    });

    return apiResponse(record);
  } catch (error) {
    return handleApiError(error, 'UPSERT_OEE');
  }
}
