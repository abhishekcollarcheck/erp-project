'use client';
import { useEffect, useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { useMoveStatus } from '../hooks/useCandidates';
import {
  ALL_STATUSES, OUTCOME_STATUSES, STATUS_COLORS, STATUS_LABEL, STATUS_ORDER, TERMINAL_STATUSES,
  type CandidateStatus, type Candidate,
} from '../types/candidate.types';

interface Props {
  open: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  /** Pre-select a stage when the modal opens (e.g. a dedicated "Reject" action). */
  preselect?: CandidateStatus;
  /** Retained for callers; no longer triggered (Interview_Result stage was removed). */
  onInterviewResult?: () => void;
}

export function StatusMoveModal({ open, onClose, candidate, preselect }: Props) {
  const [selectedStatus, setSelectedStatus] = useState<CandidateStatus | ''>('');
  const [remarks, setRemarks] = useState('');
  const moveMutation = useMoveStatus();

  useEffect(() => {
    if (open) {
      setSelectedStatus(preselect ?? '');
      setRemarks('');
    }
  }, [open, preselect]);

  const handleMove = async () => {
    if (!candidate || !selectedStatus) return;
    await moveMutation.mutateAsync({ id: candidate.id, status: selectedStatus, remarks: remarks || undefined });
    setSelectedStatus('');
    setRemarks('');
    onClose();
  };

  const currentStatus = candidate?.status;
  const isOutcome = selectedStatus && OUTCOME_STATUSES.includes(selectedStatus);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Move Stage"
      subtitle={candidate ? `Update pipeline stage for ${candidate.candidate_name}` : ''}
      width={460}
      footer={
        <>
          <button className="btn btn-sec" onClick={onClose}>Cancel</button>
          <button
            className={`btn ${isOutcome && selectedStatus !== 'On_Hold' ? 'btn-danger' : 'btn-pri'}`}
            onClick={handleMove}
            disabled={!selectedStatus || moveMutation.isPending}
          >
            {moveMutation.isPending ? 'Moving…' : '→ Move'}
          </button>
        </>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}>
          Select new stage
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {ALL_STATUSES.map(s => {
            const c = STATUS_COLORS[s];
            const currentOrder = currentStatus ? STATUS_ORDER[currentStatus] : 0;
            const statusOrder = STATUS_ORDER[s];
            const isCurrent = s === currentStatus;
            const isPreviousStage = statusOrder < currentOrder && !OUTCOME_STATUSES.includes(s);
            const isTerminalCurrent =
              currentStatus && TERMINAL_STATUSES.includes(currentStatus);
            const disabled =
              isTerminalCurrent
                ? s !== currentStatus
                : isCurrent || isPreviousStage;
            const isSelected = s === selectedStatus;

            return (
              <button
                key={s}
                type="button"
                disabled={disabled}
                onClick={() => setSelectedStatus(s)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? .45 : 1,
                  fontFamily: 'var(--font)',
                  transition: 'all .1s',
                  border: `1px solid ${isSelected ? c.text : isCurrent ? 'var(--border)' : c.border}`,
                  background: isSelected ? c.text : isCurrent ? 'var(--surface2)' : c.bg,
                  color: isSelected ? '#fff' : isCurrent ? 'var(--ink4)' : c.text,
                }}
              >
                {
                  isCurrent
                    ? `${STATUS_LABEL[s]} (current)`
                    : isPreviousStage
                      ? `✓ ${STATUS_LABEL[s]}`
                      : STATUS_LABEL[s]
                }
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--ink4)', marginTop: 8 }}>
          Rejected, Withdrawn and On&nbsp;Hold can be set from any active stage.
        </div>
      </div>

      <div className="fg">
        <label>Remarks <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--ink4)' }}>— optional</span></label>
        <textarea
          rows={2}
          placeholder="Add notes about this stage change…"
          value={remarks}
          onChange={e => setRemarks(e.target.value)}
        />
      </div>
    </Modal>
  );
}
