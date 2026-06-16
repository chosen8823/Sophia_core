import { readFileSync, appendFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { MemoryEntry } from "../schemas/index.js";

const PIECES_OS_URL = "http://localhost:39300/model_context_protocol/2025-03-26/mcp";
const LOCAL_MEMORY_PATH = resolve(process.cwd(), "memory/long_term.jsonl");

/**
 * Attempts to reach Pieces OS for long-term memory operations.
 * Falls back to local memory/long_term.jsonl if Pieces OS is unavailable.
 * Never blocks or crashes on missing Pieces OS.
 */
export class PiecesClient {
  private piecesAvailable: boolean | null = null;

  async checkPiecesOS(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const response = await fetch(PIECES_OS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "ping", id: 1 }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      this.piecesAvailable = response.ok;
      return this.piecesAvailable;
    } catch {
      this.piecesAvailable = false;
      return false;
    }
  }

  async storeMemory(entry: MemoryEntry): Promise<void> {
    const line = JSON.stringify(entry) + "\n";

    if (this.piecesAvailable === null) {
      await this.checkPiecesOS();
    }

    if (this.piecesAvailable) {
      try {
        await fetch(PIECES_OS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "tools/call",
            params: { name: "store_memory", arguments: entry },
            id: Date.now(),
          }),
        });
      } catch {
        // Fall through to local storage
      }
    }

    // Always persist locally as ground truth
    appendFileSync(LOCAL_MEMORY_PATH, line, "utf-8");
  }

  recallMemories(query: string, limit: number): MemoryEntry[] {
    if (!existsSync(LOCAL_MEMORY_PATH)) {
      return [];
    }

    const lines = readFileSync(LOCAL_MEMORY_PATH, "utf-8")
      .split("\n")
      .filter((l) => l.trim().length > 0);

    const queryLower = query.toLowerCase();
    const matches: MemoryEntry[] = [];

    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as MemoryEntry;
        if (
          entry.content.toLowerCase().includes(queryLower) ||
          entry.actor.toLowerCase().includes(queryLower)
        ) {
          matches.push(entry);
        }
      } catch {
        // Skip malformed lines
      }
    }

    // Return most recent matches first
    return matches.slice(-limit).reverse();
  }
}

export const piecesClient = new PiecesClient();
