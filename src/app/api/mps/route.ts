import prisma from '@/lib/db';
import { MonthlyPlanSchema } from '@/lib/validations/mes.schema';
import { handleApiError, apiResponse } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '2026');
    const month = parseInt(searchParams.get('month') || '3');

    const plans = await prisma.monthlyPlan.findMany({
      where: { year, month },
      include: { 
        product: { include: { template: true } }, 
        line: true 
      },
      orderBy: [{ line: { name: 'asc' } }, { product: { skuCode: 'asc' } }]
    });

    // Calculate SL% for each
    const withSL = await Promise.all(plans.map(async (plan) => {
      const actual = await prisma.dailyEntry.aggregate({
        where: { monthlyPlanId: plan.id },
        _sum: { actualQty: true, bulkUsedKg: true }
      });
      const totalActual = actual._sum.actualQty || 0;
      const sl = plan.targetQty > 0 ? (totalActual / plan.targetQty * 100) : 0;
      return { ...plan, totalActual, sl: Math.round(sl * 10) / 10 };
    }));

    return apiResponse(withSL);
  } catch (error) {
    return handleApiError(error, 'GET_MPS');
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = MonthlyPlanSchema.parse(body);

    // Get product for bulk calc with template fallback
    const product = await prisma.product.findUnique({ 
      where: { id: validatedData.productId },
      include: { template: true }
    });
    
    // Inheritance logic: use product ratio if > 0, otherwise fallback to template ratio
    const effectiveRatio = (product?.ingredientRatio && product.ingredientRatio > 0) 
      ? product.ingredientRatio 
      : (product?.template?.ingredientRatio || 0);

    const bulkKg = effectiveRatio * validatedData.targetQty;

    const plan = await prisma.monthlyPlan.upsert({
      where: { 
        year_month_productId: { 
          year: validatedData.year, 
          month: validatedData.month, 
          productId: validatedData.productId 
        } 
      },
      update: { 
        machineName: validatedData.machineName, 
        targetQty: validatedData.targetQty, 
        bulkKg, 
        category: validatedData.category, 
        notes: validatedData.notes,
        status: 'DRAFT' 
      },
      create: { 
        year: validatedData.year, 
        month: validatedData.month, 
        productId: validatedData.productId, 
        machineName: validatedData.machineName, 
        targetQty: validatedData.targetQty, 
        bulkKg, 
        category: validatedData.category, 
        notes: validatedData.notes,
        status: 'DRAFT'
      },
      include: { product: true }
    });

    await prisma.auditLog.create({
      data: { 
        userId: body.userId || 'SYSTEM', 
        action: 'UPSERT_MPS', 
        entity: 'MonthlyPlan', 
        details: validatedData 
      }
    });

    return apiResponse(plan);
  } catch (error) {
    return handleApiError(error, 'UPSERT_MPS');
  }
}
