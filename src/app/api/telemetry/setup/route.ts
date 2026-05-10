import prisma from '@/lib/db';
import { apiResponse, handleApiError, createAuditLog } from '@/lib/api-utils';

/**
 * FACTORY SEED — Sets up the production floor structure
 * 
 * POST /api/telemetry/setup
 * 
 * Creates:
 *   - 3 Production Lines (F1 High Speed, F2 Medium, F3 Specialty)
 *   - 4 Machines per line (Filler, Capper, Labeler, Packer)
 *   - 3 Sensors per machine (Counter, Speed, Reject)
 * 
 * This is idempotent — safe to call multiple times.
 */
export async function POST() {
  try {
    const lines = [
      { code: 'F1', name: 'Line 1 – High Speed' },
      { code: 'F2', name: 'Line 2 – Medium' },
      { code: 'F3', name: 'Line 3 – Specialty' },
    ];

    const stationRoles = [
      { suffix: 'FIL', name: 'Filler', role: 'FILLER', types: ['Liquid', 'Cream'] },
      { suffix: 'CAP', name: 'Capper', role: 'CAPPER', types: ['Liquid', 'Cream'] },
      { suffix: 'LBL', name: 'Labeler', role: 'LABELER', types: ['Liquid', 'Cream'] },
      { suffix: 'PKR', name: 'Packer', role: 'PACKER', types: ['Liquid', 'Cream'] },
    ];

    const sensorTypes = ['COUNTER', 'SPEED', 'REJECT'];

    let linesCreated = 0;
    let machinesCreated = 0;
    let sensorsCreated = 0;

    for (const lineData of lines) {
      // Upsert line
      const line = await prisma.line.upsert({
        where: { code: lineData.code },
        create: lineData,
        update: { name: lineData.name }
      });
      linesCreated++;

      // Create machines for this line
      for (const station of stationRoles) {
        const machineCode = `MC-${lineData.code}-${station.suffix}`;
        const machine = await prisma.machine.upsert({
          where: { machineCode },
          create: {
            machineCode,
            name: `${lineData.name} ${station.name}`,
            lineId: line.id,
            stationRole: station.role,
            productTypes: station.types
          },
          update: { name: `${lineData.name} ${station.name}`, stationRole: station.role }
        });
        machinesCreated++;

        // Create sensors for this machine
        for (const sType of sensorTypes) {
          const sensorCode = `SNS-${lineData.code}-${station.suffix}-${sType.substring(0, 3)}`;
          await prisma.sensor.upsert({
            where: { sensorCode },
            create: { sensorCode, type: sType, machineId: machine.id },
            update: {}
          });
          sensorsCreated++;
        }
      }
    }

    await createAuditLog('FACTORY_SETUP', 'Setup', { linesCreated, machinesCreated, sensorsCreated });

    return apiResponse({
      message: 'Factory floor setup complete!',
      lines: linesCreated,
      machines: machinesCreated,
      sensors: sensorsCreated
    });
  } catch (error) {
    return handleApiError(error, 'FACTORY_SETUP');
  }
}

export async function GET() {
  try {
    const lines = await prisma.line.count();
    const machines = await prisma.machine.count();
    const sensors = await prisma.sensor.count();
    return apiResponse({ lines, machines, sensors, ready: machines > 0 && sensors > 0 });
  } catch (error) {
    return handleApiError(error, 'FACTORY_STATUS');
  }
}
