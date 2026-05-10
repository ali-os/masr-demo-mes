/**
 * OEE CALCULATION ENGINE
 * Logic for calculating Availability, Performance, and Quality KPIs
 * based on factory operational data.
 */

export interface OEEInput {
  plannedProdTime: number; // in minutes
  plannedDownTime: number; // in minutes
  actualDownTime: number;  // in minutes
  totalCount: number;      // in pieces
  rejectCount: number;     // in pieces
  idealCycleTime: number;  // in seconds per piece
}

export interface OEEResult {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}

export function calculateOEE(input: OEEInput): OEEResult {
  const { 
    plannedProdTime, 
    plannedDownTime, 
    actualDownTime, 
    totalCount, 
    rejectCount, 
    idealCycleTime 
  } = input;

  // 1. Availability
  // (Scheduled Time - Unscheduled Downtime) / Scheduled Time
  const scheduledTime = plannedProdTime - plannedDownTime;
  const runTime = scheduledTime - actualDownTime;
  const availability = scheduledTime > 0 ? (runTime / scheduledTime) * 100 : 0;

  // 2. Performance
  // (Ideal Cycle Time * Total Pieces) / Actual Run Time
  const performance = runTime > 0 
    ? ((idealCycleTime * totalCount) / (runTime * 60)) * 100 
    : 0;

  // 3. Quality
  // (Good Pieces / Total Pieces)
  const goodCount = totalCount - rejectCount;
  const quality = totalCount > 0 ? (goodCount / totalCount) * 100 : 0;

  // 4. Global OEE
  const oee = (availability * performance * quality) / 10000;

  return {
    availability: Number(availability.toFixed(2)),
    performance: Number(performance.toFixed(2)),
    quality: Number(quality.toFixed(2)),
    oee: Number(oee.toFixed(2))
  };
}

/**
 * Example Usage:
 * calculateOEE({
 *   plannedProdTime: 480, // 8hr shift
 *   plannedDownTime: 60,  // 1hr break
 *   actualDownTime: 30,   // 30min breakdown
 *   totalCount: 10000,
 *   rejectCount: 100,
 *   idealCycleTime: 2     // 2 sec/pcs (30 bpm)
 * });
 */
