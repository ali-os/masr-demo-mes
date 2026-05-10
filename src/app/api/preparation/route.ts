import prisma from '@/lib/db';
import { apiResponse, handleApiError } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));

    // Get all plans with product + template data for bulk requirements
    const plans = await prisma.monthlyPlan.findMany({
      where: { year, month },
      include: {
        product: { include: { template: true } },
        dailyEntries: true
      },
      orderBy: { bulkKg: 'desc' }
    });

    // Calculate bulk requirements per product
    const bulkRequirements = plans.map(plan => {
      const totalActual = plan.dailyEntries.reduce((s, e) => s + e.actualQty, 0);
      const ratio = (plan.product?.ingredientRatio && plan.product.ingredientRatio > 0)
        ? plan.product.ingredientRatio
        : (plan.product?.template?.ingredientRatio || 0);
      
      const bulkRequired = plan.targetQty * ratio;
      const bulkUsed = plan.dailyEntries.reduce((s, e) => s + (e.bulkUsedKg || 0), 0);
      const bulkRemaining = bulkRequired - bulkUsed;
      const progress = bulkRequired > 0 ? (bulkUsed / bulkRequired * 100) : 0;

      return {
        id: plan.id,
        sku: plan.product?.skuCode,
        nameEn: plan.product?.nameEn,
        brand: plan.product?.brand,
        family: plan.product?.family,
        category: plan.product?.category,
        machine: plan.machineName,
        targetQty: plan.targetQty,
        actualQty: totalActual,
        ratio,
        bulkRequired: Math.round(bulkRequired * 10) / 10,
        bulkUsed: Math.round(bulkUsed * 10) / 10,
        bulkRemaining: Math.round(bulkRemaining * 10) / 10,
        progress: Math.round(progress * 10) / 10,
        templateName: plan.product?.template?.name || null
      };
    });

    // Aggregate by category for summary
    const byCategory: Record<string, { total: number; used: number; count: number }> = {};
    bulkRequirements.forEach(b => {
      const cat = b.category || b.family || 'Other';
      if (!byCategory[cat]) byCategory[cat] = { total: 0, used: 0, count: 0 };
      byCategory[cat].total += b.bulkRequired;
      byCategory[cat].used += b.bulkUsed;
      byCategory[cat].count++;
    });

    return apiResponse({
      bulkRequirements,
      byCategory,
      totals: {
        totalBulkRequired: bulkRequirements.reduce((s, b) => s + b.bulkRequired, 0),
        totalBulkUsed: bulkRequirements.reduce((s, b) => s + b.bulkUsed, 0),
        skuCount: bulkRequirements.length
      },
      period: { year, month }
    });
  } catch (error) {
    return handleApiError(error, 'GET_PREPARATION');
  }
}
