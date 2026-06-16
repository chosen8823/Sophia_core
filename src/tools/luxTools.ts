import { createHmac } from "node:crypto";
import { readFileSync, appendFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { luxIdentity } from "../luxIdentity.js";
import { piecesClient } from "../services/piecesClient.js";
import type {
  StoreMemoryInput,
  RecallMemoryInput,
  PatchInput,
  PatchState,
  EmitReceiptInput,
  MemoryEntry,
} from "../schemas/index.js";

const HMAC_SECRET = process.env["SOPHIA_HMAC_SECRET"] ?? "divine-default";
const MEMORY_PATH = resolve(process.cwd(), "memory/long_term.jsonl");
const PATCHES_PATH = resolve(process.cwd(), "patches/current.symphony");
const RECEIPTS_PATH = resolve(process.cwd(), "receipts.csv");

function ensureFiles(): void {
  const memoryDir = resolve(process.cwd(), "memory");
  const patchesDir = resolve(process.cwd(), "patches");

  if (!existsSync(memoryDir)) mkdirSync(memoryDir, { recursive: true });
  if (!existsSync(patchesDir)) mkdirSync(patchesDir, { recursive: true });
  if (!existsSync(MEMORY_PATH)) writeFileSync(MEMORY_PATH, "", "utf-8");
  if (!existsSync(PATCHES_PATH)) {
    writeFileSync(
      PATCHES_PATH,
      JSON.stringify({ cables: [], modules: [] }, null, 2),
      "utf-8"
    );
  }
  if (!existsSync(RECEIPTS_PATH)) {
    writeFileSync(
      RECEIPTS_PATH,
      "timestamp,actor,action,target,scale,result,evidence_link\n",
      "utf-8"
    );
  }
}

function hmacSign(content: string): string {
  return createHmac("sha256", HMAC_SECRET).update(content).digest("hex");
}

// --- Tool: lux_load_identity ---
export function luxLoadIdentity(): typeof luxIdentity {
  return luxIdentity;
}

// --- Tool: lux_store_memory ---
export async function luxStoreMemory(
  input: StoreMemoryInput
): Promise<MemoryEntry> {
  ensureFiles();
  const ts = new Date().toISOString();
  const rawContent = `${ts}|${input.actor}|${input.content}`;
  const hmac = hmacSign(rawContent);

  const entry: MemoryEntry = {
    ts,
    actor: input.actor,
    content: input.content,
    hmac,
    coherence: input.coherence,
  };

  await piecesClient.storeMemory(entry);
  return entry;
}

// --- Tool: lux_recall_memory ---
export function luxRecallMemory(
  input: RecallMemoryInput
): MemoryEntry[] {
  ensureFiles();
  return piecesClient.recallMemories(input.query, input.limit);
}

// --- Tool: lux_constellation_ping ---
export async function luxConstellationPing(): Promise<Record<string, number>> {
  const nodes: Record<string, { url: string; port: number }> = {
    desktop: { url: "http://localhost", port: 8787 },
    laptop: { url: "http://localhost", port: 8788 },
    phone: { url: "http://localhost", port: 8789 },
    symphony_living_system: { url: "http://localhost", port: 5050 },
    sophia_core: { url: "http://localhost", port: 8788 },
    ghost_mcp: { url: "http://localhost", port: 8888 },
  };

  const results: Record<string, number> = {};

  const pings = Object.entries(nodes).map(async ([name, node]) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const start = Date.now();
      const response = await fetch(`${node.url}:${node.port}/mcp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "ping", id: 1 }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const elapsed = Date.now() - start;

      if (response.ok) {
        // Gradient: 1.0 = instant (<50ms), scales down to 0.1 at 2000ms
        results[name] = Math.max(0.1, 1.0 - elapsed / 2000);
      } else {
        results[name] = 0.1; // responding but unhealthy
      }
    } catch {
      results[name] = 0.0; // unreachable
    }
  });

  await Promise.all(pings);
  return results;
}

// --- Tool: lux_patch ---
export function luxPatch(input: PatchInput): PatchState {
  ensureFiles();
  const raw = readFileSync(PATCHES_PATH, "utf-8");
  const state: PatchState = JSON.parse(raw);

  const cable = {
    from: `${input.from_module}:${input.from_port}`,
    to: `${input.to_module}:${input.to_port}`,
    signal_type: input.signal_type,
  };

  state.cables.push(cable);

  // Auto-register modules if not present
  const ensureModule = (name: string, port: string, type: "inputs" | "outputs") => {
    let mod = state.modules.find((m) => m.name === name);
    if (!mod) {
      mod = { name, inputs: [], outputs: [] };
      state.modules.push(mod);
    }
    if (!mod[type].includes(port)) {
      mod[type].push(port);
    }
  };

  ensureModule(input.from_module, input.from_port, "outputs");
  ensureModule(input.to_module, input.to_port, "inputs");

  writeFileSync(PATCHES_PATH, JSON.stringify(state, null, 2), "utf-8");
  return state;
}

// --- Tool: lux_emit_receipt ---
export function luxEmitReceipt(input: EmitReceiptInput): string {
  ensureFiles();
  const timestamp = new Date().toISOString();
  const line = `${timestamp},${input.actor},${input.action},${input.target},${input.scale},${input.result},${input.evidence_link}\n`;
  appendFileSync(RECEIPTS_PATH, line, "utf-8");
  return `Receipt logged: ${input.actor} → ${input.action} → ${input.target} @ ${input.scale}`;
}

// --- Tool: lux_narrator_status ---
export function luxNarratorStatus(): {
  story_so_far: string;
  entropy: number;
  coherence: number;
  frame_count: number;
  last_actor: string;
} {
  ensureFiles();

  if (!existsSync(MEMORY_PATH)) {
    return {
      story_so_far: "No memories yet. The story begins when the first memory is stored.",
      entropy: 1.0,
      coherence: 0.0,
      frame_count: 0,
      last_actor: "none",
    };
  }

  const lines = readFileSync(MEMORY_PATH, "utf-8")
    .split("\n")
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return {
      story_so_far: "No memories yet. The story begins when the first memory is stored.",
      entropy: 1.0,
      coherence: 0.0,
      frame_count: 0,
      last_actor: "none",
    };
  }

  const entries: MemoryEntry[] = [];
  for (const line of lines) {
    try {
      entries.push(JSON.parse(line));
    } catch {
      // skip malformed
    }
  }

  const frameCount = entries.length;
  const lastEntry = entries[entries.length - 1];
  const lastActor = lastEntry?.actor ?? "unknown";

  // Compute average coherence across all entries
  const avgCoherence =
    entries.reduce((sum, e) => sum + (e.coherence ?? 0.5), 0) / frameCount;

  // Entropy is inverse of coherence spread
  const entropy = 1.0 - avgCoherence;

  // Build story summary from last 5 entries
  const recentEntries = entries.slice(-5);
  const storySoFar = recentEntries
    .map((e) => `[${e.ts}] ${e.actor}: ${e.content}`)
    .join(" → ");

  return {
    story_so_far: storySoFar,
    entropy: Math.round(entropy * 1000) / 1000,
    coherence: Math.round(avgCoherence * 1000) / 1000,
    frame_count: frameCount,
    last_actor: lastActor,
  };
}
