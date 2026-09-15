export type Restriction = { street: string; crossStreet: string; startsAt: string; endsAt: string; approved: boolean };
export type Job = { id: string; address: string; startsAt: string; endsAt: string };
export type Decision = 'Potential overlap' | 'No overlap found' | 'Cannot determine';

export const emptyRestriction = (): Restriction => ({ street: '', crossStreet: '', startsAt: '', endsAt: '', approved: false });

export function formatRestrictionWindow(restriction: Restriction): string {
  if (!restriction.startsAt || !restriction.endsAt) return 'Missing';
  const start = new Date(restriction.startsAt);
  const end = new Date(restriction.endsAt);
  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) return 'Missing';
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}–${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}

export const mappings: Record<string, string> = {
  '142 Cedar Ave': 'Cedar Ave',
  '88 Pine St': 'Pine St',
  '19 Oak Blvd': 'Oak Blvd'
};

function canonicalStreet(value: string) {
  return value.toLowerCase().replace(/\./g, '').replace(/\bavenue\b/g, 'ave').replace(/\bstreet\b/g, 'st').replace(/\bboulevard\b/g, 'blvd').replace(/\broad\b/g, 'rd').replace(/\bdrive\b/g, 'dr').replace(/\broadway\b/g, 'broadway').replace(/\s+/g, ' ').trim();
}

export function evaluate(job: Job, restriction: Restriction): Decision {
  if (!restriction.approved || !job.startsAt || !job.endsAt || !restriction.startsAt || !restriction.endsAt) return 'Cannot determine';
  const segment = mappings[job.address];
  if (!segment) return 'Cannot determine';
  if (canonicalStreet(segment) !== canonicalStreet(restriction.street) && canonicalStreet(segment) !== canonicalStreet(restriction.crossStreet)) return 'No overlap found';
  return job.startsAt < restriction.endsAt && job.endsAt > restriction.startsAt ? 'Potential overlap' : 'No overlap found';
}
