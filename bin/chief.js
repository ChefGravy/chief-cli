#!/usr/bin/env node

/**
 * Chief AI — Council of Four Standalone CLI
 * =========================================
 * Multi-Family Neural STEM Ensemble CLI
 *
 * Seats:
 *   - DeepSeek: Logic, Algorithms, Code Architecture & Systems
 *   - Qwen: Mathematics, Quantitative Reasoning, Calculations & Science
 *   - Mistral: Structure, Schema Validation & Frontend UI/UX Design
 *   - Llama: Chief Arbiter, STEM Synthesis & Balance
 *
 * Usage:
 *   chief "How do I implement distributed locks with Redis and Redlock?"
 *   chief ask "Explain Sloan accruals ratio and cash quality in accounting"
 *   chief ask "Design a Tailwind CSS Bento Grid for dark mode" --seat mistral
 *   chief council
 *   chief status
 */

const https = require('node:https');
const http = require('node:http');

const VERSION = '1.1.0';
const COORDINATOR_URL = process.env.CHIEF_COUNCIL_URL;
const OLLAMA_URL =
    process.env.CHIEF_OLLAMA_URL ||
    process.env.OLLAMA_BASE_URL ||
    'http://127.0.0.1:11434';
const LOCAL_MODELS = {
    qwen: { key: 'qwen2.5:7b', name: 'Qwen 2.5 7B Instruct' },
    finllm: {
        key: 'ruslan-fin-llm-local:latest',
        name: 'Ruslan FinLLM',
    },
};

const ANSI = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    italic: '\x1b[3m',
    underline: '\x1b[4m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    gray: '\x1b[90m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
};

if (!process.stdout.isTTY || process.env.NO_COLOR)
    for (const key of Object.keys(ANSI)) ANSI[key] = '';

function printBanner() {
    console.log(
        `\n${ANSI.bold}${ANSI.cyan}🏛️  CHIEF AI — Council of Four STEM Ensemble CLI${ANSI.reset} ${ANSI.gray}v${VERSION}${ANSI.reset}`,
    );
    console.log(
        `${ANSI.gray}   VPS Ollama inference • one model loaded at a time${ANSI.reset}\n`,
    );
}

function printHelp() {
    printBanner();
    console.log(`${ANSI.bold}USAGE:${ANSI.reset}`);
    console.log(`  chief <command> [options] [arguments]\n`);
    console.log(`${ANSI.bold}COMMANDS:${ANSI.reset}`);
    console.log(
        `  ${ANSI.cyan}ask "<prompt>"${ANSI.reset}        Submit a STEM prompt for Council deliberation (default command)`,
    );
    console.log(
        `  ${ANSI.cyan}"<prompt>"${ANSI.reset}            Shorthand for ask`,
    );
    console.log(
        `  ${ANSI.cyan}council${ANSI.reset}               Display Council seats, model families, and specializations`,
    );
    console.log(
        `  ${ANSI.cyan}models${ANSI.reset}                List locally available models`,
    );
    console.log(
        `  ${ANSI.cyan}status${ANSI.reset}                Check local Ollama availability`,
    );
    console.log(
        `  ${ANSI.cyan}help, --help, -h${ANSI.reset}      Show this help documentation`,
    );
    console.log(
        `  ${ANSI.cyan}version, -v${ANSI.reset}           Print CLI version\n`,
    );
    console.log(`${ANSI.bold}OPTIONS:${ANSI.reset}`);
    console.log(
        `  ${ANSI.yellow}--model <name>${ANSI.reset}        Select a model: ${ANSI.italic}qwen, finllm${ANSI.reset}`,
    );
    console.log(
        `  ${ANSI.yellow}--seat <name>${ANSI.reset}         Compatibility alias for --model qwen or --model finllm`,
    );
    console.log(
        `  ${ANSI.yellow}--verbose${ANSI.reset}             Display individual specialist drafts alongside final synthesis`,
    );
    console.log(
        `  ${ANSI.yellow}--json${ANSI.reset}                Output raw JSON response (ideal for piping into scripts)`,
    );
    console.log(
        `  ${ANSI.yellow}--max-tokens <n>${ANSI.reset}      Maximum tokens for generation (default: 450)\n`,
    );
    console.log(`${ANSI.bold}EXAMPLES:${ANSI.reset}`);
    console.log(
        `  chief "Optimize this SQL query with a covering B-tree index"`,
    );
    console.log(
        `  chief ask "Derive Black-Scholes PDE boundary conditions" --seat qwen`,
    );
    console.log(
        `  chief ask "Analyze this financial statement" --model finllm`,
    );
    console.log(`  chief models\n`);
}

