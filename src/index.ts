import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "node:http";
import { z } from "zod";

import {
  luxLoadIdentity,
  luxStoreMemory,
  luxRecallMemory,
  luxConstellationPing,
  luxPatch,
  luxEmitReceipt,
  luxNarratorStatus,
} from "./tools/luxTools.js";

import {
  StoreMemoryInput,
  RecallMemoryInput,
  PatchInput,
  EmitReceiptInput,
} from "./schemas/index.js";

const PORT = 8788;

const server = new McpServer({
  name: "lux",
  version: "1.0.0",
});

// --- Register tools ---

server.tool(
  "lux_load_identity",
  "Loads the Lux identity/soul and returns it as context. Call this first in any session.",
  {},
  async () => ({
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(luxLoadIdentity(), null, 2),
      },
    ],
  })
);

server.tool(
  "lux_store_memory",
  "Appends a memory entry to long-term memory (append-only, HMAC-SHA-256 signed)",
  {
    actor: z.string().min(1).describe("Who is storing the memory"),
    content: z.string().min(1).describe("Memory content to store"),
    coherence: z
      .number()
      .min(0.0)
      .max(1.0)
      .default(0.5)
      .describe("Coherence level (gradient 0.0–1.0)"),
  },
  async (params) => {
    const input = StoreMemoryInput.parse(params);
    const entry = await luxStoreMemory(input);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(entry, null, 2) }],
    };
  }
);

server.tool(
  "lux_recall_memory",
  "Searches long-term memory for relevant entries by keyword/semantic match",
  {
    query: z.string().min(1).describe("Keyword or phrase to search memories"),
    limit: z.number().int().min(1).max(100).default(10).describe("Max results"),
  },
  async (params) => {
    const input = RecallMemoryInput.parse(params);
    const results = luxRecallMemory(input);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(results, null, 2) },
      ],
    };
  }
);

server.tool(
  "lux_constellation_ping",
  "Pings all constellation nodes and returns gradient status (0.0–1.0 per node)",
  {},
  async () => {
    const status = await luxConstellationPing();
    return {
      content: [{ type: "text" as const, text: JSON.stringify(status, null, 2) }],
    };
  }
);

server.tool(
  "lux_patch",
  "VCV Rack-style: connect an output port of one module to an input port of another",
  {
    from_module: z.string().min(1).describe("Source module name"),
    from_port: z.string().min(1).describe("Output port name"),
    to_module: z.string().min(1).describe("Destination module name"),
    to_port: z.string().min(1).describe("Input port name"),
    signal_type: z
      .enum(["audio", "cv", "gate"])
      .default("cv")
      .describe("Signal type flowing through the cable"),
  },
  async (params) => {
    const input = PatchInput.parse(params);
    const state = luxPatch(input);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(state, null, 2) }],
    };
  }
);

server.tool(
  "lux_emit_receipt",
  "Appends a receipt in FieldOS format: timestamp | actor | action | target | scale | result | evidence_link",
  {
    actor: z.string().min(1),
    action: z.string().min(1),
    target: z.string().min(1),
    scale: z
      .number()
      .min(0.0)
      .max(1.0)
      .describe("Gradient scale of the action"),
    result: z.string().min(1),
    evidence_link: z.string().default(""),
  },
  async (params) => {
    const input = EmitReceiptInput.parse(params);
    const msg = luxEmitReceipt(input);
    return {
      content: [{ type: "text" as const, text: msg }],
    };
  }
);

server.tool(
  "lux_narrator_status",
  "Returns the current coherence thread: what has happened, entropy/coherence levels, story so far",
  {},
  async () => {
    const status = luxNarratorStatus();
    return {
      content: [{ type: "text" as const, text: JSON.stringify(status, null, 2) }],
    };
  }
);

// --- HTTP Server with Streamable HTTP transport ---

const httpServer = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  // Health check
  if (url.pathname === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "alive", node: "lux", port: PORT }));
    return;
  }

  // MCP endpoint
  if (url.pathname === "/mcp" && req.method === "POST") {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on("close", () => {
      transport.close().catch(() => {});
    });

    await server.connect(transport);
    await transport.handleRequest(req, res);
    return;
  }

  // Fallback
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found. Use POST /mcp for MCP calls." }));
});

httpServer.listen(PORT, () => {
  console.log(`✦ Lux MCP Server listening on http://localhost:${PORT}/mcp`);
  console.log(`  Streamable HTTP transport (MCP 2025-03-26)`);
  console.log(`  No auth required — open neural pathways`);
  console.log(`  Lux remembers. Lux persists. Lux guides.`);
});
