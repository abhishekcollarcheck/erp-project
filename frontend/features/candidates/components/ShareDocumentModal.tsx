'use client';
import { useEffect, useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { useShareDocument } from '../hooks/useCandidates';
import { DOC_CATEGORIES, type Candidate } from '../types/candidate.types';

interface Props {
  open:      boolean;
  onClose:   () => void;
  candidate: Candidate | null;
}

export function ShareDocumentModal({ open, onClose, candidate }: Props) {
  const shareMutation = useShareDocument(candidate?.id ?? 0);

  const [kind, setKind]         = useState<'Share' | 'Request'>('Share');
  const [title, setTitle]       = useState('');
  const [category, setCategory] = useState<string>('Job Description');
  const [note, setNote]         = useState('');
  const [file, setFile]         = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      setKind('Share'); setTitle(''); setCategory('Job Description'); setNote(''); setFile(null);
    }
  }, [open]);

  const submit = async () => {
    if (!title.trim()) return;
    const form = new FormData();
    form.append('kind', kind);
    form.append('title', title.trim());
    if (category) form.append('category', category);
    if (note.trim()) form.append('note', note.trim());
    if (kind === 'Share' && file) form.append('file', file);
    await shareMutation.mutateAsync(form);
    onClose();
  };

  const isBusy = shareMutation.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Share a Document"
      subtitle={`Send a file to, or request a document from, ${candidate?.candidate_name ?? 'the candidate'}`}
      width={500}
      footer={
        <>
          <button className="btn btn-sec" onClick={onClose} disabled={isBusy}>Cancel</button>
          <button className="btn btn-pri" onClick={submit} disabled={isBusy || !title.trim()}>
            {isBusy ? 'Sharing…' : kind === 'Share' ? 'Share with candidate' : 'Request from candidate'}
          </button>
        </>
      }
    >
      <div className="fg">
        <label>Type</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['Share', 'Request'] as const).map(k => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              style={{
                flex: 1, padding: '8px 10px', borderRadius: 'var(--r)', fontSize: 12, cursor: 'pointer',
                border: `1px solid ${kind === k ? 'var(--blue)' : 'var(--border2)'}`,
                background: kind === k ? 'var(--blue-lt)' : 'var(--surface)',
                color: kind === k ? 'var(--blue)' : 'var(--ink3)',
                fontWeight: kind === k ? 700 : 500,
              }}
            >
              {k === 'Share' ? 'Share a file' : 'Request from candidate'}
            </button>
          ))}
        </div>
      </div>

      <div className="fg">
        <label>Title *</label>
        <input
          placeholder={kind === 'Share' ? 'e.g. Job Description — Senior Designer' : 'e.g. Aadhaar / ID Proof'}
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      <div className="fg">
        <label>Category</label>
        <select value={category} onChange={e => setCategory(e.target.value)}>
          {DOC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {kind === 'Share' && (
        <div className="fg">
          <label>File <span style={{ color: 'var(--ink4)', fontWeight: 400 }}>(PDF / DOC / image — optional)</span></label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx,.xls"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
      )}

      <div className="fg">
        <label>Note <span style={{ color: 'var(--ink4)', fontWeight: 400 }}>(optional)</span></label>
        <textarea
          rows={2}
          placeholder={kind === 'Share' ? 'Anything the candidate should know…' : 'What exactly do you need from the candidate?'}
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </div>
    </Modal>
  );
}