function requestJson(urlStr, options = {}, postData = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const isHttps = url.protocol === 'https:';
        const client = isHttps ? https : http;
        const coordinatorOrigin = COORDINATOR_URL
            ? new URL(COORDINATOR_URL).origin
            : null;
        const isCoordinator = coordinatorOrigin === url.origin;

        const reqOptions = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname + url.search,
            method: options.method || (postData ? 'POST' : 'GET'),
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': `Chief-CLI/${VERSION}`,
                ...(isCoordinator && process.env.CHIEF_MODAL_KEY
                    ? {
                          'Modal-Key': process.env.CHIEF_MODAL_KEY,
                          'Modal-Secret': process.env.CHIEF_MODAL_SECRET || '',
                      }
                    : {}),
                ...(isCoordinator && process.env.CHIEF_COUNCIL_TOKEN
                    ? {
                          Authorization: `Bearer ${process.env.CHIEF_COUNCIL_TOKEN}`,
                      }
                    : {}),
                ...(options.headers || {}),
            },
            timeout: options.timeout || 180000,
        };

        const req = client.request(reqOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
                if (data.length > 2_000_000)
                    req.destroy(new Error('Response too large'));
            });
            res.on('aborted', () => reject(new Error('Response interrupted')));
            res.on('error', reject);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed && typeof parsed === 'object') {
                            if (parsed.ok === false)
                                reject(
                                    new Error(
                                        parsed.error ||
                                            'Council request failed',
                                    ),
                                );
                            else resolve(parsed);
                        } else {
                            reject(
                                new Error(
                                    `Server returned non-object JSON: ${data.substring(0, 100)}`,
                                ),
                            );
                        }
                    } catch (e) {
                        reject(
                            new Error(
                                `Failed to parse JSON response (HTTP ${res.statusCode}): ${data.substring(0, 100)}`,
                            ),
                        );
                    }
                } else {
                    reject(
                        new Error(
                            `Server returned HTTP ${res.statusCode}: ${data.substring(0, 200)}`,
                        ),
                    );
                }
            });
        });

        const deadline = setTimeout(
            () => req.destroy(new Error('Request deadline exceeded')),
            reqOptions.timeout,
        );
        req.once('close', () => clearTimeout(deadline));
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(
                new Error(
                    'Connection timed out. The serverless GPU container may be warming up.',
                ),
            );
        });

        if (postData) {
            req.write(
                typeof postData === 'string'
                    ? postData
                    : JSON.stringify(postData),
            );
        }
        req.end();
    });
}

