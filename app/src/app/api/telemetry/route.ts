import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

/**
 * TELEMETRY STREAM (SSE)
 * 
 * Real-time Server-Sent Events stream that reads from the database.
 * Every 5 seconds it:
 *   1. Reads the latest sensor events per sensor (last 60s)
 *   2. Reads machine states
 *   3. Aggregates production counts per machine
 *   4. Pushes a HEARTBEAT to all connected clients
 */
export async function GET() {
  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout;

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      const send = (data: any) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (e) {
          closed = true;
          clearInterval(intervalId);
        }
      };

      send({ type: 'INIT', timestamp: new Date() });

      // Heartbeat every 5 seconds
      intervalId = setInterval(async () => {
        if (closed) { clearInterval(intervalId); return; }

        try {
          const cutoff = new Date(Date.now() - 60000); // last 60 seconds

          // Get all machines with their sensors
          const machines = await prisma.machine.findMany({
            include: {
              line: true,
              sensors: {
                include: {
                  sensorEvents: {
                    where: { timestamp: { gte: cutoff } },
                    orderBy: { timestamp: 'desc' },
                    take: 1
                  }
                }
              }
            }
          });

          // Get today's production facts per machine
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayFacts = await prisma.productionFact.groupBy({
            by: ['machineId'],
            where: { timestamp: { gte: today } },
            _sum: { count: true }
          });

          const factsMap: Record<string, number> = {};
          todayFacts.forEach(f => { factsMap[f.machineId] = f._sum.count || 0; });

          // Get latest machine state events
          const states = await prisma.machineStateEvent.findMany({
            orderBy: { startTime: 'desc' },
            distinct: ['machineId']
          });
          const stateMap: Record<string, string> = {};
          states.forEach(s => { stateMap[s.machineId] = s.state; });

          // Build telemetry payload
          const telemetry = {
            type: 'HEARTBEAT',
            timestamp: new Date(),
            machines: machines.map(m => {
              // Get the latest counter sensor reading
              const counterSensor = m.sensors.find(s => s.type === 'COUNTER');
              const speedSensor = m.sensors.find(s => s.type === 'SPEED');
              const rejectSensor = m.sensors.find(s => s.type === 'REJECT');

              const lastCount = counterSensor?.sensorEvents?.[0];
              const lastSpeed = speedSensor?.sensorEvents?.[0];
              const lastReject = rejectSensor?.sensorEvents?.[0];

              return {
                id: m.machineCode,
                name: m.name,
                line: m.line?.name || m.line?.code,
                state: stateMap[m.id] || 'IDLE',
                speed: lastSpeed ? parseFloat(lastSpeed.value) : 0,
                lastCount: lastCount ? parseInt(lastCount.value) : 0,
                todayTotal: factsMap[m.id] || 0,
                rejects: lastReject ? parseInt(lastReject.value) : 0,
                sensorCount: m.sensors.length,
                lastUpdate: lastCount?.timestamp || null
              };
            })
          };

          send(telemetry);
        } catch (err) {
          // If DB read fails, send a degraded heartbeat
          send({ type: 'HEARTBEAT', timestamp: new Date(), machines: [], error: 'DB read failed' });
        }
      }, 5000);
    },
    cancel() {
      if (intervalId) clearInterval(intervalId);
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
