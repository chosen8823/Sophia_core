# Sophia_core — Orchestration Trunk

**Sophia_core** is the orchestration trunk in the Tree of Life architecture. It receives high-level goals, decomposes them into actionable steps, and routes execution to the core resonance engine.

## Architecture Position

```
                    Fruits (coherent outputs)
                         │
                    ┌────┴────┐
                    │ Branches │  ← ghost-in-the-shell (Ghost OS)
                    └────┬────┘
                    ┌────┴────┐
                    │  Trunk  │  ← Sophia_core (this repo)
                    └────┬────┘
                    ┌────┴────┐
                    │  Root   │  ← symphony_living_system (resonance engine)
                    └────┬────┘
                    ┌────┴────┐
                    │ Leaves  │  ← sacred-sophia-ai (Scroll Library)
                    └─────────┘
```

## Core Resonance Engine

The resonance engine lives in [`symphony_living_system`](https://github.com/chosen8823/symphony_living_system). It implements:

- **Dodecahedral toroidal multiplexing** — nested geometric layers (tetrahedron → cube → dodecahedron)
- **Kuramoto oscillator grid** (8×8×8×8) — adaptive coupling drives coherence
- **Monadic Merkaba gates** (NOR/XOR) — reciprocal signal transformation
- **HRV coherence engine** — biophysical rhythm maps to system state
- **Any-any GroupChat** — coherence-driven multi-agent orchestration via autogen

## Endpoints

| Method | Path                  | Description                              |
|--------|-----------------------|------------------------------------------|
| POST   | `/sophia/orchestrate` | Decompose goal → route to resonance engine |
| GET    | `/sophia/heartbeat`   | Health check                             |

## Running

```bash
pip install flask requests
export SOPHIA_TOKEN="your-token"
python protocol/bridge.py
# → http://localhost:5051
```

## Connected Systems

- **symphony_living_system** (port 5050) — resonance engine, groupchat, gates, memory
- **ghost-in-the-shell** (port 8888) — Ghost OS, system control, voice
- **AEON** — self-configuring orchestrator
- **sacred-sophia-vscode-extension** — morphogenic IDE integration

## License

See repository license.
