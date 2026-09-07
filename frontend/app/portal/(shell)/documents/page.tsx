'use client';
import { useRef } from 'react';
import {
  usePortalDocuments, usePortalMarkDocument, usePortalSubmitAssignment,
} from '../../../../features/candidates/hooks/usePortal';
import { formatDate } from '../../../../utils/formatters';

export default function PortalDocuments() {
  const { data: documents = [] } = usePortalDocuments();
  const mark = usePortalMarkDocument();
  const submit = usePortalSubmitAssignment();
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  return (
    <>
      <h1 className="pc-h1">Shared Documents</h1>
      <div className="pc-lead">Job descriptions, policies, assignments &amp; HR uploads.</div>

      <div className="pc-card">
        {documents.length === 0 ? (
          <div className="pc-muted">No documents shared yet.</div>
        ) : documents.map(d => {
          const isNew = d.kind === 'Share' && d.status === 'Pending';
          const isReq = d.kind === 'Request';
          return (
            <div key={d.id} className="pc-row" style={{ alignItems: 'center' }}>
              <span style={{ fontSize: 20, marginRight: 12, flexShrink: 0 }}>📄</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {d.title}
                  {isNew && <span className="pc-badge-new">New</span>}
                  {isReq && d.status !== 'Completed' && <span className="pc-badge-new" style={{ background: '#eef3fd', color: '#1e56d9', borderColor: '#c7d9fb' }}>Requested</span>}
                </div>
                <div className="pc-muted">
                  {d.category || (isReq ? 'Requested by HR' : 'Document')}
                  {' · '}
                  {d.status === 'Completed' ? `Submitted ${d.responded_at ? formatDate(d.responded_at) : ''}`
                    : d.status === 'Read' ? 'Read'
                    : `Shared ${formatDate(d.shared_at)}`}
                </div>
              </div>
              <div style={{ flexShrink: 0 }}>
                {isReq && d.status !== 'Completed' ? (
                  <>
                    <input
                      ref={el => { fileRefs.current[d.id] = el; }}
                      type="file" style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) submit.mutate({ docId: d.id, file: f }); e.target.value = ''; }}
                    />
                    <button className="pc-btn pc-btn-pri pc-btn-sm" disabled={submit.isPending} onClick={() => fileRefs.current[d.id]?.click()}>
                      {submit.isPending ? 'Uploading…' : 'Submit'}
                    </button>
                  </>
                ) : d.file_url ? (
                  <a
                    href={d.file_url} target="_blank" rel="noopener noreferrer"
                    className="pc-btn pc-btn-sec pc-btn-sm"
                    onClick={() => { if (isNew) mark.mutate({ docId: d.id, action: 'read' }); }}
                  >
                    {d.kind === 'Share' ? '↓ Download' : 'View'}
                  </a>
                ) : isNew ? (
                  <button className="pc-btn pc-btn-sec pc-btn-sm" disabled={mark.isPending} onClick={() => mark.mutate({ docId: d.id, action: 'read' })}>
                    Mark as read
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pc-card" style={{ background: '#eef3fd', borderColor: '#c7d9fb', fontSize: 12, color: '#1e56d9' }}>
        After joining, all downloaded and uploaded documents migrate to <strong>Employee Self-Service → My Documents</strong>.
      </div>
    </>
  );
}
