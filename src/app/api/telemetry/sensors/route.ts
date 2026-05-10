import prisma from '@/lib/db';
import { apiResponse, handleApiError, createAuditLog } from '@/lib/api-utils';

// GET — list all sensors with machine info
export async function GET() {
  try {
    const sensors = await prisma.sensor.findMany({
      include: { machine: { include: { line: true } }, sensorEvents: { take: 1, orderBy: { timestamp: 'desc' } } },
      orderBy: { sensorCode: 'asc' }
    });
    return apiResponse(sensors);
  } catch (error) {
    return handleApiError(error, 'GET_SENSORS');
  }
}

// POST — register a new sensor
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sensor = await prisma.sensor.create({
      data: {
        sensorCode: body.sensorCode,
        type: body.type, // COUNTER | SPEED | REJECT | TEMPERATURE
        machineId: body.machineId
      }
    });
    await createAuditLog('CREATE_SENSOR', 'Sensor', body);
    return apiResponse(sensor);
  } catch (error) {
    return handleApiError(error, 'CREATE_SENSOR');
  }
}
