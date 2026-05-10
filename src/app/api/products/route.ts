import prisma from '@/lib/db';
import { ProductSchema } from '@/lib/validations/mes.schema';
import { handleApiError, apiResponse } from '@/lib/api-utils';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { skuCode: 'asc' }
    });
    return apiResponse(products);
  } catch (error) {
    return handleApiError(error, 'GET_PRODUCTS');
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate industrial data
    const validatedData = ProductSchema.parse(body);
    
    const result = await prisma.product.create({
      data: {
        skuCode: validatedData.skuCode,
        nameEn: validatedData.nameEn,
        nameAr: validatedData.nameAr,
        family: validatedData.family,
        brand: validatedData.brand,
        category: validatedData.category,
        packSizeMl: validatedData.packSizeMl,
        volumeMl: validatedData.volumeMl || validatedData.packSizeMl,
        uom: validatedData.uom,
        idealSpeed: validatedData.idealSpeed,
        targetOEE: validatedData.targetOEE,
        ingredientRatio: validatedData.ingredientRatio,
        setupTimeMins: validatedData.setupTimeMins,
        compatibleLines: validatedData.compatibleLines
      }
    });

    // Logging already handled by handleApiError if it fails, 
    // but successful creation audit is manual
    await prisma.auditLog.create({
      data: {
        userId: body.userId || 'SYSTEM',
        action: 'CREATE_PRODUCT',
        entity: 'Product',
        details: validatedData
      }
    });

    return apiResponse(result, 201);
  } catch (error) {
    return handleApiError(error, 'CREATE_PRODUCT');
  }
}
