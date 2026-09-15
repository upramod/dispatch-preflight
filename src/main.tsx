import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { evaluate, Job, Restriction } from './domain';
import './styles.css';

const notice = `CITY OF MAPLE GROVE\nTEMPORARY STREET RESTRICTION\nCedar Avenue between 1st Street and Pine Street\nSeptember 18, 2026 · 9:00 AM–1:00 PM\nWater-main repair. No curb access in the declared segment.`;
const initialRestriction: Restriction = { street: 'Cedar Ave', crossStreet: 'Pine St', startsAt: '2026-09-18T09:00', endsAt: '2026-09-18T13:00', approved: false };
const jobs: Job[] = [
  { id: 'JOB-1042', address: '142 Cedar Ave', startsAt: '2026-09-18T10:00', endsAt: '2026-09-18T12:00' },
  { id: 'JOB-1043', address: '88 Pine St', startsAt: '2026-09-18T14:00', endsAt: '2026-09-18T15:30' },
  { id: 'JOB-1044', address: '500 Birch Lane', startsAt: '2026-09-18T10:00', endsAt: '2026-09-18T11:00' }
];

function App() {
  const [restriction, setRestriction] = useState(initialRestriction);
  const [selected, setSelected] = useState(jobs[0]);
  const decision = evaluate(selected, restriction);
  return <main>
    <header><div><span className="eyebrow">DISPATCH PREFLIGHT</span><h1>Check tomorrow’s jobs before the crew rolls.</h1><p className="sub">Extract facts from city notices. Approve them. Run a deterministic preflight check.</p></div><span className="status">DEMO DATA · SYNTHETIC</span></header>
    <section className="steps"><div className="step active"><b>01</b><span>Extract</span></div><div className="line"/><div className={`step ${restriction.approved ? 'active' : ''}`}><b>02</b><span>Approve</span></div><div className="line"/><div className={`step ${restriction.approved ? 'active' : ''}`}><b>03</b><span>Execute</span></div></section>
    <div className="grid">
      <section className="card source"><div className="cardhead"><div><span className="label">SOURCE NOTICE</span><h2>Municipal bulletin</h2></div><span className="tag">Synthetic</span></div><pre>{notice}</pre><p className="caption">The extracted facts remain beside their source. The system does not infer missing details.</p></section>
      <section className="card"><div className="cardhead"><div><span className="label">EXTRACTED FACTS</span><h2>Review before use</h2></div><span className={restriction.approved ? 'approved tag' : 'pending tag'}>{restriction.approved ? 'Approved' : 'Needs approval'}</span></div><div className="facts"><Fact label="Street segment" value="Cedar Ave"/><Fact label="Cross street" value="Pine St"/><Fact label="Restriction window" value="Sep 18 · 9:00 AM–1:00 PM"/></div><button onClick={() => setRestriction({...restriction, approved: !restriction.approved})}>{restriction.approved ? 'Revoke approval' : 'Approve restriction'}</button><p className="caption">Only approved restrictions can affect evaluation.</p></section>
    </div>
    <section className="card jobs"><div className="cardhead"><div><span className="label">EXECUTE</span><h2>Today’s scheduled jobs</h2></div><span className="rule">Deterministic TypeScript rule</span></div><div className="joblist">{jobs.map(job => <button className={`job ${selected.id === job.id ? 'selected' : ''}`} onClick={() => setSelected(job)} key={job.id}><span><strong>{job.id}</strong><small>{job.address} · {job.startsAt.slice(11)}–{job.endsAt.slice(11)}</small></span><span className="arrow">›</span></button>)}</div><div className={`result ${decision.toLowerCase().replaceAll(' ', '-')}`}><span className="resultlabel">PREFLIGHT RESULT</span><strong>{decision}</strong><p>{!restriction.approved ? 'Approve the extracted restriction to run the check.' : decision === 'Cannot determine' ? 'The address is not in the declared test mapping. Manual review required.' : decision === 'Potential overlap' ? 'The mapped street and time windows overlap. Review this job before dispatch.' : 'No declared street or time-window overlap was found.'}</p></div></section>
    <footer>Declared mappings only · No routing · No legal parking advice · No invented addresses</footer>
  </main>;
}
function Fact({label, value}: {label: string; value: string}) { return <div className="fact"><span>{label}</span><strong>{value}</strong></div> }
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
