import { z } from 'zod';

export const ProductSchema = z.object({
  skuCode: z.string().min(4, "SKU code must be at least 4 chars"),
  nameEn: z.string().min(3, "Name required"),
  nameAr: z.string().optional(),
  brand: z.string().optional(),
  family: z.string().optional(),
  category: z.string().optional(),
  volumeMl: z.number().optional(),
  packSizeMl: z.number().optional(),
  uom: z.string().default('pcs'),
  ingredientRatio: z.number().min(0),
  idealSpeed: z.number().int().min(1).default(60),
  targetOEE: z.number().min(0).max(100).default(85),
  setupTimeMins: z.number().int().min(0).default(30),
  compatibleLines: z.array(z.string()).optional(),
});

export const MonthlyPlanSchema = z.object({
  year: z.number().int().min(2025),
  month: z.number().int().min(1).max(12),
  productId: z.string().uuid(),
  lineId: z.string().uuid().optional(),
  machineName: z.string().optional(),
  targetQty: z.number().int().min(0),
  bulkKg: z.number().min(0).optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
});

export const DailyEntrySchema = z.object({
  monthlyPlanId: z.string().uuid(),
  productId: z.string().uuid(),
  lineId: z.string().uuid().optional(),
  date: z.string().or(z.date()), // accepts ISO string or Date object
  shift: z.number().int().min(1).max(2),
  actualQty: z.number().int().min(0),
  bulkUsedKg: z.number().min(0).default(0),
  headcount: z.number().int().min(0).default(0),
  wipQty: z.number().int().min(0).default(0),
  reworkQty: z.number().int().min(0).default(0),
  notes: z.string().optional(),
});

export const OEERecordSchema = z.object({
  machineId: z.string().uuid(),
  date: z.string().or(z.date()),
  shift: z.number().int().min(1).max(2),
  plannedTimeMins: z.number().min(0).default(480),
  adjustMins: z.number().min(0).default(0),
  mechFailMins: z.number().min(0).default(0),
  minorStopMins: z.number().min(0).default(0),
  changeoverMins: z.number().min(0).default(0),
  qualityLossMins: z.number().min(0).default(0),
  utilityMins: z.number().min(0).default(0),
  waitMins: z.number().min(0).default(0),
  manageMins: z.number().min(0).default(0),
  outputQty: z.number().int().min(0).default(0),
  rejectQty: z.number().int().min(0).default(0),
  productId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const MachineSchema = z.object({
  machineCode: z.string().min(2),
  name: z.string().min(2),
  lineId: z.string().uuid(),
  stationRole: z.string().optional(),
  productTypes: z.array(z.string()).optional(),
});

export const BomItemSchema = z.object({
  productId: z.string().uuid(),
  itemCode: z.string().optional(),
  name: z.string().min(2),
  category: z.string(),
  qtyPerUnit: z.number().min(0).default(1),
  unit: z.string().default('pcs'),
  notes: z.string().optional(),
});
