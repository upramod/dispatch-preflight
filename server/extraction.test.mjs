import { describe, expect, it } from 'vitest';
import { applySafetyChecks, normalizeStreet } from './extraction.mjs';
const oakNotice = `CITY OF RIVERBEND\nROADWORK BULLETIN\nOak Boulevard at 4th Street\nWednesday, October 7, 2026, 6:00 AM to 8:00 AM\nPaving preparation will limit curb access near the work area.`;
const pineNotice = `Pine Street between Oak Boulevard and Cedar Avenue\nTuesday, October 6, 2026, 1:30 PM to 4:45 PM`;
describe('PDF extraction safety normalization', () => {
  it('replaces stale Azure facts with explicit Oak source facts', () => {
    const result = applySafetyChecks({ street: 'Pine Street', crossStreet: 'Oak Boulevard', startsAt: '2026-09-18T09:00', endsAt: '2026-09-18T13:00', confidence: 1 }, oakNotice);
    expect(normalizeStreet('Oak Boulevard')).toBe('Oak Boulevard');
    expect(result.startsAt).toBe('2026-10-07T06:00'); expect(result.endsAt).toBe('2026-10-07T08:00');
    expect(result.street).toBe('Oak Boulevard'); expect(result.crossStreet).toBe('4th Street');
  });
  it('keeps a clear single-window extraction usable', () => {
    const result = applySafetyChecks({ street: 'Pine Street', crossStreet: 'Oak Boulevard', startsAt: '2026-10-06T13:30', endsAt: '2026-10-06T16:45', confidence: 1 }, pineNotice);
    expect(result.startsAt).toBe('2026-10-06T13:30'); expect(result.endsAt).toBe('2026-10-06T16:45');
  });
  it('removes approval-worthy times from conflicting notices', () => {
    const result = applySafetyChecks({ street: 'Cedar Avenue', crossStreet: 'Pine Street', startsAt: '2026-09-18T08:00', endsAt: '2026-09-18T12:00', confidence: 1 }, 'Cedar Avenue. 8:00 AM to 12:00 PM. Traffic plan: 10:00 AM to 2:00 PM. Evening work may occur.');
    expect(result.startsAt).toBeNull(); expect(result.endsAt).toBeNull(); expect(result.confidence).toBe(0.25);
  });
});
