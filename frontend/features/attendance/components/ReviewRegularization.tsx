'use client';
import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { useReviewRegularization } from '../hooks/useAttendance';
import type { RegularizationRequest } from '../../../services/api/attendance.service';

interface Props {
  request: RegularizationRequest | null;
  onClose: () => void;
}

export function ReviewRegularizationModal({ request, onClose }: Props) {
  const [remarks, setRemarks] = useState('');
  const reviewMutation = useReviewRegularization();

  const handleDecision = async (decision: 'Approved' | 'Rejected') => {
    if (!request) return;
    await reviewMutation.mutateAsync({ id: request.id, data: { decision, remarks: remarks || undefined } });
    setRemarks('');
    onClose();
  };

  const employeeName = request?.Employee
    ? `${request.Employee.first_name} ${request.Employee.last_name}`
    : `#${request?.employee_id}`;

  return (
    <Modal
      open={!!request}
      onClose={onClose}
      title="Review Correction Request"
      subtitle={request ? `${employeeName} — ${request.date}` : ''}
      footer={
        <>
          <button className="btn btn-sec" onClick={onClose} disabled={reviewMutation.isPending}>Cancel</button>
          <button className="btn btn-danger" onClick={() => handleDecision('Rejected')} disabled={reviewMutation.isPending}>
            {reviewMutation.isPending ? 'Saving…' : 'Reject'}
          </button>
          <button className="btn btn-pri" onClick={() => handleDecision('Approved')} disabled={reviewMutation.isPending}>
            {reviewMutation.isPending ? 'Saving…' : '✓ Approve'}
          </button>
        </>
      }
    >
      {request && (
        <>
          <div style={{ display: 'flex', gap: 20, marginBottom: 12, fontSize: 12 }}>
            <div>
              <div style={{ color: 'var(--ink4)', fontSize: 10 }}>Requested Check-In</div>
              <div style={{ fontFamily: 'var(--mono)' }}>{request.requested_check_in ?? '—'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--ink4)', fontSize: 10 }}>Requested Check-Out</div>
              <div style={{ fontFamily: 'var(--mono)' }}>{request.requested_check_out ?? '—'}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, marginBottom: 14 }}>
            <div style={{ color: 'var(--ink4)', fontSize: 10, marginBottom: 2 }}>Reason</div>
            {request.reason}
          </div>
          <div className="fg">
            <label>Remarks (optional)</label>
            <textarea
              placeholder="Add a note for this decision…"
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </>
      )}
    </Modal>
  );
}