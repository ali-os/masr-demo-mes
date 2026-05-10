import prisma from '@/lib/db';
import { apiResponse, handleApiError, createAuditLog } from '@/lib/api-utils';

/**
 * PRODUCTION LINE SIMULATOR
 * 
 * POST /api/telemetry/simulator
 *   { action: "start" | "stop" | "status" }
 * 
 * When started, it creates sensor events in the database every few seconds,
 * simulating a real production line with:
 *   - Counter sensors at each station (Filler, Capper, Labeler, Packer)
 *   - Speed sensors (BPM)
 *   - Occasional reject events
 *   - Machine state changes (RUNNING, IDLE, STOPPED)
 * 
 * The simulator runs as a background interval in the server process.
 */

// In-memory simulator state (per server instance)
let simulatorInterval: NodeJS.Timeout | null = null;
let simulatorRunning = false;
let simulatorStats = { ticks: 0, eventsGenerated: 0, startedAt: null as Date | null };

async function simulateTick() {
  try {
    // Get all sensors grouped by machine
    const sensors = await prisma.sensor.findMany({
      include: { machine: { include: { line: true } } }
    });

    if (sensors.length === 0) return;

    // Group by machine
    const byMachine: Record<string, typeof sensors> = {};
    sensors.forEach(s => {
      if (!byMachine[s.machineId]) byMachine[s.machineId] = [];
      byMachine[s.machineId].push(s);
    });

    const now = new Date();
    const events: any[] = [];

    for (const [machineId, machineSensors] of Object.entries(byMachine)) {
      // Simulate realistic production behavior
      const isRunning = Math.random() > 0.1; // 90% uptime
      const baseSpeed = 80 + Math.random() * 60; // 80-140 BPM
      const countPerTick = isRunning ? Math.floor(baseSpeed / 12) : 0; // ~5s tick = speed/12
      const rejectChance = Math.random();

      for (const sensor of machineSensors) {
        let value = '0';

        switch (sensor.type) {
          case 'COUNTER':
            value = String(countPerTick);
            break;
          case 'SPEED':
            value = isRunning ? String(Math.round(baseSpeed * 10) / 10) : '0';
            break;
          case 'REJECT':
            // 5% chance of rejects, 1-3 pieces
            value = rejectChance < 0.05 ? String(Math.ceil(Math.random() * 3)) : '0';
            break;
          case 'TEMPERATURE':
            value = String(Math.round((22 + Math.random() * 8) * 10) / 10);
            break;
          default:
            value = String(countPerTick);
        }

        events.push({
          sensorId: sensor.id,
          value,
          sourceTag: 'SIMULATOR',
          timestamp: now
        });

        // Create Production data in the new industrial model
        if (sensor.type === 'COUNTER' && parseInt(value) > 0) {
          const nowObj = new Date();
          const currentYear = nowObj.getFullYear();
          const currentMonth = nowObj.getMonth() + 1;
          const dateStr = nowObj.toISOString().split('T')[0];
          
          // Determine Shift (Shift 1: 06:00-14:00, Shift 2: 14:00-22:00, else 1)
          const hour = nowObj.getHours();
          const shift = (hour >= 6 && hour < 14) ? 1 : (hour >= 14 && hour < 22) ? 2 : 1;

          // Find if this machine has an active plan for this month
          // Note: machine.name usually matches plan.machineName
          const plan = await prisma.monthlyPlan.findFirst({
            where: { 
              year: currentYear, 
              month: currentMonth,
              OR: [
                { machineName: sensor.machine.name },
                { machineName: sensor.machine.machineCode }
              ]
            }
          });

          if (plan) {
            // Upsert DailyEntry for this plan/date/shift
            await prisma.dailyEntry.upsert({
              where: {
                monthlyPlanId_date_shift: {
                  monthlyPlanId: plan.id,
                  date: new Date(dateStr),
                  shift: shift
                }
              },
              create: {
                monthlyPlanId: plan.id,
                productId: plan.productId,
                date: new Date(dateStr),
                shift: shift,
                actualQty: parseInt(value)
              },
              update: {
                actualQty: { increment: parseInt(value) }
              }
            });
          }
        }
      }

      // Update machine state
      const state = isRunning ? 'RUNNING' : (Math.random() > 0.5 ? 'IDLE' : 'STOPPED');
      await prisma.machineStateEvent.create({
        data: {
          machineId,
          state,
          sourceTag: 'SIMULATOR',
          startTime: now
        }
      });
    }

    // Batch insert sensor events
    if (events.length > 0) {
      await prisma.sensorEvent.createMany({ data: events });
      simulatorStats.eventsGenerated += events.length;
    }

    simulatorStats.ticks++;
  } catch (err) {
    console.error('[SIMULATOR] Tick error:', err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === 'start') {
      if (simulatorRunning) {
        return apiResponse({ status: 'ALREADY_RUNNING', stats: simulatorStats });
      }

      // Ensure sensors exist — auto-register if not
      const sensorCount = await prisma.sensor.count();
      if (sensorCount === 0) {
        // Auto-create sensors for existing machines
        const machines = await prisma.machine.findMany();
        for (const m of machines) {
          const stations = ['COUNTER', 'SPEED', 'REJECT'];
          for (const type of stations) {
            const code = `SNS-${m.machineCode}-${type}`;
            await prisma.sensor.upsert({
              where: { sensorCode: code },
              create: { sensorCode: code, type, machineId: m.id },
              update: {}
            });
          }
        }
      }

      simulatorRunning = true;
      simulatorStats = { ticks: 0, eventsGenerated: 0, startedAt: new Date() };
      simulatorInterval = setInterval(simulateTick, 5000); // every 5 seconds

      // Run first tick immediately
      await simulateTick();

      await createAuditLog('SIMULATOR_START', 'Telemetry', { machines: await prisma.machine.count() });

      return apiResponse({ status: 'STARTED', message: 'Simulator running — generating sensor events every 5s' });
    }

    if (action === 'stop') {
      if (simulatorInterval) clearInterval(simulatorInterval);
      simulatorInterval = null;
      simulatorRunning = false;

      await createAuditLog('SIMULATOR_STOP', 'Telemetry', simulatorStats);

      return apiResponse({ status: 'STOPPED', stats: simulatorStats });
    }

    if (action === 'status') {
      return apiResponse({
        running: simulatorRunning,
        stats: simulatorStats,
        sensors: await prisma.sensor.count(),
        recentEvents: await prisma.sensorEvent.count({
          where: { timestamp: { gte: new Date(Date.now() - 60000) } }
        })
      });
    }

    return apiResponse({ error: 'Unknown action. Use: start, stop, status' }, 400);
  } catch (error) {
    return handleApiError(error, 'SIMULATOR');
  }
}

export async function GET() {
  try {
    return apiResponse({
      running: simulatorRunning,
      stats: simulatorStats,
      sensors: await prisma.sensor.count(),
      machines: await prisma.machine.count()
    });
  } catch (error) {
    return handleApiError(error, 'SIMULATOR_STATUS');
  }
}
