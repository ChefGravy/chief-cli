# Chief AI — Local Ollama CLI

Standalone developer CLI for the VPS Ollama models. Ollama unloads the current model before loading the selected model.

## Available Models
1. **Qwen 2.5 7B Instruct:** `--model qwen`
2. **Ruslan FinLLM:** `--model finllm`

The old Council endpoint remains available only when `CHIEF_COUNCIL_URL` is explicitly configured.

## Installation
The binary is installed globally on the system:
```bash
# Verify installation
which chief
# -> /usr/local/bin/chief
```

## Commands
```bash
# Ask the default Qwen model
chief "Design a distributed rate limiter in Redis with sliding windows"

# Select FinLLM
chief ask "Analyze this financial statement" --model finllm

# Compatibility alias
chief ask "Calculate Sloan accruals ratio" --seat finllm

# List local models
chief models
chief council

# Check Ollama health
chief status

# Output raw JSON for script piping
chief ask "Explain Byzantine fault tolerance" --json
```

Use `CHIEF_OLLAMA_URL` to point the CLI at another Ollama server.
