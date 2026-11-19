# Chief AI — Council of Four STEM CLI

Standalone developer CLI for the Council of Four neural cross-auditing ensemble.

## Seats & Model Families
1. **DeepSeek (7B):** Forensic Logic, Algorithms, Code Architecture & Systems.
2. **Qwen (7B):** Mathematics, Quantitative Reasoning, Calculations & Science.
3. **Mistral (7B):** Structure, Schema Validation & Frontend UI/UX Design.
4. **Llama (8B):** Chief Arbiter, STEM Synthesis & Balance.

## Architecture & Workflow
- **Architecture:** Option B — 4 isolated serverless micro-endpoints on Modal GPU (`Tesla T4`, $0 when idle).
- **Deliberation:** Workflow 1 — Parallel Blind Ballot with consensus agreement confidence scoring (0–100%).

## Installation
The binary is installed globally on the system:
```bash
# Verify installation
which chief
# -> /usr/local/bin/chief
```

## Commands
```bash
# Run a full Council of Four parallel deliberation
chief "Design a distributed rate limiter in Redis with sliding windows"

# Shorthand or explicit ask
chief ask "Derive the Black-Scholes PDE boundary conditions"

# Query a specific specialist directly
chief ask "Design a dark mode Bento Grid with Tailwind CSS" --seat mistral
chief ask "Audit the time complexity of quickselect vs heapsort" --seat deepseek
chief ask "Calculate Sloan accruals ratio from balance sheet line items" --seat qwen

# Inspect Council roster and model families
chief council

# Check health and response latency
chief status

# Output raw JSON for script piping
chief ask "Explain Byzantine fault tolerance" --json
```
