const test = require('node:test'),
    assert = require('node:assert/strict'),
    http = require('node:http'),
    { spawn } = require('node:child_process'),
    path = require('node:path');
const cli = path.join(__dirname, '../bin/chief.js');
async function withServer(body, fn) {
    const requests = [];
    const s = http.createServer((req, res) => {
        let b = '';
        req.on('data', (x) => (b += x));
        req.on('end', () => {
            requests.push({ headers: req.headers, body: b });
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(body));
        });
    });
    await new Promise((r) => s.listen(0, '127.0.0.1', r));
    try {
        return await fn('http://127.0.0.1:' + s.address().port, requests);
    } finally {
        s.close();
    }
}
function run(url, args, extra = {}) {
    return new Promise((resolve) => {
        const p = spawn(process.execPath, [cli, ...args], {
            env: {
                ...process.env,
                CHIEF_COUNCIL_URL: url,
                CHIEF_COUNCIL_TOKEN: 'fixture-token',
                NO_COLOR: '1',
                ...extra,
            },
        });
        let out = '',
            err = '';
        p.stdout.on('data', (d) => (out += d));
        p.stderr.on('data', (d) => (err += d));
        p.on('close', (code) => resolve({ code, out, err }));
    });
}
test('both output modes fail for application failure', () =>
    withServer({ ok: false, error: 'fixture' }, async (url) => {
        for (const flags of [[], ['--json']])
            assert.equal(
                (await run(url, ['ask', 'fixture', ...flags])).code,
                1,
            );
    }));
test('JSON success is parseable and bearer token forwarded', () =>
    withServer({ ok: true, synthesis: 'fixture' }, async (url, requests) => {
        const r = await run(url, ['ask', 'fixture', '--json']);
        assert.equal(r.code, 0);
        assert.equal(JSON.parse(r.out).ok, true);
        assert.equal(requests[0].headers.authorization, 'Bearer fixture-token');
    }));
test('missing confidence stays unknown and output has no ANSI escapes', () =>
    withServer({ ok: true, synthesis: 'fixture' }, async (url) => {
        const r = await run(url, ['ask', 'fixture']);
        assert.equal(r.code, 0);
        assert.match(r.out, /Unknown/);
        assert.doesNotMatch(r.out, /85%|\x1b/);
    }));
test('invalid integer never makes a request', () =>
    withServer({}, async (url, requests) => {
        for (const value of ['12junk', '1.5', '-1', '1025'])
            assert.equal(
                (await run(url, ['ask', 'fixture', '--max-tokens', value]))
                    .code,
                1,
            );
        assert.equal(requests.length, 0);
    }));
test('public endpoint requires HTTPS and explicit token', async () => {
    const r = await run(
        'https://fixture.invalid',
        ['ask', 'fixture', '--json'],
        { CHIEF_COUNCIL_TOKEN: '' },
    );
    assert.equal(r.code, 1);
    assert.match(r.err, /CHIEF_COUNCIL_TOKEN/);
});
