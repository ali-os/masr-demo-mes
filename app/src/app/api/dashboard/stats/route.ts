import prisma from '@/lib/db';
import { apiResponse, handleApiError } from '@/lib/api-utils';

export async function GET() {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // 1. MPS Totals
    const plans = await prisma.monthlyPlan.findMany({ where: { year, month } });
    const totalMps = plans.reduce((s, p) => s + p.targetQty, 0);
    const totalBulk = plans.reduce((s, p) => s + (p.bulkKg || 0), 0);

    // 2. Total Actual Production
    const entries = await prisma.dailyEntry.findMany({
      where: { monthlyPlan: { year, month } }
    });
    const totalProd = entries.reduce((s, e) => s + e.actualQty, 0);

    // 3. Today's production
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEntries = entries.filter(e => {
      const d = new Date(e.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });
    const todayProd = todayEntries.reduce((s, e) => s + e.actualQty, 0);

    // 4. SL%
    const sl = totalMps > 0 ? (totalProd / totalMps * 100) : 0;

    // 5. OEE (average from OEE records this month)
    const oeeRecords = await prisma.oEERecord.findMany({
      where: {
        date: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1)
        }
      }
    });
    const avgOEE = oeeRecords.length > 0
      ? oeeRecords.reduce((s, r) => s + r.oee, 0) / oeeRecords.length
      : 0;

    // 6. SKU counts
    const totalSKUs = await prisma.product.count();
    const activeSKUs = plans.length;
    const templateCount = await prisma.productTemplate.count();

    // 7. Quality stats from OEE records
    const totalOutput = oeeRecords.reduce((s, r) => s + r.outputQty, 0);
    const totalRejects = oeeRecords.reduce((s, r) => s + r.rejectQty, 0);
    const qualityRate = (totalOutput + totalRejects) > 0 ? (totalOutput / (totalOutput + totalRejects) * 100) : 100;

    return apiResponse({
      mps: { total: totalMps, activeSKUs, bulk: Math.round(totalBulk) },
      production: { total: totalProd, today: todayProd, sl: Math.round(sl * 10) / 10 },
      oee: { average: Math.round(avgOEE * 10) / 10, records: oeeRecords.length },
      quality: { rate: Math.round(qualityRate * 10) / 10, rejects: totalRejects },
      catalog: { totalSKUs, templates: templateCount },
      period: { year, month }
    });
  } catch (error) {
    return handleApiError(error, 'GET_DASHBOARD_STATS');
  }
}
