import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('./kit.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { subscribeViaKit } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('Kit integration creates the subscriber then attaches to the magnet form', async () => {
 const originalFetch = globalThis.fetch, originalKey = process.env.KIT_API_KEY;
 const calls = []; process.env.KIT_API_KEY = 'mock-key';
 globalThis.fetch = async (url, options) => { calls.push({ url, options }); return Response.json({}); };
 try {
  assert.equal(await subscribeViaKit('test@example.com', '9682557'), true);
  assert.deepEqual(calls.map(c => c.url), ['https://api.kit.com/v4/subscribers','https://api.kit.com/v4/forms/9682557/subscribers']);
  assert.equal(JSON.parse(calls[0].options.body).email_address, 'test@example.com');
  assert.equal(JSON.parse(calls[1].options.body).email_address, 'test@example.com');
  assert.ok(calls.every(c => c.options.signal instanceof AbortSignal));
 } finally { globalThis.fetch = originalFetch; if(originalKey === undefined) delete process.env.KIT_API_KEY; else process.env.KIT_API_KEY = originalKey; }
});
test('Kit failures stop the flow and do not log the recipient or provider body', async () => {
 const originalFetch = globalThis.fetch, originalKey = process.env.KIT_API_KEY, originalError = console.error;
 process.env.KIT_API_KEY = 'mock-key'; const logs = []; console.error = (...args) => logs.push(args.join(' '));
 try {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response('private test@example.com details', {status:401}); };
  assert.equal(await subscribeViaKit('test@example.com','9682557'),false); assert.equal(calls,1);
  globalThis.fetch = async () => { throw new Error('private test@example.com'); };
  assert.equal(await subscribeViaKit('test@example.com','9682557'),false);
  assert.doesNotMatch(logs.join(' '), /test@example.com|private|mock-key/);
 } finally { globalThis.fetch = originalFetch; console.error = originalError; if(originalKey === undefined) delete process.env.KIT_API_KEY; else process.env.KIT_API_KEY = originalKey; }
});
