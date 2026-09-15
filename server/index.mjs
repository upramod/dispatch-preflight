import { createServer } from 'node:http';
import DOMMatrix from '@thednp/dommatrix';
globalThis.DOMMatrix = DOMMatrix;
globalThis.ImageData ??= class ImageData {};
globalThis.Path2D ??= class Path2D {};
const { PDFParse } = await import('pdf-parse');

const port = Number(process.env.API_PORT ?? 8787);
const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/$/, '');
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? '2024-10-21';
const extractionSchema = { type: 'object', additionalProperties: false, properties: {
  street: { type: ['string', 'null'] }, crossStreet: { type: ['string', 'null'] }, startsAt: { type: ['string', 'null'] }, endsAt: { type: ['string', 'null'] }, confidence: { type: 'number' }, sourceQuote: { type: 'string' }
}, required: ['street', 'crossStreet', 'startsAt', 'endsAt', 'confidence', 'sourceQuote'] };
async function extractPdfText(buffer) { const parser = new PDFParse({ data: buffer }); try { return (await parser.getText()).text; } finally { await parser.destroy(); } }
function json(res, status, body) { res.writeHead(status, { 'content-type': 'application/json', 'access-control-allow-origin': '*' }); res.end(JSON.stringify(body)); }
const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type' }); return res.end(); }
  if (req.method !== 'POST' || !['/api/extract', '/api/extract-pdf', '/api/pdf-text'].includes(req.url)) return json(res, 404, { error: 'Not found' });
  try {
    let raw = ''; for await (const chunk of req) raw += chunk;
    const body = JSON.parse(raw);
    if (req.url === '/api/pdf-text') return json(res, 200, { extractedText: await extractPdfText(Buffer.from(body.pdfBase64, 'base64')) });
    if (!endpoint || !deployment || !apiKey) return json(res, 503, { error: 'Azure OpenAI is not configured. Use synthetic demo mode.' });
    const notice = req.url === '/api/extract-pdf' ? await extractPdfText(Buffer.from(body.pdfBase64, 'base64')) : body.notice;
    const response = await fetch(`${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`, { method: 'POST', headers: { 'api-key': apiKey, 'content-type': 'application/json' }, body: JSON.stringify({ temperature: 0, response_format: { type: 'json_schema', json_schema: { name: 'restriction_extraction', strict: true, schema: extractionSchema } }, messages: [{ role: 'system', content: 'Extract only facts stated in the notice. Use null for missing, conditional, changeable, or ambiguous fields. If the notice contains two or more different work windows, do not choose one: return startsAt=null, endsAt=null, and confidence below 0.5. Treat phrases such as may occur, anticipated, subject to change, weather permitting, or check the website as uncertainty. Do not infer addresses, dates, times, routes, legal conclusions, or street segments from a map. Return ISO local datetime strings only when one complete, unambiguous date and time window is explicitly stated.' }, { role: 'user', content: notice }] }) });
    if (!response.ok) return json(res, 502, { error: `Azure OpenAI returned ${response.status}: ${await response.text()}` });
    const completion = await response.json();
    const extracted = JSON.parse(completion.choices[0].message.content);
    const windows = notice.match(/\b\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\s*(?:to|-|–)\s*\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b/gi) ?? [];
    const uncertain = /\b(may occur|subject to change|anticipated|weather permitting|timelines? may|check .*updates?)\b/i.test(notice);
    if (windows.length > 1 || uncertain) { extracted.startsAt = null; extracted.endsAt = null; extracted.confidence = Math.min(Number(extracted.confidence) || 0, 0.25); }
    return json(res, 200, { ...extracted, extractedText: notice });
  } catch (error) { return json(res, 500, { error: error instanceof Error ? error.message : 'Extraction failed' }); }
});
server.listen(port, () => console.log(`Extraction API listening on http://localhost:${port}`));
