'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { Building2, Upload } from 'lucide-react';
import { Chip } from '@/components/ui/Chip';
import apiClient from '@/services/api/client';
import { showToast } from '@/utils/toast';
import {
  useCompanies,
  useCompany,
  useCreateCompany,
  useUpdateCompany,
  useSuspendCompany,
  useActivateCompany,
  useUploadLogo,
} from '@/features/companies/hooks/useCompanies';
import type { CompanyFormDto } from '@/services/api/company.service';

// Same preset set as Settings → Companies → [company] → Theme, so both
// entry points to "set a company's theme" look and behave identically.
const THEME_PRESETS = [
  { label: 'Blue', color: '#1e56d9' },
  { label: 'Purple', color: '#7c3aed' },
  { label: 'Green', color: '#0d9669' },
  { label: 'Red', color: '#cc2a2a' },
  { label: 'Orange', color: '#c96f00' },
  { label: 'Teal', color: '#0d8a7e' },
];

const EMPTY_FORM: CompanyFormDto = {
  name: '',
  slug: '',
  legal_name: '',
  tagline: '',
  code: '',
  since_year: undefined,
  gstin: '',
  pan: '',
  cin: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  industry: '',
  google_maps_link: '',
  phone: '',
  email: '',
  hr_email: '',
  website: '',
  about: '',
  logo_url: '',
  notes: '',
  fiscal_year: 'Apr-Mar',
  employee_code_start: '',
  employee_code_end: '',
  employee_code_skip: '',
};

