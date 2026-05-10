import prisma from '@/lib/db';
import { apiResponse, handleApiError } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));

    // Get daily entries grouped by product (these represent finished goods)
    const entries = await prisma.dailyEntry.findMany({
      where: { monthlyPlan: { year, month } },
      include: {
        product: true,
        monthlyPlan: true
      },
      orderBy: { date: 'desc' }
    });

    // Aggregate by product
    const byProduct: Record<string, any> = {};
    entries.forEach(e => {
      const key = e.productId;
      if (!byProduct[key]) {
        byProduct[key] = {
          sku: e.product?.skuCode,
          nameEn: e.product?.nameEn,
          brand: e.product?.brand,
          totalProduced: 0,
          totalRework: 0,
          netGood: 0,
          shiftCount: 0,
          lastDate: e.date
        };
      }
      byProduct[key].totalProduced += e.actualQty;
      byProduct[key].totalRework += e.reworkQty;
      byProduct[key].shiftCount++;
      if (new Date(e.date) > new Date(byProduct[key].lastDate)) {
        byProduct[key].lastDate = e.date;
      }
    });

    Object.values(byProduct).forEach((p: any) => {
      p.netGood = p.totalProduced - p.totalRework;
    });

    // Today's entries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEntries = entries.filter(e => {
      const d = new Date(e.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });

    const todayTotal = todayEntries.reduce((s, e) => s + e.actualQty, 0);
    const grandTotal = Object.values(byProduct).reduce((s: number, p: any) => s + p.netGood, 0);
    const pendingReceipt = Object.values(byProduct).reduce((s: number, p: any) => s + p.totalRework, 0);

    // Recent entries (last 20)
    const recent = entries.slice(0, 20).map(e => ({
      date: e.date,
      shift: e.shift,
      sku: e.product?.skuCode,
      nameEn: e.product?.nameEn,
      qty: e.actualQty,
      rework: e.reworkQty,
      net: e.actualQty - e.reworkQty
    }));

    return apiResponse({
      summary: {
        todayTotal,
        grandTotal,
        pendingReceipt,
        productCount: Object.keys(byProduct).length,
        shiftEntries: entries.length
      },
      byProduct: Object.values(byProduct),
      recent,
      period: { year, month }
    });
  } catch (error) {
    return handleApiError(error, 'GET_FINISHED_GOODS');
  }
}
