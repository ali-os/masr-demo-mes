import prisma from '@/lib/db';
import { apiResponse, handleApiError } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));

    // Get all plans with their daily entries
    const plans = await prisma.monthlyPlan.findMany({
      where: { year, month },
      include: {
        product: { include: { template: true } },
        dailyEntries: { orderBy: { date: 'asc' } }
      },
      orderBy: { product: { skuCode: 'asc' } }
    });

    // Group daily entries by week (Sun-Thu pattern)
    const workOrders = plans.map(plan => {
      const weeks: Record<string, { target: number; actual: number; days: Record<string, number> }> = {};
      
      // Build daily production map
      const dailyMap: Record<string, number> = {};
      plan.dailyEntries.forEach(e => {
        const dateStr = new Date(e.date).toISOString().split('T')[0];
        dailyMap[dateStr] = (dailyMap[dateStr] || 0) + e.actualQty;
      });

      // Generate weeks for the month
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      let weekNum = 1;
      let weekStart = new Date(firstDay);
      
      while (weekStart <= lastDay) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (weekEnd > lastDay) weekEnd.setTime(lastDay.getTime());
        
        const weekKey = `W${weekNum}`;
        const days: Record<string, number> = {};
        let weekActual = 0;
        
        const d = new Date(weekStart);
        while (d <= weekEnd) {
          const dateStr = d.toISOString().split('T')[0];
          const dayProd = dailyMap[dateStr] || 0;
          days[dateStr] = dayProd;
          weekActual += dayProd;
          d.setDate(d.getDate() + 1);
        }
        
        weeks[weekKey] = {
          target: Math.round(plan.targetQty / 4), // rough weekly split
          actual: weekActual,
          days
        };
        
        weekNum++;
        weekStart.setDate(weekStart.getDate() + 7);
      }

      const totalActual = plan.dailyEntries.reduce((s, e) => s + e.actualQty, 0);
      const effectiveSpeed = (plan.product?.idealSpeed && plan.product.idealSpeed > 0)
        ? plan.product.idealSpeed
        : (plan.product?.template?.idealSpeed || 0);

      return {
        id: plan.id,
        sku: plan.product?.skuCode,
        nameEn: plan.product?.nameEn,
        nameAr: plan.product?.nameAr,
        brand: plan.product?.brand,
        family: plan.product?.family,
        packSizeMl: plan.product?.packSizeMl,
        machine: plan.machineName,
        monthlyTarget: plan.targetQty,
        bulkKg: plan.bulkKg,
        totalActual,
        sl: plan.targetQty > 0 ? Math.round(totalActual / plan.targetQty * 1000) / 10 : 0,
        weeks
      };
    });

    return apiResponse(workOrders);
  } catch (error) {
    return handleApiError(error, 'GET_WORK_ORDERS');
  }
}
