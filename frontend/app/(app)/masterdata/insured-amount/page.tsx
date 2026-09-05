'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { X, Plus } from 'lucide-react';
import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
import {
  useInsuredData,
  useCreateInsuredMaster,
  useUpdateInsuredMaster,
  useDeleteInsuredMaster,
  useCreateBracket,
  useUpdateBracket,
  useDeleteBracket,
} from '@/features/insuredAmounts/useInsuredAmount';

export default function InsuredAmountPage() {
  const [name, setName] = useState('');
  const [filterText, setFilterText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const { data } = useInsuredData();
  const masters = data?.masters || [];
  const brackets = data?.brackets || [];

  const createMaster = useCreateInsuredMaster();
  const updateMaster = useUpdateInsuredMaster();
  const deleteMaster = useDeleteInsuredMaster();
  const createBracket = useCreateBracket();
  const updateBracket = useUpdateBracket();
  const deleteBracket = useDeleteBracket();

  const handleAddMaster = async () => {
    if (!name.trim()) return;
    await createMaster.mutateAsync(name.trim());
    setName('');
  };

  const handleSaveEdit = async (id: number) => {
    if (editName.trim()) {
      await updateMaster.mutateAsync({ id, name: editName.trim() });
    }
    setEditingId(null);
  };

  const handleAddBracketRow = async () => {
    if (masters.length === 0) {
      alert('Please add at least one Insured Amount chip first');
      return;
    }
    const lastBracket = brackets[brackets.length - 1];
    const newMin = lastBracket ? Number(lastBracket.max_salary || 0) : 0;
    await createBracket.mutateAsync({
      min_salary: newMin,
      max_salary: null,
      insured_amount_id: masters[0].id,
    });
  };

  const formatCurrency = (val: number | null) => {
    if (val === null) return '';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const generateRuleText = (min: number, max: number | null, amountName: string) => {
    const formattedMin = formatCurrency(min);
    const cleanAmount = amountName.replace(/,/g, '');
    const formattedAmount = !isNaN(Number(cleanAmount))
      ? formatCurrency(Number(cleanAmount))
      : `₹${amountName}`;

    if (min === 0 && max !== null) {
      return `Under ${formatCurrency(max)} → ${formattedAmount}`;
    }
    if (max === null) {
      return `${formattedMin} and above → ${formattedAmount}`;
    }
    return `${formattedMin} – under ${formatCurrency(max)} → ${formattedAmount}`;
  };

  const filteredMasters = useMemo(() => {
    return masters.filter((m) =>
      m.name.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [masters, filterText]);

  return (
    <AppShell>
      <MasterDataLayout>
        <SimpleMasterList
          title="Insured Amount"
          subtitle="Insured covers by salary bracket - Auto-fills on Add Employee from Gross (PM)"
          addPlaceholder="Add insured amount..."
          items={filteredMasters}
          name={name}
          onNameChange={setName}
          onAdd={handleAddMaster}
          filterText={filterText}
          onFilterChange={setFilterText}
          editingId={editingId}
          editName={editName}
          onEditNameChange={setEditName}
          onStartEdit={(item) => {
            setEditingId(item.id);
            setEditName(item.name);
          }}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={() => setEditingId(null)}
          onDelete={(id) => deleteMaster.mutate(id)}
          extraBeforeList={
            <div className="card cp" style={{ background: 'var(--surface2)', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div className="ct" style={{ marginBottom: 2 }}>Salary brackets → Insured amount</div>
                  <p style={{ fontSize: 11, color: 'var(--ink4)', margin: 0 }}>
                    Gross monthly salary (₹). Range is min inclusive → max exclusive (blank max = no upper limit).
                  </p>
                </div>
                <button type="button" className="btn btn-sec btn-sm" onClick={handleAddBracketRow}>
                  <Plus size={12} /> Bracket
                </button>
              </div>

              <div className="tw" style={{ marginTop: 10 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Min ₹</th>
                      <th>Max ₹</th>
                      <th>Insured Amount</th>
                      <th>Rule</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brackets.map((row) => {
                      const selectedMaster = masters.find((m) => m.id === row.insured_amount_id);
                      const amountName = selectedMaster ? selectedMaster.name : '';

                      return (
                        <BracketRowItem
                          key={row.id}
                          row={row}
                          masters={masters}
                          amountName={amountName}
                          onUpdate={(id, payload) => updateBracket.mutate({ id, payload })}
                          onDelete={(id) => deleteBracket.mutate(id)}
                          generateRuleText={generateRuleText}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          }
        />
      </MasterDataLayout>
    </AppShell>
  );
}

// Editable Sub-component for individual Bracket Row
function BracketRowItem({
  row,
  masters,
  amountName,
  onUpdate,
  onDelete,
  generateRuleText,
}: {
  row: any;
  masters: any[];
  amountName: string;
  onUpdate: (id: number, payload: any) => void;
  onDelete: (id: number) => void;
  generateRuleText: (min: number, max: number | null, amountName: string) => string;
}) {
  const [minSalary, setMinSalary] = useState<string>(String(row.min_salary ?? 0));
  const [maxSalary, setMaxSalary] = useState<string>(
    row.max_salary === null ? 'No limit' : String(row.max_salary)
  );

  const handleMinBlur = () => {
    const parsedMin = Number(minSalary) || 0;
    setMinSalary(String(parsedMin));
    onUpdate(row.id, { min_salary: parsedMin });
  };

  const handleMaxBlur = () => {
    const val = maxSalary.trim().toLowerCase();
    if (val === '' || val === 'no limit') {
      setMaxSalary('No limit');
      onUpdate(row.id, { max_salary: null });
    } else {
      const parsedMax = Number(val);
      if (!isNaN(parsedMax)) {
        setMaxSalary(String(parsedMax));
        onUpdate(row.id, { max_salary: parsedMax });
      } else {
        setMaxSalary('No limit');
        onUpdate(row.id, { max_salary: null });
      }
    }
  };

  return (
    <tr>
      <td style={{ minWidth: 90 }}>
        <div className="fg" style={{ margin: 0 }}>
          <input type="number" value={minSalary} onChange={(e) => setMinSalary(e.target.value)} onBlur={handleMinBlur} />
        </div>
      </td>
      <td style={{ minWidth: 90 }}>
        <div className="fg" style={{ margin: 0 }}>
          <input type="text" value={maxSalary} onChange={(e) => setMaxSalary(e.target.value)} onBlur={handleMaxBlur} placeholder="No limit" />
        </div>
      </td>
      <td style={{ minWidth: 140 }}>
        <div className="fg" style={{ margin: 0 }}>
          <select
            value={row.insured_amount_id}
            onChange={(e) => onUpdate(row.id, { insured_amount_id: Number(e.target.value) })}
          >
            {masters.map((m) => (
              <option key={m.id} value={m.id}>₹{m.name}</option>
            ))}
          </select>
        </div>
      </td>
      <td style={{ color: 'var(--ink4)' }}>
        {generateRuleText(
          Number(minSalary) || 0,
          maxSalary === 'No limit' ? null : Number(maxSalary),
          amountName
        )}
      </td>
      <td style={{ textAlign: 'right' }}>
        <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => onDelete(row.id)}>
          <X size={14} />
        </button>
      </td>
    </tr>
  );
}
