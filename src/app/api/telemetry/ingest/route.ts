import prisma from '@/lib/db';
import { apiResponse, handleApiError } from '@/lib/api-utils';

/**
 * SENSOR EVENT INGEST API
 * 
 * This is the endpoint that sensors (or the simulator) POST to.
 * Each event represents a count increment from a photoelectric sensor
 * at a specific station on the production line.
 * 
 * Payload:
 *   { sensorCode: "SNS-F1-CTR-01", value: "5", sourceTag: "PLC" | "SIMULATOR" }
 * 
 * Or batch:
 *   { events: [{ sensorCode, value, sourceTag, timestamp? }, ...] }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Support single event or batch
    const events = body.events || [body];
    const results = [];

    for (const evt of events) {
      // Find the sensor
      const sensor = await prisma.sensor.findUnique({
        where: { sensorCode: evt.sensorCode },
        include: { machine: true }
      });
      if (!sensor) {
        results.push({ sensorCode: evt.sensorCode, error: 'Sensor not found' });
        continue;
      }

      // Store the sensor event
      const event = await prisma.sensorEvent.create({
        data: {
          sensorId: sensor.id,
          value: String(evt.value),
          sourceTag: evt.sourceTag || 'SIMULATOR',
          timestamp: evt.timestamp ? new Date(evt.timestamp) : new Date()
        }
      });

      // If this is a COUNTER type sensor, also create a ProductionFact
      if (sensor.type === 'COUNTER' && parseInt(evt.value) > 0) {
        // Find the latest open work order for this machine
        const latestWO = await prisma.workOrder.findFirst({
          where: { status: 'OPEN' },
          orderBy: { id: 'desc' }
        });

        if (latestWO) {
          await prisma.productionFact.create({
            data: {
              workOrderId: latestWO.id,
              machineId: sensor.machineId,
              count: parseInt(evt.value),
              sourceTag: evt.sourceTag || 'SIMULATOR',
              timestamp: evt.timestamp ? new Date(evt.timestamp) : new Date()
            }
          });
        }
      }

      results.push({ sensorCode: evt.sensorCode, eventId: event.id, status: 'OK' });
    }

    return apiResponse({ ingested: results.filter(r => !r.error).length, errors: results.filter(r => r.error).length, results });
  } catch (error) {
    return handleApiError(error, 'INGEST_SENSOR_EVENT');
  }
}

// GET — recent sensor events (for debugging / timeline)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sensorCode = searchParams.get('sensorCode');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (sensorCode) {
      const sensor = await prisma.sensor.findUnique({ where: { sensorCode } });
      if (sensor) where.sensorId = sensor.id;
    }

    const events = await prisma.sensorEvent.findMany({
      where,
      include: { sensor: { include: { machine: true } } },
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    return apiResponse(events);
  } catch (error) {
    return handleApiError(error, 'GET_SENSOR_EVENTS');
  }
}
