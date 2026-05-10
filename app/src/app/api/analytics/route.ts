import prisma from '@/lib/db';
import { apiResponse, handleApiError } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));

    // OEE Records for the month
    const oeeRecords = await prisma.oEERecord.findMany({
      where: {
        date: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1)
        }
      },
      include: { machine: true },
      orderBy: { date: 'asc' }
    });

    // Daily production data
    const dailyEntries = await prisma.dailyEntry.findMany({
      where: { monthlyPlan: { year, month } },
      include: { product: true },
      orderBy: { date: 'asc' }
    });

    // Aggregate OEE by day
    const dailyOEE: Record<string, { availability: number[]; performance: number[]; quality: number[]; oee: number[]; output: number; rejects: number }> = {};
    oeeRecords.forEach(r => {
      const day = new Date(r.date).toISOString().split('T')[0];
      if (!dailyOEE[day]) dailyOEE[day] = { availability: [], performance: [], quality: [], oee: [], output: 0, rejects: 0 };
      dailyOEE[day].availability.push(r.availability);
      dailyOEE[day].performance.push(r.performance);
      dailyOEE[day].quality.push(r.quality);
      dailyOEE[day].oee.push(r.oee);
      dailyOEE[day].output += r.outputQty;
      dailyOEE[day].rejects += r.rejectQty;
    });

    const oeeTrend = Object.entries(dailyOEE).map(([day, vals]) => ({
      day,
      availability: Math.round(vals.availability.reduce((s, v) => s + v, 0) / vals.availability.length * 10) / 10,
      performance: Math.round(vals.performance.reduce((s, v) => s + v, 0) / vals.performance.length * 10) / 10,
      quality: Math.round(vals.quality.reduce((s, v) => s + v, 0) / vals.quality.length * 10) / 10,
      oee: Math.round(vals.oee.reduce((s, v) => s + v, 0) / vals.oee.length * 10) / 10,
      output: vals.output,
      rejects: vals.rejects
    }));

    // Aggregate OEE by machine
    const byMachine: Record<string, { name: string; records: number; avgOEE: number; totalOutput: number; totalDowntime: number }> = {};
    oeeRecords.forEach(r => {
      const key = r.machineId;
      if (!byMachine[key]) byMachine[key] = { name: r.machine?.name || 'Unknown', records: 0, avgOEE: 0, totalOutput: 0, totalDowntime: 0 };
      byMachine[key].records++;
      byMachine[key].avgOEE += r.oee;
      byMachine[key].totalOutput += r.outputQty;
      byMachine[key].totalDowntime += (r.adjustMins + r.mechFailMins + r.minorStopMins + r.changeoverMins + r.utilityMins + r.waitMins + r.manageMins);
    });
    Object.values(byMachine).forEach((m: any) => { m.avgOEE = Math.round(m.avgOEE / m.records * 10) / 10; });

    // Daily production trend
    const dailyProd: Record<string, number> = {};
    dailyEntries.forEach(e => {
      const day = new Date(e.date).toISOString().split('T')[0];
      dailyProd[day] = (dailyProd[day] || 0) + e.actualQty;
    });
    const productionTrend = Object.entries(dailyProd).map(([day, qty]) => ({ day, qty }));

    // Overall averages
    const avgA = oeeRecords.length > 0 ? oeeRecords.reduce((s, r) => s + r.availability, 0) / oeeRecords.length : 0;
    const avgP = oeeRecords.length > 0 ? oeeRecords.reduce((s, r) => s + r.performance, 0) / oeeRecords.length : 0;
    const avgQ = oeeRecords.length > 0 ? oeeRecords.reduce((s, r) => s + r.quality, 0) / oeeRecords.length : 0;
    const avgOEE = oeeRecords.length > 0 ? oeeRecords.reduce((s, r) => s + r.oee, 0) / oeeRecords.length : 0;
    const totalOutput = dailyEntries.reduce((s, e) => s + e.actualQty, 0);
    const totalDowntime = oeeRecords.reduce((s, r) => s + r.adjustMins + r.mechFailMins + r.minorStopMins + r.changeoverMins + r.utilityMins + r.waitMins + r.manageMins, 0);
    const totalRejects = oeeRecords.reduce((s, r) => s + r.rejectQty, 0);

    return apiResponse({
      summary: {
        avgOEE: Math.round(avgOEE * 10) / 10,
        avgA: Math.round(avgA * 10) / 10,
        avgP: Math.round(avgP * 10) / 10,
        avgQ: Math.round(avgQ * 10) / 10,
        totalOutput,
        totalDowntimeHrs: Math.round(totalDowntime / 60 * 10) / 10,
        totalRejects,
        recordCount: oeeRecords.length
      },
      oeeTrend,
      productionTrend,
      byMachine: Object.values(byMachine),
      period: { year, month }
    });
  } catch (error) {
    return handleApiError(error, 'GET_ANALYTICS');
  }
}