/** "[3,7,12]" (what the API stores) <-> "3, 7, 12" (what's easiest to type). */
function skipCodesToText(json: string | null | undefined): string {
  if (!json) return '';
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.join(', ') : '';
  } catch {
    return '';
  }
}
function skipTextToCodes(text: string): string {
  const codes = text
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((v) => !Number.isNaN(v));
  return JSON.stringify(codes);
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

export default function CompanyPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<CompanyFormDto>(EMPTY_FORM);
  const [statusDraft, setStatusDraft] = useState<'active' | 'suspended'>('active');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [themeColor, setThemeColor] = useState('#1e56d9');
  const [themeDirty, setThemeDirty] = useState(false);

  const { data: companies, isLoading: listLoading } = useCompanies({ search: search || undefined, limit: 100 });
  const { data: selectedCompany } = useCompany(selectedId);

  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const suspendCompany = useSuspendCompany();
  const activateCompany = useActivateCompany();
  const uploadLogo = useUploadLogo();

  // Same endpoint/behavior as Settings → Companies → [company] → Theme:
  // a dedicated PUT, separate from the main company update payload, with an
  // immediate CSS-variable preview.
  const themeMut = useMutation({
    mutationFn: () => apiClient.put<any, any>(`/companies/${selectedId}/theme`, { theme_color: themeColor }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      setThemeDirty(false);
      showToast('✓ Theme updated');
    },
    onError: (e: any) => showToast(e?.message || 'Failed to update theme'),
  });

  function handleThemeSelect(color: string) {
    setThemeColor(color);
    setThemeDirty(true);
    document.documentElement.style.setProperty('--blue', color);
  }

  const isEdit = selectedId !== null;
  const saving = createCompany.isPending || updateCompany.isPending;

  // Sync the form when a company is selected / its data arrives
  useEffect(() => {
    if (isEdit && selectedCompany) {
      setForm({
        name: selectedCompany.name ?? '',
        slug: selectedCompany.slug ?? '',
        legal_name: selectedCompany.legal_name ?? '',
        tagline: selectedCompany.tagline ?? '',
        code: selectedCompany.code ?? '',
        since_year: selectedCompany.since_year ?? undefined,
        gstin: selectedCompany.gstin ?? '',
        pan: selectedCompany.pan ?? '',
        cin: selectedCompany.cin ?? '',
        address: selectedCompany.address ?? '',
        city: selectedCompany.city ?? '',
        state: selectedCompany.state ?? '',
        pincode: selectedCompany.pincode ?? '',
        country: selectedCompany.country ?? 'India',
        industry: selectedCompany.industry ?? '',
        google_maps_link: selectedCompany.google_maps_link ?? '',
        phone: selectedCompany.phone ?? '',
        email: selectedCompany.email ?? '',
        hr_email: selectedCompany.hr_email ?? '',
        website: selectedCompany.website ?? '',
        about: selectedCompany.about ?? '',
        logo_url: selectedCompany.logo_url ?? '',
        notes: selectedCompany.notes ?? '',
        fiscal_year: selectedCompany.fiscal_year ?? 'Apr-Mar',
        employee_code_start: selectedCompany.employee_code_start ?? '',
        employee_code_end: selectedCompany.employee_code_end ?? '',
        employee_code_skip: skipCodesToText(selectedCompany.employee_code_skip),
      });
      setStatusDraft(selectedCompany.is_active ? 'active' : 'suspended');
      setLogoPreview(selectedCompany.logo_url ?? null);
      setLogoFile(null);
      setThemeColor((selectedCompany as any).theme_color || '#1e56d9');
      setThemeDirty(false);
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
    setThemeColor('#1e56d9');
    setThemeDirty(false);
  }

  function handleLogoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    // Actual upload happens in handleSave, once we know the company id
    // (existing id for edit, or the id returned by create for a new company).
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
      employee_code_start: form.employee_code_start || null,
      employee_code_end: form.employee_code_end || null,
      employee_code_skip: skipTextToCodes(form.employee_code_skip ?? ''),
    };

    let companyId: number | null = null;

    if (isEdit && selectedId) {
      await updateCompany.mutateAsync({ id: selectedId, data: payload });
      companyId = selectedId;

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
      if (newId) {
        setSelectedId(newId);
        companyId = newId;
      }
    }

    if (companyId && logoFile) {
      await uploadLogo.mutateAsync({ id: companyId, file: logoFile });
      setLogoFile(null);
    }
  }

  return (
    <AppShell>
      <MasterDataLayout>
        <div className="md-shell">
          {/* ── Company list (left) ─────────────────────────────────────── */}
          <aside className="md-side">
            <div className="md-side-search" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="search-bar" style={{ flex: 1 }}>
                <span style={{ color: 'var(--ink4)' }}>⌕</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search companies..."
                />
              </div>
              <Chip variant="gray">{filteredCompanies.length}</Chip>
            </div>

            <div className="md-nav hide-scrollbar">
              <button type="button" className="btn btn-sec btn-sm" style={{ width: '100%', marginBottom: 8, justifyContent: 'center' }} onClick={resetToNew}>
                + New company
              </button>

              {listLoading ? (
                <div style={{ padding: 10, fontSize: 12, color: 'var(--ink4)' }}>Loading…</div>
              ) : filteredCompanies.length === 0 ? (
                <div style={{ padding: 10, fontSize: 12, color: 'var(--ink4)' }}>No companies found.</div>
              ) : (
                filteredCompanies.map((c) => {
                  const active = c.id === selectedId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className={`ni${active ? ' on' : ''}`}
                      style={{ width: '100%', height: 'auto', padding: '7px 9px', margin: '0 0 2px' }}
                    >
                      {c.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.logo_url} alt={c.name} style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <span style={{
                          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                          background: active ? 'rgba(255,255,255,.2)' : 'var(--blue-lt)',
                          color: active ? '#fff' : 'var(--blue)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700,
                        }}>
                          {initials(c.name) || <Building2 size={14} />}
                        </span>
                      )}
                      <span style={{ minWidth: 0, textAlign: 'left' }}>
                        <span
                          className="ni-lb"
                          style={{
                            display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            color: active ? undefined : 'var(--ink2)',
                          }}
                        >
                          {c.name}
                        </span>
                        <span style={{
                          display: 'block', fontSize: 10.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          color: active ? 'var(--blue)' : 'var(--ink3)',
                        }}>
                          {[c.code, c.gstin ? `GST ${c.gstin.slice(0, 10)}…` : null].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* ── Form (right) ────────────────────────────────────────────── */}
          <div className="md-main">
            <div className="ph">
              <div>
                <h1>{isEdit ? selectedCompany?.name || 'Edit company' : 'New company'}</h1>
              </div>
              <div className="ph-r">
                <button type="button" className="btn btn-ghost btn-sm" onClick={resetToNew}>Close</button>
              </div>
            </div>

            <div className="card cp">
              <div className="fg">
                <label>Company Name <span className="req-mark">*</span></label>
                <input placeholder="e.g. Narula Exports" value={form.name} onChange={(e) => handleField('name', e.target.value)} />
              </div>

              <div className="fg">
                <label>Legal Name</label>
                <input placeholder="Registered legal name" value={form.legal_name} onChange={(e) => handleField('legal_name', e.target.value)} />
              </div>

              <div className="fg">
                <label>Tagline</label>
                <input placeholder="Short one-line positioning" value={form.tagline} onChange={(e) => handleField('tagline', e.target.value)} />
              </div>

              <div className="g3">
                <div className="fg">
                  <label>Short Code</label>
                  <input placeholder="e.g. NE" value={form.code} onChange={(e) => handleField('code', e.target.value)} />
                </div>
                <div className="fg">
                  <label>Slug</label>
                  <input placeholder="auto-generated from name if left blank" value={form.slug} onChange={(e) => handleField('slug', e.target.value)} />
                </div>
                <div className="fg">
                  <label>Since (Year)</label>
                  <input
                    type="number"
                    placeholder="e.g. 2010"
                    value={form.since_year ?? ''}
                    onChange={(e) => handleField('since_year', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>

              <div className="g3">
                <div className="fg">
                  <label>Status</label>
                  <select
                    value={statusDraft}
                    onChange={(e) => setStatusDraft(e.target.value as 'active' | 'suspended')}
                    disabled={!isEdit}
                    title={!isEdit ? 'Save the company first to change status' : undefined}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div className="fg">
                  <label>Industry</label>
                  <input placeholder="e.g. Export / Trading" value={form.industry} onChange={(e) => handleField('industry', e.target.value)} />
                </div>
                <div className="fg">
                  <label>Fiscal Year</label>
                  <input placeholder="Apr-Mar" value={form.fiscal_year} onChange={(e) => handleField('fiscal_year', e.target.value)} />
                </div>
              </div>

              <div className="g3">
                <div className="fg">
                  <label>GST Number <span className="req-mark">*</span></label>
                  <input placeholder="22AAAAA0000A1Z5" value={form.gstin} onChange={(e) => handleField('gstin', e.target.value)} />
                </div>
                <div className="fg">
                  <label>PAN</label>
                  <input placeholder="AAAAA0000A" value={form.pan} onChange={(e) => handleField('pan', e.target.value)} />
                </div>
                <div className="fg">
                  <label>CIN</label>
                  <input placeholder="U12345DL2010PTC000000" value={form.cin} onChange={(e) => handleField('cin', e.target.value)} />
                </div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>Address</div>
              <div className="fg">
                <label>Registered Address <span className="req-mark">*</span></label>
                <textarea placeholder="Full registered / office address" value={form.address} onChange={(e) => handleField('address', e.target.value)} />
              </div>

              <div className="g3">
                <div className="fg">
                  <label>City</label>
                  <input placeholder="e.g. New Delhi" value={form.city} onChange={(e) => handleField('city', e.target.value)} />
                </div>
                <div className="fg">
                  <label>State</label>
                  <input placeholder="e.g. Delhi" value={form.state} onChange={(e) => handleField('state', e.target.value)} />
                </div>
                <div className="fg">
                  <label>Pincode</label>
                  <input placeholder="110026" value={form.pincode} onChange={(e) => handleField('pincode', e.target.value)} />
                </div>
              </div>

              <div className="g3">
                <div className="fg">
                  <label>Country</label>
                  <input placeholder="India" value={form.country} onChange={(e) => handleField('country', e.target.value)} />
                </div>
                <div className="fg" style={{ gridColumn: 'span 2' }}>
                  <label>Google Maps Link</label>
                  <input placeholder="https://maps.google.com/..." value={form.google_maps_link} onChange={(e) => handleField('google_maps_link', e.target.value)} />
                </div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>Contact</div>
              <div className="g3">
                <div className="fg">
                  <label>Phone</label>
                  <input placeholder="+91 ..." value={form.phone} onChange={(e) => handleField('phone', e.target.value)} />
                </div>
                <div className="fg">
                  <label>Email</label>
                  <input placeholder="info@company.com" value={form.email} onChange={(e) => handleField('email', e.target.value)} />
                </div>
                <div className="fg">
                  <label>HR Email</label>
                  <input placeholder="hr@company.com" value={form.hr_email} onChange={(e) => handleField('hr_email', e.target.value)} />
                </div>
              </div>

              <div className="fg" style={{ maxWidth: 320 }}>
                <label>Website</label>
                <input placeholder="https://..." value={form.website} onChange={(e) => handleField('website', e.target.value)} />
              </div>

              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>Employee Code Range</div>
              <div className="g3">
                <div className="fg">
                  <label>Start</label>
                  <input placeholder="e.g. 1" value={form.employee_code_start ?? ''} onChange={(e) => handleField('employee_code_start', e.target.value)} />
                </div>
                <div className="fg">
                  <label>End</label>
                  <input placeholder="e.g. 9999" value={form.employee_code_end ?? ''} onChange={(e) => handleField('employee_code_end', e.target.value)} />
                </div>
                <div className="fg">
                  <label>Reserved / Skip Codes</label>
                  <input placeholder="e.g. 13, 786" value={form.employee_code_skip} onChange={(e) => handleField('employee_code_skip', e.target.value)} />
                </div>
              </div>
              <p style={{ fontSize: 11, color: 'var(--ink4)', marginTop: -10 }}>Comma-separated numbers within the range above to reserve/exclude from auto-assignment.</p>

              <div className="fg">
                <label>Notes</label>
                <textarea placeholder="Internal notes about this company (not shown on the portal)" value={form.notes} onChange={(e) => handleField('notes', e.target.value)} />
              </div>

              <div className="fg">
                <label>About</label>
                <textarea placeholder="Short company description for letters, portal & onboarding" value={form.about} onChange={(e) => handleField('about', e.target.value)} />
              </div>

              <div className="fg">
                <label>Logo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label className="btn btn-sec btn-sm" style={{ cursor: 'pointer' }}>
                    <Upload size={13} />
                    Upload Logo
                    <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={handleLogoPick} />
                  </label>
                  {logoPreview && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={clearLogo}>Clear</button>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--ink4)' }}>PNG / JPG / WebP · under 800 KB</span>
                  {logoPreview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="Logo preview" style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', objectFit: 'cover' }} />
                  )}
                </div>
              </div>

              <div className="modal-ft" style={{ marginTop: 8 }}>
                <button type="button" className="btn btn-sec btn-sm" onClick={resetToNew}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-pri btn-sm"
                  disabled={saving || !form.name.trim() || !form.gstin.trim() || !form.address.trim()}
                  onClick={handleSave}
                >
                  {saving ? 'Saving…' : 'Save company'}
                </button>
              </div>
            </div>

            {/* ── Theme Color — same feature as Settings → Companies → [company] → Theme ── */}
            {isEdit && (
              <div className="card cp mb14" style={{ marginTop: 14 }}>
                <div className="ct" style={{ marginBottom: 4 }}>Theme Color</div>
                <p style={{ fontSize: 12, color: 'var(--ink4)', marginBottom: 14 }}>
                  Applied as the primary color across this company&apos;s employee portal.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {THEME_PRESETS.map((p) => (
                    <div
                      key={p.color}
                      onClick={() => handleThemeSelect(p.color)}
                      title={p.label}
                      style={{
                        width: 32, height: 32, borderRadius: '50%', background: p.color, cursor: 'pointer',
                        border: themeColor === p.color ? '3px solid var(--ink)' : '3px solid transparent',
                        transform: themeColor === p.color ? 'scale(1.2)' : 'scale(1)',
                        transition: 'all .12s',
                        boxShadow: themeColor === p.color ? '0 0 0 1px var(--ink)' : 'none',
                      }}
                    />
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--r)', background: themeColor, border: '1px solid var(--border)', flexShrink: 0 }} />
                  <div className="fg" style={{ marginBottom: 0, flex: 1, maxWidth: 220 }}>
                    <input
                      type="text"
                      value={themeColor}
                      onChange={(e) => {
                        setThemeColor(e.target.value);
                        setThemeDirty(true);
                        if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                          document.documentElement.style.setProperty('--blue', e.target.value);
                        }
                      }}
                      placeholder="#1e56d9"
                      style={{ fontFamily: 'var(--mono)' }}
                    />
                  </div>
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => handleThemeSelect(e.target.value)}
                    style={{ width: 36, height: 36, border: '1px solid var(--border)', borderRadius: 'var(--r)', cursor: 'pointer', padding: 2 }}
                  />
                </div>

                {themeDirty && (
                  <button type="button" className="btn btn-pri btn-sm" disabled={themeMut.isPending} onClick={() => themeMut.mutate()}>
                    {themeMut.isPending ? 'Saving…' : '✓ Save Theme'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </MasterDataLayout>
    </AppShell>
  );
}
