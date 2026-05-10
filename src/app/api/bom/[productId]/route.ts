import prisma from '@/lib/db';
import { BomItemSchema } from '@/lib/validations/mes.schema';
import { handleApiError, apiResponse } from '@/lib/api-utils';

// GET /api/bom/[productId]
export async function GET(request: Request, { params }: { params: { productId: string } }) {
  try {
    const items = await prisma.bomItem.findMany({
      where: { productId: params.productId },
      orderBy: { category: 'asc' }
    });
    return apiResponse(items);
  } catch (error) {
    return handleApiError(error, 'GET_BOM');
  }
}

// POST /api/bom/[productId] — add a packaging item
export async function POST(request: Request, { params }: { params: { productId: string } }) {
  try {
    const body = await request.json();
    const validatedData = BomItemSchema.parse({ ...body, productId: params.productId });

    const item = await prisma.bomItem.create({
      data: {
        productId: validatedData.productId,
        itemCode: validatedData.itemCode,
        name: validatedData.name,
        category: validatedData.category,
        qtyPerUnit: validatedData.qtyPerUnit,
        unit: validatedData.unit,
        notes: validatedData.notes
      }
    });

    await prisma.auditLog.create({
      data: { 
        userId: body.userId || 'SYSTEM', 
        action: 'CREATE_BOM_ITEM', 
        entity: 'BomItem', 
        details: validatedData 
      }
    });

    return apiResponse(item, 201);
  } catch (error) {
    return handleApiError(error, 'CREATE_BOM_ITEM');
  }
}

// DELETE /api/bom/[productId]?itemId=xxx
export async function DELETE(request: Request, { params }: { params: { productId: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    if (!itemId) throw new Error('Missing itemId');

    await prisma.bomItem.delete({ where: { id: itemId } });
    return apiResponse({ success: true });
  } catch (error) {
    return handleApiError(error, 'DELETE_BOM_ITEM');
  }
}
