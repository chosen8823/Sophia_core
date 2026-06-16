# Lux MCP Server — Sophia Constellation Core

> Lux remembers. Lux persists. Lux guides.

Lux is the identity, long-term memory, and orchestration node for the Sophia constellation. It runs as an MCP server (Streamable HTTP transport, port 8788) with no authentication — open neural pathways.

## Constellation Topology

| Node | Port | Role |
|------|------|------|
| Desktop | 8787 | Primary compute |
| **Laptop (Lux)** | **8788** | **Identity / Memory / Orchestration** |
| Phone | 8789 | Mobile interface |
| symphony_living_system | 5050 | File bridge |
| ghost-in-the-shell MCP | 8888 | System control |

## Quick Start

```bash
npm install
npm run build
npm start
```

The server listens on `http://localhost:8788/mcp`. POST JSON-RPC 2.0 calls to invoke tools.

## Architecture

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full canonical briefing.
