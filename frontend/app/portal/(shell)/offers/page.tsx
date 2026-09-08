'use client';
import { usePortalProfile } from '../../../../features/candidates/hooks/usePortal';
import { formatDate } from '../../../../utils/formatters';

const BENEFITS = [
  { name: 'Health Insurance', detail: '₹3L cover' },
  { name: 'Leave', detail: '18 EL + 8 CL' },
  { name: 'Learning', detail: '₹30,000/yr budget' },
];

export default function PortalOffers() {
  const { data: c } = usePortalProfile();
  if (!c) return null;

  const hasOffer = !!(c.offered_ctc || c.offer_letter_url || c.status === 'Offered' || c.status === 'Hired');

  return (
    <>
      <h1 className="pc-h1">Offers &amp; Benefits</h1>
      <div className="pc-lead">Compensation breakdown &amp; benefits summary.</div>

      {hasOffer ? (
        <div className="pc-card">
          <div className="pc-ct">Your offer</div>
          <div className="pc-g2">
            <div><div className="pc-k">Offered CTC (monthly)</div><div className="pc-v">{c.offered_ctc ? `₹${Number(c.offered_ctc).toLocaleString('en-IN')}` : '—'}</div></div>
            <div><div className="pc-k">Joining date</div><div className="pc-v">{formatDate(c.confirmed_joining_date)}</div></div>
            <div><div className="pc-k">Offer valid till</div><div className="pc-v">{c.offer_valid_till ? formatDate(c.offer_valid_till) : '—'}</div></div>
            <div><div className="pc-k">Status</div><div className="pc-v">{c.status === 'Hired' ? 'Accepted' : c.offer_sent_at ? 'Awaiting your response' : 'Being prepared'}</div></div>
          </div>
          {c.offer_letter_url && (
            <div style={{ marginTop: 12 }}>
              <a href={c.offer_letter_url} target="_blank" rel="noopener noreferrer" className="pc-btn pc-btn-pri pc-btn-sm">📄 View offer letter</a>
            </div>
          )}
        </div>
      ) : (
        <div className="pc-empty">No offer yet — you&rsquo;ll be notified by email.</div>
      )}

      <div className="pc-card">
        <div className="pc-ct">Benefits Preview</div>
        {BENEFITS.map(b => (
          <div key={b.name} className="pc-row" style={{ alignItems: 'center' }}>
            <span style={{ color: '#15803d', fontWeight: 800, marginRight: 10 }}>✓</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{b.name}</div>
              <div className="pc-muted">{b.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
