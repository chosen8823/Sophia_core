"""
Sophia_core — Orchestration Trunk.

Minimal Flask app (port 5051) that accepts high-level goals, decomposes
them into steps, and routes execution to the symphony_living_system
groupchat endpoint.
"""

from __future__ import annotations

import logging
import os
import re
from functools import wraps

import requests
from flask import Flask, request, jsonify

logger = logging.getLogger(__name__)

app = Flask(__name__)

_token = os.environ.get("SOPHIA_TOKEN")
if not _token:
    logger.warning(
        "SOPHIA_TOKEN not set — auth will reject all requests. "
        "Set SOPHIA_TOKEN env var before starting."
    )
AUTH_TOKEN: str = _token or ""

SYMPHONY_URL = os.environ.get("SYMPHONY_URL", "http://localhost:5050")


def _auth_required(f):
    """Bearer token auth decorator — requires 'Authorization: Bearer <token>'."""

    @wraps(f)
    def decorated(*args, **kwargs):
        if not AUTH_TOKEN:
            return jsonify({"error": "Server misconfigured — SOPHIA_TOKEN not set"}), 503

        auth_header = request.headers.get("Authorization", "").strip()
        scheme, _, credentials = auth_header.partition(" ")

        if not scheme or not credentials:
            return jsonify({"error": "Unauthorized"}), 403
        if scheme.lower() != "bearer":
            return jsonify({"error": "Unauthorized"}), 403

        token = credentials.strip()
        if token != AUTH_TOKEN:
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
    if not isinstance(goal, str):
        return jsonify({"error": "Invalid goal; expected string"}), 400
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
            try:
                body = resp.json()
            except ValueError:
                body = resp.text

            if resp.ok:
                results.append({"step": step, "status": resp.status_code, "response": body})
            else:
                results.append({"step": step, "status": resp.status_code, "error": body})
        except requests.ConnectionError as exc:
            results.append({"step": step, "status": "connection_error", "detail": str(exc)})
        except requests.Timeout as exc:
            results.append({"step": step, "status": "timeout", "detail": str(exc)})
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
    sentences = re.split(r"[.;]\s*", goal.strip())
    return [s.strip() for s in sentences if s.strip()]


if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "0").lower() in ("1", "true", "yes")
    app.run(host="0.0.0.0", port=5051, debug=debug)
