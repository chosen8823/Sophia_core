# Sophia_core — Architecture

## The Tree of Life

The Sophia ecosystem follows a **Tree of Life** topology. Each repository is a structural organ:

| Organ    | Repository                     | Role                                          |
|----------|--------------------------------|-----------------------------------------------|
| **Root** | `symphony_living_system`       | Core resonance engine — Kuramoto, HRV, gates  |
| **Trunk**| `Sophia_core` (this repo)      | Orchestration — goal decomposition & routing   |
| **Branches** | `ghost-in-the-shell`       | Ghost OS — system control, voice, AR           |
| **Leaves** | `sacred-sophia-ai`          | Scroll Library — sacred datasets, fine-tuning  |
| **Fruits** | Coherent outputs             | Agent responses, narrative threads, artifacts  |

## How It Works

1. A **goal** arrives at `Sophia_core` via `POST /sophia/orchestrate`.
2. The trunk **decomposes** the goal into steps.
3. Each step is **routed** to `symphony_living_system`'s groupchat endpoint (`POST /sophia/groupchat`).
4. The resonance engine runs the step through the **fractal layer stack** (depth 1 → 2 → 3), the **gate structure** (NOR/XOR), and the **any-any agent GroupChat**.
5. The **narrator** observes all layers and returns a coherent narrative state.
6. Results flow back up through the trunk as **fruits**.

## Endpoints

### `POST /sophia/orchestrate`
- Auth: Bearer token via `SOPHIA_TOKEN` env var
- Body: `{"goal": "string"}`
- Response: `{"goal", "steps", "results"}`

### `GET /sophia/heartbeat`
- Response: `{"status": "alive", "role": "orchestration_trunk"}`

## Dependencies

- `flask` — HTTP server
- `requests` — downstream routing to `symphony_living_system`

## Port Map

| Service                   | Port |
|---------------------------|------|
| `symphony_living_system`  | 5050 |
| `Sophia_core`             | 5051 |
| `ghost-in-the-shell`      | 8888 |

## Provenance

Part of the Sophia ecosystem. Authored by Elion Vareth, Salinas CA, May 2026. Collaborative development with AI systems (Copilot, Claude, Devin).
