import prisma from '@/lib/db';
import { MachineSchema } from '@/lib/validations/mes.schema';
import { handleApiError, apiResponse } from '@/lib/api-utils';

export async function GET() {
  try {
    const machines = await prisma.machine.findMany({
      include: { line: true },
      orderBy: { name: 'asc' }
    });
    return apiResponse(machines);
  } catch (error) {
    return handleApiError(error, 'GET_MACHINES');
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = MachineSchema.parse(body);

    const machine = await prisma.machine.create({
      data: { 
        machineCode: validatedData.machineCode, 
        name: validatedData.name, 
        lineId: validatedData.lineId, 
        stationRole: validatedData.stationRole, 
        productTypes: validatedData.productTypes 
      }
    });

    return apiResponse(machine, 201);
  } catch (error) {
    return handleApiError(error, 'CREATE_MACHINE');
  }
}
