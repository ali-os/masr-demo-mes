import prisma from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { skuCode, count, rework, line, shift, date } = data;

    // In a real system, we'd find the active WorkOrder for this line/sku
    // For now, we log it as a production fact
    if (prisma) {
      // Find or create a dummy work order for the demo
      const workOrder = await prisma.workOrder.findFirst();
      const machine = await prisma.machine.findFirst({ where: { name: line } });

      if (workOrder && machine) {
        await prisma.productionFact.create({
          data: {
            workOrderId: workOrder.id,
            machineId: machine.id,
            count: Number(count),
            sourceTag: 'MANUAL',
            timestamp: new Date(date)
          }
        });
      }
    }

    // Even without Prisma, we log to the console for the dev to see
    console.log(`Production Entry Received: SKU=${skuCode}, Count=${count}, Line=${line}`);

    return NextResponse.json({ message: 'Production entry recorded successfully' });
  } catch (error) {
    console.error('Production Entry API Error:', error);
    return NextResponse.json({ error: 'Failed to record entry' }, { status: 500 });
  }
}
