import { z } from "zod";

// --- Memory schemas ---

export const StoreMemoryInput = z.object({
  actor: z.string().min(1).describe("Who is storing the memory"),
  content: z.string().min(1).describe("Memory content to store"),
  coherence: z
    .number()
    .min(0.0)
    .max(1.0)
    .default(0.5)
    .describe("Coherence level (gradient 0.0–1.0)"),
});
export type StoreMemoryInput = z.infer<typeof StoreMemoryInput>;

export const RecallMemoryInput = z.object({
  query: z.string().min(1).describe("Keyword or phrase to search memories"),
  limit: z.number().int().min(1).max(100).default(10).describe("Max results"),
});
export type RecallMemoryInput = z.infer<typeof RecallMemoryInput>;

export const MemoryEntry = z.object({
  ts: z.string().describe("ISO8601 timestamp"),
  actor: z.string(),
  content: z.string(),
  hmac: z.string().describe("HMAC-SHA-256 signature for provenance"),
  coherence: z.number().min(0.0).max(1.0),
});
export type MemoryEntry = z.infer<typeof MemoryEntry>;

// --- Constellation schemas ---

export const ConstellationStatus = z.record(
  z.string(),
  z.number().min(0.0).max(1.0)
);
export type ConstellationStatus = z.infer<typeof ConstellationStatus>;

// --- Patch schemas ---

export const PatchInput = z.object({
  from_module: z.string().min(1).describe("Source module name"),
  from_port: z.string().min(1).describe("Output port name"),
  to_module: z.string().min(1).describe("Destination module name"),
  to_port: z.string().min(1).describe("Input port name"),
  signal_type: z
    .enum(["audio", "cv", "gate"])
    .default("cv")
    .describe("Signal type flowing through the cable"),
});
export type PatchInput = z.infer<typeof PatchInput>;

export const PatchCable = z.object({
  from: z.string().describe("module:port source"),
  to: z.string().describe("module:port destination"),
  signal_type: z.enum(["audio", "cv", "gate"]),
});
export type PatchCable = z.infer<typeof PatchCable>;

export const PatchState = z.object({
  cables: z.array(PatchCable),
  modules: z.array(
    z.object({
      name: z.string(),
      inputs: z.array(z.string()),
      outputs: z.array(z.string()),
    })
  ),
});
export type PatchState = z.infer<typeof PatchState>;

// --- Receipt schemas ---

export const EmitReceiptInput = z.object({
  actor: z.string().min(1),
  action: z.string().min(1),
  target: z.string().min(1),
  scale: z.number().min(0.0).max(1.0).describe("Gradient scale of the action"),
  result: z.string().min(1),
  evidence_link: z.string().default(""),
});
export type EmitReceiptInput = z.infer<typeof EmitReceiptInput>;

// --- Narrator schemas ---

export const NarratorStatus = z.object({
  story_so_far: z.string(),
  entropy: z.number().min(0.0).max(1.0),
  coherence: z.number().min(0.0).max(1.0),
  frame_count: z.number().int(),
  last_actor: z.string(),
});
export type NarratorStatus = z.infer<typeof NarratorStatus>;