async function handleStatus() {
    if (!COORDINATOR_URL) {
        printBanner();
        process.stdout.write(
            `${ANSI.cyan}Checking local Ollama...${ANSI.reset} `,
        );
        const start = Date.now();
        try {
            const res = await requestJson(`${OLLAMA_URL}/api/tags`, {
                timeout: 15000,
            });
            const models = (res.models || []).filter((model) =>
                Object.values(LOCAL_MODELS).some(
                    (available) => available.key === model.name,
                ),
            );
            if (!models.length) {
                throw new Error('No supported local models are installed');
            }
            console.log(
                `${ANSI.green}AVAILABLE (${Date.now() - start}ms)${ANSI.reset}\n`,
            );
            for (const model of models) {
                console.log(`  ${ANSI.cyan}•${ANSI.reset} ${model.name}`);
            }
            console.log(
                `\n${ANSI.gray}Only one local model loads at a time.${ANSI.reset}\n`,
            );
        } catch (err) {
            console.log(`${ANSI.red}UNAVAILABLE${ANSI.reset}`);
            console.error(`\n${ANSI.red}Error:${ANSI.reset} ${err.message}\n`);
            process.exitCode = 1;
        }
        return;
    }
    printBanner();
    process.stdout.write(
        `${ANSI.cyan}⚡ Pinging Council of Four Coordinator...${ANSI.reset} `,
    );
    const start = Date.now();
    try {
        const res = await requestJson(`${COORDINATOR_URL}/health`, {
            timeout: 15000,
        });
        const latency = Date.now() - start;
        console.log(
            `${ANSI.green}COORDINATOR ALIVE (${latency}ms; GPU readiness unchecked)${ANSI.reset}\n`,
        );

        console.log(`${ANSI.bold}INFRASTRUCTURE SPECIFICATIONS:${ANSI.reset}`);
        console.log(
            `  ${ANSI.gray}•${ANSI.reset} ${ANSI.bold}Council Stack:${ANSI.reset}       ${res.council || 'Council of Four'}`,
        );
        console.log(
            `  ${ANSI.gray}•${ANSI.reset} ${ANSI.bold}Architecture:${ANSI.reset}        ${res.architecture || 'Option B (Separate Micro-Endpoints)'}`,
        );
        console.log(
            `  ${ANSI.gray}•${ANSI.reset} ${ANSI.bold}Deliberation:${ANSI.reset}        ${res.workflow || 'Workflow 1 (Parallel Blind Ballot)'}`,
        );
        console.log(
            `  ${ANSI.gray}•${ANSI.reset} ${ANSI.bold}Coordinator URL:${ANSI.reset}     ${COORDINATOR_URL}\n`,
        );

        console.log(
            `${ANSI.bold}CONFIGURED SEATS (READINESS UNCHECKED):${ANSI.reset}`,
        );
        if (res.seats) {
            for (const [seat, role] of Object.entries(res.seats)) {
                console.log(
                    `  ${ANSI.cyan}• ${seat.toUpperCase().padEnd(9)}${ANSI.reset} ${ANSI.dim}→${ANSI.reset} ${role}`,
                );
            }
        }
        console.log('');
    } catch (err) {
        console.log(`${ANSI.red}UNREACHABLE${ANSI.reset}`);
        console.error(`\n${ANSI.red}Error:${ANSI.reset} ${err.message}`);
        console.log(
            `${ANSI.yellow}Tip:${ANSI.reset} The serverless GPU containers may be sleeping at zero. A request automatically wakes them.\n`,
        );
        process.exitCode = 1;
    }
}

function handleCouncil() {
    printBanner();
    console.log(
        `${ANSI.bold}THE COUNCIL OF FOUR — SEAT ARCHITECTURE & ROLES:${ANSI.reset}\n`,
    );

    const seats = [
        {
            name: 'DeepSeek',
            family: 'DeepSeek-R1-Distill-Qwen (7B)',
            role: 'Forensic Logic, Algorithms, Code Architecture & Systems',
            focus: 'Audits algorithmic efficiency, Big-O complexity, concurrency, edge cases, and defensive system design.',
        },
        {
            name: 'Qwen',
            family: 'Qwen2.5 (7B Instruct)',
            role: 'Mathematics, Quantitative Reasoning, Calculations & Science',
            focus: 'Validates computational proofs, statistical formulas, financial valuation math, and scientific equations.',
        },
        {
            name: 'Mistral',
            family: 'Mistral-0.3 (7B Instruct)',
            role: 'Structure, Schema Validation & Frontend UI/UX Design',
            focus: 'Enforces component hierarchy, Tailwind CSS design systems, React/Next.js aesthetics, and strict schema bounds.',
        },
        {
            name: 'Llama',
            family: 'Llama-3.1 (8B Instruct)',
            role: 'Chief Arbiter, STEM Synthesis & Balance',
            focus: 'Ingests parallel specialist drafts, scores consensus (0-100%), resolves conflicts, and outputs the definitive answer.',
        },
    ];

    for (const s of seats) {
        console.log(
            `  ${ANSI.bold}${ANSI.cyan}Seat [${s.name.toUpperCase()}]:${ANSI.reset} ${s.role}`,
        );
        console.log(`    ${ANSI.gray}Family:${ANSI.reset} ${s.family}`);
        console.log(`    ${ANSI.gray}Focus:${ANSI.reset}  ${s.focus}\n`);
    }

    console.log(`${ANSI.bold}WORKFLOW 1: PARALLEL BLIND BALLOT${ANSI.reset}`);
    console.log(
        `  1. Prompt is dispatched simultaneously to DeepSeek, Qwen, and Mistral in parallel.`,
    );
    console.log(
        `  2. Each specialist formulates an independent draft without cross-model bias.`,
    );
    console.log(
        `  3. Llama Arbiter ingests all 3 ballots, measures consensus, and outputs the unified synthesis.\n`,
    );
}

