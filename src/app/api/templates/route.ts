import prisma from '@/lib/db';
import { apiResponse, handleApiError } from '@/lib/api-utils';
import { z } from 'zod';

const TemplateSchema = z.object({
  name: z.string().min(2),
  category: z.string().optional(),
  description: z.string().optional(),
  idealSpeed: z.number().int().min(1),
  targetOEE: z.number().min(1).max(100),
  ingredientRatio: z.number().min(0),
  setupTimeMins: z.number().int().min(0),
  bomItems: z.array(z.object({
    name: z.string(),
    category: z.string(),
    qtyPerUnit: z.number().min(0),
    unit: z.string()
  })).optional()
});

export async function GET() {
  try {
    const templates = await prisma.productTemplate.findMany({
      include: { templateBoms: true },
      orderBy: { name: 'asc' }
    });
    return apiResponse(templates);
  } catch (error) {
    return handleApiError(error, 'GET_TEMPLATES');
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = TemplateSchema.parse(body);

    const template = await prisma.productTemplate.create({
      data: {
        name: data.name,
        category: data.category,
        description: data.description,
        idealSpeed: data.idealSpeed,
        targetOEE: data.targetOEE,
        ingredientRatio: data.ingredientRatio,
        setupTimeMins: data.setupTimeMins,
        templateBoms: {
          create: data.bomItems || []
        }
      },
      include: { templateBoms: true }
    });

    return apiResponse(template);
  } catch (error) {
    return handleApiError(error, 'CREATE_TEMPLATE');
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...rest } = body;
    const data = TemplateSchema.parse(rest);

    // Update template and recreate BOM items for simplicity
    const template = await prisma.productTemplate.update({
      where: { id },
      data: {
        name: data.name,
        category: data.category,
        description: data.description,
        idealSpeed: data.idealSpeed,
        targetOEE: data.targetOEE,
        ingredientRatio: data.ingredientRatio,
        setupTimeMins: data.setupTimeMins,
        templateBoms: {
          deleteMany: {},
          create: data.bomItems || []
        }
      },
      include: { templateBoms: true }
    });

    return apiResponse(template);
  } catch (error) {
    return handleApiError(error, 'UPDATE_TEMPLATE');
  }
}
