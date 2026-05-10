import prisma from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * UNIVERSAL OPERATIONAL LOGGER
 * Handles Downtime, Rejects, and Machine States.
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { type, payload, role, userId } = data;

    // 1. Audit Log Entry (Logically every action is tracked)
    await prisma?.auditLog.create({
      data: {
        userId: userId || 'SYSTEM',
        action: `CREATE_${type.toUpperCase()}`,
        entity: type,
        details: payload
      }
    });

    // 2. Route based on type
    let result;
    switch (type) {
      case 'downtime':
        result = await prisma?.downtimeEvent.create({
          data: {
            workOrderId: payload.workOrderId,
            machineId: payload.machineId,
            lossCodeId: payload.lossCodeId,
            sourceTag: payload.sourceTag || 'MANUAL',
            startTime: new Date(payload.startTime),
            endTime: payload.endTime ? new Date(payload.endTime) : null,
            status: 'OPEN'
          }
        });
        break;

      case 'quality':
        result = await prisma?.qualityEvent.create({
          data: {
            workOrderId: payload.workOrderId,
            rejectQty: Number(payload.rejectQty),
            reason: payload.reason,
            sourceTag: payload.sourceTag || 'MANUAL'
          }
        });
        break;

      case 'state':
        result = await prisma?.machineStateEvent.create({
          data: {
            machineId: payload.machineId,
            state: payload.state,
            sourceTag: payload.sourceTag || 'MANUAL',
            startTime: new Date()
          }
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid log type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Operational Log API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