function handleModels() {
    printBanner();
    console.log(`${ANSI.bold}AVAILABLE LOCAL MODELS:${ANSI.reset}\n`);
    for (const [key, model] of Object.entries(LOCAL_MODELS)) {
        console.log(
            `  ${ANSI.cyan}• ${key}${ANSI.reset} ${ANSI.dim}->${ANSI.reset} ${model.name}`,
        );
    }
    console.log(
        `\n${ANSI.gray}Ollama unloads the previous model before loading the selected one.${ANSI.reset}\n`,
    );
}

async function handleLocalAsk(prompt, options) {
    if (!prompt || !prompt.trim()) {
        console.error(
            `${ANSI.red}Error:${ANSI.reset} Please provide a prompt. Example: chief ask "How do I optimize this query?"`,
        );
        process.exit(1);
    }

    const model = LOCAL_MODELS[options.model || 'qwen'];
    if (!model) {
        console.error(
            `${ANSI.red}Error:${ANSI.reset} Unknown model. Available models: ${Object.keys(LOCAL_MODELS).join(', ')}`,
        );
        process.exit(1);
    }

    try {
        const result = await requestJson(
            `${OLLAMA_URL}/api/chat`,
            { timeout: 180000 },
            {
                model: model.key,
                messages: [{ role: 'user', content: prompt }],
                stream: false,
                keep_alive: 0,
                options: { num_predict: options.maxTokens },
            },
        );
        const content = result.message?.content || result.response || '';
        if (!content) throw new Error('Ollama returned an empty response');

        if (options.json) {
            console.log(
                JSON.stringify(
                    { ok: true, model: model.key, content },
                    null,
                    2,
                ),
            );
            return;
        }

        printBanner();
        console.log(
            `${ANSI.bold}MODEL:${ANSI.reset} ${model.name}\n${ANSI.gray}${content}${ANSI.reset}\n`,
        );
    } catch (err) {
        if (options.json) {
            console.error(JSON.stringify({ ok: false, error: err.message }));
        } else {
            console.error(
                `${ANSI.red}Local model request failed:${ANSI.reset} ${err.message}`,
            );
        }
        process.exit(1);
    }
}

