import { createServer } from 'node:http';

const port = Number(process.env.API_PORT ?? 8787);
const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/$/, '');
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? '2024-10-21';
const extractionSchema = { type: 'object', additionalProperties: false, properties: {
  street: { type: ['string', 'null'] }, crossStreet: { type: ['string', 'null'] }, startsAt: { type: ['string', 'null'] }, endsAt: { type: ['string', 'null'] }, confidence: { type: 'number' }, sourceQuote: { type: 'string' }
}, required: ['street', 'crossStreet', 'startsAt', 'endsAt', 'confidence', 'sourceQuote'] };
function json(res, status, body) { res.writeHead(status, { 'content-type': 'application/json', 'access-control-allow-origin': '*' }); res.end(JSON.stringify(body)); }
const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type' }); return res.end(); }
  if (req.method !== 'POST' || req.url !== '/api/extract') return json(res, 404, { error: 'Not found' });
  if (!endpoint || !deployment || !apiKey) return json(res, 503, { error: 'Azure OpenAI is not configured. Use synthetic demo mode.' });
  try {
    let raw = ''; for await (const chunk of req) raw += chunk;
    const notice = JSON.parse(raw).notice;
    const response = await fetch(`${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`, { method: 'POST', headers: { 'api-key': apiKey, 'content-type': 'application/json' }, body: JSON.stringify({ temperature: 0, response_format: { type: 'json_schema', json_schema: { name: 'restriction_extraction', strict: true, schema: extractionSchema } }, messages: [{ role: 'system', content: 'Extract only facts stated in the notice. Use null for missing or ambiguous fields. Do not infer addresses, dates, times, routes, or legal conclusions. Return ISO local datetime strings when a complete date and time are explicitly stated.' }, { role: 'user', content: notice }] }) });
    if (!response.ok) return json(res, 502, { error: `Azure OpenAI returned ${response.status}: ${await response.text()}` });
    const completion = await response.json(); return json(res, 200, JSON.parse(completion.choices[0].message.content));
  } catch (error) { return json(res, 500, { error: error instanceof Error ? error.message : 'Extraction failed' }); }
});
server.listen(port, () => console.log(`Extraction API listening on http://localhost:${port}`));
