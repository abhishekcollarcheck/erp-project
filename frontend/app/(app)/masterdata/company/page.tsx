'use client';

import { useEffect, useMemo, useState } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { Building2, Upload } from 'lucide-react';
import {
  useCompanies,
  useCompany,
  useCreateCompany,
  useUpdateCompany,
  useSuspendCompany,
  useActivateCompany,
} from '@/features/companies/hooks/useCompanies';
import type { CompanyFormDto } from '@/services/api/company.service';

// NOTE on paths: adjust the '@/...' aliases above to match your actual
// tsconfig paths / relative depth from app/(app)/masterdata/company/page.tsx
// — I've used the same '@/' alias style your MasterDataLayout import already
// uses in the boilerplate you pasted, since that file lives one level away
// from this page (app/(app)/masterdata/layout.tsx).

const EMPTY_FORM: CompanyFormDto = {
  name: '',
  legal_name: '',
  tagline: '',
  code: '',
  since_year: undefined,
  gstin: '',
  pan: '',
  cin: '',
  address: '',
  google_maps_link: '',
  phone: '',
  email: '',
  hr_email: '',
  website: '',
  about: '',
  logo_url: '',
};

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

export default function CompanyPage() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<CompanyFormDto>(EMPTY_FORM);
  const [statusDraft, setStatusDraft] = useState<'active' | 'suspended'>('active');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const { data: companies, isLoading: listLoading } = useCompanies({ search: search || undefined, limit: 100 });
  const { data: selectedCompany } = useCompany(selectedId);

  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const suspendCompany = useSuspendCompany();
  const activateCompany = useActivateCompany();

  const isEdit = selectedId !== null;
  const saving = createCompany.isPending || updateCompany.isPending;

  // Sync the form when a company is selected / its data arrives
  useEffect(() => {
    if (isEdit && selectedCompany) {
      setForm({
        name: selectedCompany.name ?? '',
        legal_name: selectedCompany.legal_name ?? '',
        tagline: selectedCompany.tagline ?? '',
        code: selectedCompany.code ?? '',
        since_year: selectedCompany.since_year ?? undefined,
        gstin: selectedCompany.gstin ?? '',
        pan: selectedCompany.pan ?? '',
        cin: selectedCompany.cin ?? '',
        address: selectedCompany.address ?? '',
        google_maps_link: selectedCompany.google_maps_link ?? '',
        phone: selectedCompany.phone ?? '',
        email: selectedCompany.email ?? '',
        hr_email: selectedCompany.hr_email ?? '',
        website: selectedCompany.website ?? '',
        about: selectedCompany.about ?? '',
        logo_url: selectedCompany.logo_url ?? '',
      });
      setStatusDraft(selectedCompany.is_active ? 'active' : 'suspended');
      setLogoPreview(selectedCompany.logo_url ?? null);
      setLogoFile(null);
    }
  }, [isEdit, selectedCompany]);

  const filteredCompanies = useMemo(() => companies ?? [], [companies]);

  function handleField<K extends keyof CompanyFormDto>(key: K, value: CompanyFormDto[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function resetToNew() {
    setSelectedId(null);
    setForm(EMPTY_FORM);
    setStatusDraft('active');
    setLogoPreview(null);
    setLogoFile(null);
  }

  function handleLogoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    // NOTE: this only previews the file locally. Actual persistence needs
    // companyService.uploadLogo() wired to a real backend route — see the
    // comment on that method in company.service.ts.
  }

  function clearLogo() {
    setLogoFile(null);
    setLogoPreview(null);
    handleField('logo_url', '');
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    if (!form.gstin.trim()) return;
    if (!form.address.trim()) return;

    const payload: CompanyFormDto = {
      ...form,
      since_year: form.since_year ? Number(form.since_year) : undefined,
    };

    if (isEdit && selectedId) {
      await updateCompany.mutateAsync({ id: selectedId, data: payload });

      // Status dropdown is separate from the PUT body — driven by the
      // dedicated suspend/activate endpoints your controller exposes.
      const wasActive = selectedCompany?.is_active;
      const wantsActive = statusDraft === 'active';
      if (wasActive !== undefined && wasActive !== wantsActive) {
        if (wantsActive) await activateCompany.mutateAsync(selectedId);
        else await suspendCompany.mutateAsync(selectedId);
      }
    } else {
      const res = await createCompany.mutateAsync(payload);
      const newId = (res.data as any)?.id;
      if (newId) setSelectedId(newId);
    }
  }

  return (
    <AppShell>
      <MasterDataLayout>
        <div className="flex h-full min-h-0 w-full">
          {/* ── Company list (left) ─────────────────────────────────────── */}
          <aside className="flex w-[245px] shrink-0 flex-col border-r border-gray-200 bg-white">
            <div className="flex items-center gap-2 border-b border-gray-100 p-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search companies..."
                className="h-9 flex-1 rounded-md border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              />
              <span className="rounded bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-500">
                {filteredCompanies.length}
              </span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              <button
                onClick={resetToNew}
                className="mb-2 w-full rounded-md border border-dashed border-gray-300 px-2.5 py-2 text-left text-[12px] font-medium text-blue-600 hover:bg-blue-50"
              >
                + New company
              </button>

              {listLoading ? (
                <div className="p-3 text-xs text-gray-400">Loading…</div>
              ) : filteredCompanies.length === 0 ? (
                <div className="p-3 text-xs text-gray-400">No companies found.</div>
              ) : (
                <div className="space-y-1">
                  {filteredCompanies.map((c) => {
                    const active = c.id === selectedId;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        className={[
                          'flex w-full items-center gap-2.5 rounded-md border px-2.5 py-2 text-left transition-colors',
                          active
                            ? 'border-blue-200 bg-blue-50'
                            : 'border-transparent hover:bg-gray-50',
                        ].join(' ')}
                      >
                        {c.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.logo_url}
                            alt={c.name}
                            className="h-8 w-8 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[11px] font-semibold text-blue-600">
                            {initials(c.name) || <Building2 size={14} />}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-semibold text-gray-800">
                            {c.name}
                          </div>
                          <div className="truncate text-[11px] text-gray-400">
                            {[c.code, c.gstin ? `GST ${c.gstin.slice(0, 10)}…` : null]
                              .filter(Boolean)
                              .join(' · ')}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          {/* ── Form (right) ────────────────────────────────────────────── */}
          <div className="min-w-0 flex-1 overflow-y-auto bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-gray-800">
                {isEdit ? selectedCompany?.name || 'Edit company' : 'New company'}
              </h2>
              <button
                onClick={resetToNew}
                className="text-xs font-medium text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>

            <div className="max-w-3xl space-y-4">
              <Field label="Company Name" required>
                <input
                  className="in"
                  placeholder="e.g. Narula Exports"
                  value={form.name}
                  onChange={(e) => handleField('name', e.target.value)}
                />
              </Field>

              <Field label="Legal Name">
                <input
                  className="in"
                  placeholder="Registered legal name"
                  value={form.legal_name}
                  onChange={(e) => handleField('legal_name', e.target.value)}
                />
              </Field>

              <Field label="Tagline">
                <input
                  className="in"
                  placeholder="Short one-line positioning"
                  value={form.tagline}
                  onChange={(e) => handleField('tagline', e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-3 gap-4">
                <Field label="Short Code">
                  <input
                    className="in"
                    placeholder="e.g. NE"
                    value={form.code}
                    onChange={(e) => handleField('code', e.target.value)}
                  />
                </Field>
                <Field label="Since (Year)">
                  <input
                    className="in"
                    type="number"
                    placeholder="e.g. 2010"
                    value={form.since_year ?? ''}
                    onChange={(e) =>
                      handleField('since_year', e.target.value ? Number(e.target.value) : undefined)
                    }
                  />
                </Field>
                <Field label="Status">
                  <select
                    className="in"
                    value={statusDraft}
                    onChange={(e) => setStatusDraft(e.target.value as 'active' | 'suspended')}
                    disabled={!isEdit}
                    title={!isEdit ? 'Save the company first to change status' : undefined}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Field label="GST Number" required>
                  <input
                    className="in"
                    placeholder="22AAAAA0000A1Z5"
                    value={form.gstin}
                    onChange={(e) => handleField('gstin', e.target.value)}
                  />
                </Field>
                <Field label="PAN">
                  <input
                    className="in"
                    placeholder="AAAAA0000A"
                    value={form.pan}
                    onChange={(e) => handleField('pan', e.target.value)}
                  />
                </Field>
                <Field label="CIN">
                  <input
                    className="in"
                    placeholder="U12345DL2010PTC000000"
                    value={form.cin}
                    onChange={(e) => handleField('cin', e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Registered Address" required>
                <textarea
                  className="in min-h-[70px] resize-y"
                  placeholder="Full registered / office address"
                  value={form.address}
                  onChange={(e) => handleField('address', e.target.value)}
                />
              </Field>

              <Field label="Google Maps Link">
                <input
                  className="in"
                  placeholder="https://maps.google.com/..."
                  value={form.google_maps_link}
                  onChange={(e) => handleField('google_maps_link', e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-3 gap-4">
                <Field label="Phone">
                  <input
                    className="in"
                    placeholder="+91 ..."
                    value={form.phone}
                    onChange={(e) => handleField('phone', e.target.value)}
                  />
                </Field>
                <Field label="Email">
                  <input
                    className="in"
                    placeholder="info@company.com"
                    value={form.email}
                    onChange={(e) => handleField('email', e.target.value)}
                  />
                </Field>
                <Field label="HR Email">
                  <input
                    className="in"
                    placeholder="hr@company.com"
                    value={form.hr_email}
                    onChange={(e) => handleField('hr_email', e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Website">
                <input
                  className="in max-w-sm"
                  placeholder="https://..."
                  value={form.website}
                  onChange={(e) => handleField('website', e.target.value)}
                />
              </Field>

              <Field label="About">
                <textarea
                  className="in min-h-[70px] resize-y"
                  placeholder="Short company description for letters, portal & onboarding"
                  value={form.about}
                  onChange={(e) => handleField('about', e.target.value)}
                />
              </Field>

              <div>
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400">
                  Logo
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                    <Upload size={13} />
                    Upload Logo
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoPick} />
                  </label>
                  {logoPreview && (
                    <button onClick={clearLogo} className="text-xs font-medium text-gray-400 hover:text-gray-600">
                      Clear
                    </button>
                  )}
                  <span className="text-[11px] text-gray-400">PNG / JPG / WebP · under 800 KB</span>
                  {logoPreview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="Logo preview" className="h-8 w-8 rounded-md border border-gray-200 object-cover" />
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-5">
                <button
                  onClick={resetToNew}
                  className="rounded-md border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name.trim() || !form.gstin.trim() || !form.address.trim()}
                  className="rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save company'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Shared input styling for this page only */}
        <style jsx global>{`
          .in {
            width: 100%;
            height: 38px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 0 10px;
            font-size: 13px;
            color: #374151;
            outline: none;
            background: white;
          }
          textarea.in {
            height: auto;
            padding: 8px 10px;
          }
          .in:focus {
            border-color: #93c5fd;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          .in::placeholder {
            color: #9ca3af;
          }
        `}</style>
      </MasterDataLayout>
    </AppShell>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </div>
      {children}
    </div>
  );
}