async function handleAsk(prompt, options) {
    if (!COORDINATOR_URL) {
        await handleLocalAsk(prompt, options);
        return;
    }
    const endpoint = new URL(COORDINATOR_URL);
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(
        endpoint.hostname,
    );
    if (
        (!loopback && endpoint.protocol !== 'https:') ||
        (!loopback && !process.env.CHIEF_COUNCIL_TOKEN)
    ) {
        console.error(
            options.json
                ? JSON.stringify({
                      ok: false,
                      error: 'Configure HTTPS CHIEF_COUNCIL_URL and CHIEF_COUNCIL_TOKEN',
                  })
                : 'Configure HTTPS CHIEF_COUNCIL_URL and CHIEF_COUNCIL_TOKEN',
        );
        process.exitCode = 1;
        return;
    }

    if (!prompt || !prompt.trim()) {
        console.error(
            `${ANSI.red}Error:${ANSI.reset} Please provide a prompt. Example: chief ask "How do I optimize this query?"`,
        );
        process.exit(1);
    }

    if (options.json) {
        // Silent JSON output
        try {
            let res;
            if (options.seat) {
                res = await requestJson(
                    `${COORDINATOR_URL}/api/seat/${options.seat}`,
                    {},
                    { prompt, max_tokens: options.maxTokens },
                );
            } else {
                res = await requestJson(
                    `${COORDINATOR_URL}/api/council/deliberate`,
                    {},
                    { prompt, max_tokens: options.maxTokens },
                );
            }
            console.log(JSON.stringify(res, null, 2));
            return;
        } catch (e) {
            console.error(JSON.stringify({ ok: false, error: e.message }));
            process.exit(1);
        }
    }

    printBanner();
    console.log(
        `${ANSI.bold}PROMPT:${ANSI.reset} ${ANSI.italic}${prompt}${ANSI.reset}\n`,
    );

    const spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let spinIdx = 0;
    const isSingleSeat = Boolean(options.seat);
    const spinnerText = isSingleSeat
        ? `Consulting ${options.seat.toUpperCase()} specialist directly...`
        : `Convening Council of Four (DeepSeek: Logic, Qwen: Math, Mistral: UI/UX)...`;

    process.stdout.write(
        `${ANSI.cyan}${spinnerChars[0]} ${spinnerText}${ANSI.reset}`,
    );
    const spinTimer = setInterval(() => {
        spinIdx = (spinIdx + 1) % spinnerChars.length;
        process.stdout.write(
            `\r${ANSI.cyan}${spinnerChars[spinIdx]} ${spinnerText}${ANSI.reset}`,
        );
    }, 100);

    const startTime = Date.now();
    try {
        let result;
        if (options.seat) {
            result = await requestJson(
                `${COORDINATOR_URL}/api/seat/${options.seat}`,
                {},
                {
                    prompt,
                    max_tokens: options.maxTokens,
                },
            );
        } else {
            result = await requestJson(
                `${COORDINATOR_URL}/api/council/deliberate`,
                {},
                {
                    prompt,
                    max_tokens: options.maxTokens,
                },
            );
        }
        clearInterval(spinTimer);
        process.stdout.write(`\r${' '.repeat(80)}\r`);

        const totalSec = ((Date.now() - startTime) / 1000).toFixed(2);

        if (result.ok === false) {
            throw new Error(
                result.error || 'Council endpoint returned failure',
            );
        }

        if (isSingleSeat) {
            console.log(
                `${ANSI.bold}${ANSI.green}✓ ${options.seat.toUpperCase()} RESPONSE (${totalSec}s):${ANSI.reset}\n`,
            );
            console.log(result.content || result.raw || JSON.stringify(result));
            console.log('');
            return;
        }

        // Full Council Output
        const score =
            typeof result.consensus_score === 'number'
                ? result.consensus_score
                : null;
        let scoreColor = ANSI.green;
        if (score < 70) scoreColor = ANSI.red;
        else if (score < 85) scoreColor = ANSI.yellow;

        console.log(
            `${ANSI.bold}🏛️  COUNCIL ARBITER SYNTHESIS${ANSI.reset}  ${ANSI.dim}•${ANSI.reset}  Consensus Agreement: ${scoreColor}${ANSI.bold}${score === null ? 'Unknown' : score + '%'}${ANSI.reset}  ${ANSI.dim}(${totalSec}s total)${ANSI.reset}\n`,
        );
        console.log(`${'─'.repeat(70)}\n`);
        console.log(
            result.synthesis ||
                result.arbiter?.content ||
                'No synthesis generated.',
        );
        console.log(`\n${'─'.repeat(70)}\n`);

        if (options.verbose && result.seats) {
            console.log(
                `${ANSI.bold}${ANSI.cyan}SPECIALIST BALLOT BREAKDOWNS:${ANSI.reset}\n`,
            );
            for (const [seatKey, seatData] of Object.entries(result.seats)) {
                console.log(
                    `${ANSI.bold}▸ [${seatKey.toUpperCase()}] ${seatData.role || ''} (${seatData.duration_sec || '?'}s):${ANSI.reset}`,
                );
                console.log(
                    `${ANSI.dim}${seatData.content || ''}${ANSI.reset}\n`,
                );
            }
        }

        console.log(
            `${ANSI.gray}Metrics: Parallel Ballots: ${result.metrics?.parallel_duration_sec || '?'}s | Arbiter: ${result.metrics?.arbiter_duration_sec || '?'}s | Total: ${result.metrics?.total_duration_sec || totalSec}s${ANSI.reset}\n`,
        );
    } catch (err) {
        clearInterval(spinTimer);
        process.stdout.write(`\r${' '.repeat(80)}\r`);
        console.log(
            `${ANSI.red}✗ Council deliberation failed:${ANSI.reset} ${err.message}\n`,
        );
        console.log(
            `${ANSI.yellow}Note:${ANSI.reset} If the serverless GPU endpoints are waking up from zero, please retry in 10-15 seconds.\n`,
        );
        process.exit(1);
    }
}

