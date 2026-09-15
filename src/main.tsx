import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { evaluate, Job, Restriction } from './domain';
import './styles.css';

const notices = [
  { title: 'Municipal bulletin', text: `CITY OF MAPLE GROVE | PUBLIC WORKS DEPARTMENT\nFIELD NOTICE 26-0918-B · Issued September 12, 2026\n\nTEMPORARY ACCESS RESTRICTION\nProject: WM-442 water-main repair\nLocation: Cedar Avenue, from the 1st Street intersection to Pine Street\n\nWORK WINDOW: Friday, September 18, 2026, 9:00 a.m. to 1:00 p.m.\nCrew staging may begin at 8:30 a.m. The work window is the only restriction period listed in this notice.\n\nNearby reference: the community center is open Saturday, September 19, from 10:00 a.m.\nQuestions: Public Works desk, 555-0142. Emergency access remains available.`, restriction: { street: 'Cedar Ave', crossStreet: 'Pine St', startsAt: '2026-09-18T09:00', endsAt: '2026-09-18T13:00', approved: false } as Restriction },
  { title: 'Incomplete bulletin', text: `CITY OF MAPLE GROVE\nTEMPORARY STREET RESTRICTION\nOak Boulevard near the community center\nSeptember 19, 2026\nRoad work is planned. Check the posted signs for timing.`, restriction: { street: 'Oak Blvd', crossStreet: '', startsAt: '', endsAt: '', approved: false } as Restriction }
];
const jobs: Job[] = [
  { id: 'JOB-1042', address: '142 Cedar Ave', startsAt: '2026-09-18T10:00', endsAt: '2026-09-18T12:00' },
  { id: 'JOB-1043', address: '88 Pine St', startsAt: '2026-09-18T14:00', endsAt: '2026-09-18T15:30' },
  { id: 'JOB-1044', address: '500 Birch Lane', startsAt: '2026-09-18T10:00', endsAt: '2026-09-18T11:00' }
];

function App() {
  const [noticeIndex, setNoticeIndex] = useState(0);
  const [restriction, setRestriction] = useState(notices[0].restriction);
  const [extractionStatus, setExtractionStatus] = useState('Synthetic demo facts');
  const [selected, setSelected] = useState(jobs[0]);
  const activeNotice = notices[noticeIndex];
  const decision = evaluate(selected, restriction);
  return <main>
    <header><div><span className="eyebrow">DISPATCH PREFLIGHT</span><h1>Check tomorrow’s jobs before the crew rolls.</h1><p className="sub">Extract facts from city notices. Approve them. Run a deterministic preflight check.</p></div><span className="status">DEMO DATA · SYNTHETIC</span></header>
    <section className="steps"><div className="step active"><b>01</b><span>Extract</span></div><div className="line"/><div className={`step ${restriction.approved ? 'active' : ''}`}><b>02</b><span>Approve</span></div><div className="line"/><div className={`step ${restriction.approved ? 'active' : ''}`}><b>03</b><span>Execute</span></div></section>
    <div className="grid">
      <section className="card source"><div className="cardhead"><div><span className="label">SOURCE NOTICE</span><h2>{activeNotice.title}</h2></div><span className="tag">Synthetic</span></div><div className="notice-tabs">{notices.map((item, i) => <button className={i === noticeIndex ? 'tab active-tab' : 'tab'} onClick={() => { setNoticeIndex(i); setRestriction(item.restriction); setExtractionStatus('Synthetic demo facts'); }} key={item.title}>{item.title}</button>)}</div><pre>{activeNotice.text}</pre><button onClick={async () => { setExtractionStatus('Extracting with Azure OpenAI…'); try { const r = await fetch('/api/extract', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({notice: activeNotice.text}) }); const data = await r.json(); if (!r.ok) throw new Error(data.error); setRestriction({ ...data, approved: false }); setExtractionStatus(`Azure OpenAI · confidence ${Math.round(data.confidence * 100)}%`); } catch (e) { setExtractionStatus(e instanceof Error ? e.message : 'Extraction failed'); } }}>Extract with Azure OpenAI</button><p className="caption">{extractionStatus}. Facts remain beside their source. The system does not infer missing details.</p></section>
      <section className="card"><div className="cardhead"><div><span className="label">EXTRACTED FACTS</span><h2>Review before use</h2></div><span className={restriction.approved ? 'approved tag' : 'pending tag'}>{restriction.approved ? 'Approved' : 'Needs approval'}</span></div><div className="facts"><Fact label="Street segment" value={restriction.street || 'Missing'}/><Fact label="Cross street" value={restriction.crossStreet || 'Missing'}/><Fact label="Restriction window" value={restriction.startsAt ? 'Sep 18 · 9:00 AM–1:00 PM' : 'Missing'}/></div><button disabled={!restriction.startsAt || !restriction.endsAt} onClick={() => setRestriction({...restriction, approved: !restriction.approved})}>{restriction.approved ? 'Revoke approval' : 'Approve restriction'}</button><p className="caption">Only approved restrictions can affect evaluation. Missing facts require manual review.</p></section>
    </div>
    <section className="card jobs"><div className="cardhead"><div><span className="label">EXECUTE</span><h2>Today’s scheduled jobs</h2></div><span className="rule">Deterministic TypeScript rule</span></div><div className="joblist">{jobs.map(job => <button className={`job ${selected.id === job.id ? 'selected' : ''}`} onClick={() => setSelected(job)} key={job.id}><span><strong>{job.id}</strong><small>{job.address} · {job.startsAt.slice(11)}–{job.endsAt.slice(11)}</small></span><span className="arrow">›</span></button>)}</div><div className={`result ${decision.toLowerCase().replaceAll(' ', '-')}`}><span className="resultlabel">PREFLIGHT RESULT</span><strong>{decision}</strong><p>{!restriction.approved ? 'Approve the extracted restriction to run the check.' : decision === 'Cannot determine' ? 'The address is not in the declared test mapping. Manual review required.' : decision === 'Potential overlap' ? 'The mapped street and time windows overlap. Review this job before dispatch.' : 'No declared street or time-window overlap was found.'}</p></div></section>
    <footer>Declared mappings only · No routing · No legal parking advice · No invented addresses</footer>
  </main>;
}
function Fact({label, value}: {label: string; value: string}) { return <div className="fact"><span>{label}</span><strong>{value}</strong></div> }
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
