export function normalizeStreet(value) {
  if (!value) return value;
  const matches = value.match(/[A-Za-z0-9 .'-]+\s+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr)\b/gi);
  return (matches?.at(-1)?.trim() ?? value.trim()).replace(/^(and|between|from)\s+/i, '');
}

export function applySafetyChecks(extracted, notice) {
  const windows = notice.match(/\b\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\s*(?:to|-|–)\s*\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b/gi) ?? [];
  const uncertain = /\b(may occur|subject to change|anticipated|weather permitting|timelines? may|check .*updates?)\b/i.test(notice);
  const sourceFacts = explicitSourceFacts(notice);
  const result = { ...extracted, ...sourceFacts, street: normalizeStreet(sourceFacts.street ?? extracted.street), crossStreet: normalizeStreet(sourceFacts.crossStreet ?? extracted.crossStreet) };
  if (windows.length > 1 || uncertain) return { ...result, startsAt: null, endsAt: null, confidence: Math.min(Number(result.confidence) || 0, 0.25) };
  return result;
}

function explicitSourceFacts(notice) {
  const location = notice.match(/\b([A-Za-z0-9 .'-]+\s+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr))\s+(?:at|near|between)\s+(.+?\s+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr))\b/i);
  const date = notice.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})\b/i);
  const times = notice.match(/\b(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\s+to\s+(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\b/i);
  if (!date || !times) return {};
  const month = new Date(`${date[1]} 1, 2000`).getMonth() + 1;
  const iso = (hour, minute, meridiem) => { let h = Number(hour) % 12; if (meridiem.toUpperCase() === 'PM') h += 12; return `${date[3]}-${String(month).padStart(2, '0')}-${date[2].padStart(2, '0')}T${String(h).padStart(2, '0')}:${minute || '00'}`; };
  return { ...(location ? { street: location[1], crossStreet: location[2] } : {}), startsAt: iso(times[1], times[2], times[3]), endsAt: iso(times[4], times[5], times[6]) };
}