// CLI Argument Parsing
async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        printHelp();
        return;
    }

    const firstArg = args[0];
    if (firstArg === 'help' || firstArg === '--help' || firstArg === '-h') {
        printHelp();
        return;
    }

    if (
        firstArg === 'version' ||
        firstArg === '--version' ||
        firstArg === '-v'
    ) {
        console.log(`chief version ${VERSION}`);
        return;
    }

    if (firstArg === 'status') {
        await handleStatus();
        return;
    }

    if (firstArg === 'council') {
        handleModels();
        return;
    }

    if (firstArg === 'models') {
        handleModels();
        return;
    }

    // Parse options
    const options = {
        seat: null,
        model: null,
        verbose: false,
        json: false,
        maxTokens: 450,
    };

    const ALLOWED_MODELS = Object.keys(LOCAL_MODELS);
    let promptWords = [];
    let i = 0;
    if (firstArg === 'ask') i = 1;

    while (i < args.length) {
        const arg = args[i];
        if (arg === '--seat') {
            const nextVal = args[i + 1]?.toLowerCase();
            if (!nextVal || nextVal.startsWith('--')) {
                console.error(
                    `${ANSI.red}Error:${ANSI.reset} --seat requires a valid model (${ALLOWED_MODELS.join(', ')})`,
                );
                process.exit(1);
            }
            if (!ALLOWED_MODELS.includes(nextVal)) {
                console.error(
                    `${ANSI.red}Error:${ANSI.reset} Unknown model '${nextVal}'. Allowed models: ${ALLOWED_MODELS.join(', ')}`,
                );
                process.exit(1);
            }
            options.seat = nextVal;
            options.model = nextVal;
            i += 2;
        } else if (arg === '--model') {
            const nextVal = args[i + 1]?.toLowerCase();
            if (!nextVal || !ALLOWED_MODELS.includes(nextVal)) {
                console.error(
                    `${ANSI.red}Error:${ANSI.reset} --model requires one of: ${ALLOWED_MODELS.join(', ')}`,
                );
                process.exit(1);
            }
            options.model = nextVal;
            i += 2;
        } else if (arg === '--verbose' || arg === '-V') {
            options.verbose = true;
            i++;
        } else if (arg === '--json') {
            options.json = true;
            i++;
        } else if (arg === '--max-tokens') {
            const raw = args[i + 1] || '';
            const val = Number(raw);
            if (
                !/^\d+$/.test(raw) ||
                !Number.isSafeInteger(val) ||
                val < 1 ||
                val > 1024
            ) {
                console.error(
                    `${ANSI.red}Error:${ANSI.reset} --max-tokens must be an integer from 1 to 1024`,
                );
                process.exit(1);
            }
            options.maxTokens = val;
            i += 2;
        } else {
            promptWords.push(arg);
            i++;
        }
    }

    const prompt = promptWords.join(' ');
    await handleAsk(prompt, options);
}

main().catch((err) => {
    console.error(`Fatal error: ${err.message}`);
    process.exit(1);
});
