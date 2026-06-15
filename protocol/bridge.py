"""
Sophia_core — Orchestration Trunk.

Minimal Flask app (port 5051) that accepts high-level goals, decomposes
them into steps, and routes execution to the symphony_living_system
groupchat endpoint.
"""

from __future__ import annotations

import logging
import os

import requests
from flask import Flask, request, jsonify

logger = logging.getLogger(__name__)

app = Flask(__name__)
AUTH_TOKEN = os.environ.get("SOPHIA_TOKEN", "divine-default")

SYMPHONY_URL = os.environ.get("SYMPHONY_URL", "http://localhost:5050")


def _auth_required(f):
    """Bearer token auth decorator."""
    from functools import wraps

    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization", "")
        if token != f"Bearer {AUTH_TOKEN}" and token != AUTH_TOKEN:
            return jsonify({"error": "Unauthorized"}), 403
        return f(*args, **kwargs)

    return decorated


@app.route("/sophia/heartbeat")
def heartbeat():
    return jsonify({"status": "alive", "role": "orchestration_trunk"})


@app.route("/sophia/orchestrate", methods=["POST"])
@_auth_required
def orchestrate():
    """Decompose a goal into steps and route to the resonance engine.

    Body: {"goal": str}
    """
    data = request.json or {}
    goal = data.get("goal", "")
    if not goal:
        return jsonify({"error": "Missing goal"}), 400

    steps = _decompose(goal)

    results = []
    for step in steps:
        try:
            resp = requests.post(
                f"{SYMPHONY_URL}/sophia/groupchat",
                json={"message": step, "layer_depth": 1},
                timeout=30,
            )
            results.append({
                "step": step,
                "status": resp.status_code,
                "response": resp.json() if resp.ok else resp.text,
            })
        except Exception as exc:
            results.append({"step": step, "status": "error", "detail": str(exc)})

    return jsonify({
        "goal": goal,
        "steps": steps,
        "results": results,
    })


def _decompose(goal: str) -> list[str]:
    """Naive goal decomposition — split on sentence boundaries.

    A real implementation would use an LLM or planner here.
    """
    import re

    sentences = re.split(r"[.;]\s*", goal.strip())
    return [s.strip() for s in sentences if s.strip()]


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5051, debug=True)
