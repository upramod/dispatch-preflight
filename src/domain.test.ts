import { describe, expect, it } from 'vitest';
import { evaluate, mappings, Restriction } from './domain';
const approved: Restriction = {street:'Cedar Ave',crossStreet:'Pine St',startsAt:'2026-09-18T09:00',endsAt:'2026-09-18T13:00',approved:true};
const job = (address:string, startsAt:string, endsAt:string) => ({id:'x',address,startsAt,endsAt});
describe('preflight evaluation', () => {
  it('flags an approved overlapping job', () => expect(evaluate(job('142 Cedar Ave','2026-09-18T10:00','2026-09-18T12:00'), approved)).toBe('Potential overlap'));
  it('returns no overlap for a different time', () => expect(evaluate(job('88 Pine St','2026-09-18T14:00','2026-09-18T15:30'), approved)).toBe('No overlap found'));
  it('requires manual review for an unmapped address', () => expect(evaluate(job('500 Birch Lane','2026-09-18T10:00','2026-09-18T11:00'), approved)).toBe('Cannot determine'));
  it('does not use an unapproved restriction', () => expect(evaluate(job('142 Cedar Ave','2026-09-18T10:00','2026-09-18T12:00'), {...approved, approved:false})).toBe('Cannot determine'));
  it('keeps mappings explicit', () => expect(Object.keys(mappings)).toHaveLength(3));
});
