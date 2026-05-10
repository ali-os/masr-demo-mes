import prisma from '@/lib/db';
import { handleApiError, apiResponse } from '@/lib/api-utils';

export async function GET() {
  try {
    // We use MonthlyPlan because it has the direct link to products and targets
    const plans = await prisma.monthlyPlan.findMany({
      include: {
        product: true,
        line: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const readiness = plans.map(plan => {
      const bulkNeeded = (plan.targetQty || 0) * (plan.product?.ingredientRatio || 0);
      return {
        id: plan.id,
        sku: plan.product?.skuCode,
        description: plan.product?.nameEn,
        target: plan.targetQty,
        line: plan.machineName || plan.line?.name || 'Any',
        bulkNeeded: bulkNeeded.toFixed(1),
        status: bulkNeeded > 500 ? 'SHORTAGE' : 'READY'
      };
    });

    return apiResponse(readiness);
  } catch (error) {
    return handleApiError(error, 'GET_STORES_READINESS');
  }
}
