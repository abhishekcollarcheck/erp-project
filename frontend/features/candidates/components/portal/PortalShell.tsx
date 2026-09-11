'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { usePortalProfile, usePortalDocuments } from '../../hooks/usePortal';
import type { CandidateStatus } from '../../types/candidate.types';

type NavItem = { code: string; label: string; href: string; badge?: 'docs' | 'preinterview' | 'joining' };

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: 'Your journey',
    items: [
      { code: 'H',  label: 'Home',               href: '/portal/home' },
      { code: 'P',  label: 'My progress',        href: '/portal/progress' },
      { code: 'IV', label: 'Interviews',         href: '/portal/interviews' },
      { code: 'PF', label: 'Pre-Interview Form', href: '/portal/pre-interview', badge: 'preinterview' },
      { code: 'OF', label: 'Offers',             href: '/portal/offers' },
      { code: 'JF', label: 'Joining Form',       href: '/portal/joining', badge: 'joining' },
      { code: 'D',  label: 'Documents',          href: '/portal/documents', badge: 'docs' },
    ],
  },
  {
    section: 'More',
    items: [
      { code: 'AS', label: 'Assessments',    href: '/portal/assessments' },
      { code: 'CO', label: 'Company & team', href: '/portal/company' },
      { code: '?',  label: 'Help / FAQ',     href: '/portal/faq' },
    ],
  },
];

function statusChip(status: CandidateStatus | undefined): { text: string; tone: 'grn' | 'amb' | 'gry' } {
  if (!status) return { text: '—', tone: 'gry' };
  if (status === 'Hired') return { text: 'Hired', tone: 'grn' };
  if (status === 'On_Hold') return { text: 'On hold', tone: 'amb' };
  if (status === 'Rejected' || status === 'Withdrawn') return { text: 'Closed', tone: 'gry' };
  return { text: 'In progress', tone: 'grn' };
}

const CSS = `
.pc-wrap{min-height:100vh;background:#eef1f5;display:flex;flex-direction:column;font-family:var(--font,system-ui,-apple-system,sans-serif);color:#0f1623;-webkit-font-smoothing:antialiased;}
.pc-wrap *{box-sizing:border-box;}
.pc-top{background:#fff;border-bottom:1px solid #e0e4ec;height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;position:sticky;top:0;z-index:50;}
.pc-brand{display:flex;align-items:center;gap:10px;}
.pc-logo{width:34px;height:34px;border-radius:9px;background:#1e56d9;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;}
.pc-brand b{font-size:14px;font-weight:800;display:block;line-height:1.1;}
.pc-brand span{font-size:10px;color:#94a3b8;}
.pc-top-r{display:flex;align-items:center;gap:12px;font-size:13px;}
.pc-chip{display:inline-flex;align-items:center;border-radius:99px;padding:3px 10px;font-size:11px;font-weight:700;border:1px solid;}
.pc-chip.grn{background:#ecfdf3;color:#067647;border-color:#a6f0c6;}
.pc-chip.amb{background:#fff8ed;color:#b93815;border-color:#f9dbaf;}
.pc-chip.gry{background:#f1f5f9;color:#475569;border-color:#e0e4ec;}
.pc-logout{background:none;border:none;color:#64748b;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;}
.pc-logout:hover{color:#0f1623;}
.pc-body{flex:1;display:flex;align-items:flex-start;}
.pc-side{width:232px;flex-shrink:0;background:#fff;border-right:1px solid #e0e4ec;min-height:calc(100vh - 60px);padding:18px 12px;position:sticky;top:60px;}
.pc-navsec{font-size:10px;font-weight:800;letter-spacing:.7px;text-transform:uppercase;color:#94a3b8;padding:0 10px;margin:14px 0 6px;}
.pc-navsec:first-child{margin-top:0;}
.pc-nav{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;font-size:13px;font-weight:600;color:#475569;text-decoration:none;margin-bottom:2px;transition:background .1s,color .1s;}
.pc-nav:hover{background:#f5f7fa;color:#0f1623;}
.pc-nav.on{background:#eef3fd;color:#1e56d9;}
.pc-nav-code{width:24px;height:22px;flex-shrink:0;border-radius:6px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:#64748b;}
.pc-nav.on .pc-nav-code{background:#1e56d9;color:#fff;}
.pc-nav-badge{margin-left:auto;background:#fee2e2;color:#b42318;border-radius:99px;font-size:10px;font-weight:800;min-width:18px;height:18px;display:flex;align-items:center;justify-content:center;padding:0 5px;}
.pc-nav-dot{margin-left:auto;width:7px;height:7px;border-radius:50%;background:#f59e0b;flex-shrink:0;}
.pc-main{flex:1;min-width:0;padding:28px 32px 80px;max-width:1000px;}
.pc-h1{font-size:22px;font-weight:800;letter-spacing:-.4px;margin:0 0 4px;}
.pc-lead{font-size:13px;color:#64748b;margin-bottom:20px;}
.pc-card{background:#fff;border:1px solid #e6e9ef;border-radius:14px;padding:20px 22px;box-shadow:0 1px 2px rgba(16,24,40,.04);margin-bottom:16px;}
.pc-ct{font-size:14px;font-weight:800;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:10px;}
.pc-ct-act{font-size:12px;font-weight:700;color:#1e56d9;cursor:pointer;text-decoration:none;}
.pc-k{font-size:10px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;color:#94a3b8;margin-bottom:3px;}
.pc-v{font-size:13px;font-weight:600;color:#0f1623;}
.pc-muted{font-size:12px;color:#94a3b8;}
.pc-btn{display:inline-flex;align-items:center;gap:6px;border:none;border-radius:8px;padding:8px 15px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;text-decoration:none;transition:all .1s;}
.pc-btn:disabled{opacity:.5;cursor:not-allowed;}
.pc-btn-pri{background:#1e56d9;color:#fff;}
.pc-btn-pri:hover{background:#1744b8;}
.pc-btn-sec{background:#fff;border:1px solid #cdd5e1;color:#475569;}
.pc-btn-sec:hover{background:#f5f7fa;color:#0f1623;}
.pc-btn-grn{background:#15803d;color:#fff;}
.pc-btn-sm{padding:5px 11px;font-size:12px;}
.pc-empty{text-align:center;padding:26px 16px;color:#94a3b8;font-size:13px;background:#f7f9fb;border:1px solid #eceff3;border-radius:12px;}
.pc-g2{display:grid;grid-template-columns:1fr 1fr;gap:14px 20px;}
.pc-row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid #f0f2f6;}
.pc-row:last-child{border-bottom:none;}
.pc-badge-new{background:#fff8ed;color:#b93815;border:1px solid #f9dbaf;border-radius:6px;font-size:10px;font-weight:800;padding:1px 6px;margin-left:7px;vertical-align:middle;}
.pc-hamb{display:none;background:none;border:none;font-size:20px;cursor:pointer;color:#475569;}
.pc-input{width:100%;padding:8px 10px;border:1px solid #e0e4ec;border-radius:8px;font-size:13px;font-family:inherit;outline:none;}
.pc-input:focus{border-color:#1e56d9;box-shadow:0 0 0 3px rgba(30,86,217,.08);}
@media(max-width:900px){
  .pc-side{position:fixed;left:0;top:60px;bottom:0;z-index:60;transform:translateX(-100%);transition:transform .18s;box-shadow:0 10px 40px rgba(0,0,0,.12);}
  .pc-side.open{transform:translateX(0);}
  .pc-hamb{display:block;}
  .pc-main{padding:20px 16px 70px;}
  .pc-g2{grid-template-columns:1fr;}
}
`;

export function PortalShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('portal_token') : null;
    if (!t) { router.replace('/portal/login'); return; }
    setChecked(true);
  }, [router]);

  useEffect(() => { setNavOpen(false); }, [pathname]);

  const { data: profile, isLoading, isError } = usePortalProfile(checked);
  const { data: documents = [] } = usePortalDocuments(checked);

  useEffect(() => {
    if (isError) {
      try { localStorage.removeItem('portal_token'); } catch { /* ignore */ }
      router.replace('/portal/login');
    }
  }, [isError, router]);

  const unread = documents.filter(d => d.kind === 'Share' && d.status === 'Pending').length;

  const logout = () => {
    try { localStorage.removeItem('portal_token'); localStorage.removeItem('portal_name'); } catch { /* ignore */ }
    router.push('/portal/login');
  };

  if (!checked || isLoading || !profile) {
    return (
      <>
        <style>{CSS}</style>
        <div className="pc-wrap" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>Loading your portal…</span>
        </div>
      </>
    );
  }

  const chip = statusChip(profile.status as CandidateStatus);
  const attn = {
    preinterview: !!profile.pre_interview_form_sent && profile.preinterview_form_status !== 'Submitted',
    joining:      !!profile.pre_joining_form_sent && profile.prejoining_form_status !== 'Submitted',
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="pc-wrap">
        <header className="pc-top">
          <div className="pc-brand">
            <button className="pc-hamb" onClick={() => setNavOpen(o => !o)} aria-label="Menu">☰</button>
            <div className="pc-logo">NX</div>
            <div>
              <b>Candidate Portal</b>
              <span>UNG ERP</span>
            </div>
          </div>
          <div className="pc-top-r">
            <span style={{ fontWeight: 600 }}>{profile.candidate_name}</span>
            <span className={`pc-chip ${chip.tone}`}>{chip.text}</span>
            <button className="pc-logout" onClick={logout}>Logout</button>
          </div>
        </header>

        <div className="pc-body">
          <aside className={`pc-side${navOpen ? ' open' : ''}`}>
            {NAV.map(sec => (
              <div key={sec.section}>
                <div className="pc-navsec">{sec.section}</div>
                {sec.items.map(item => {
                  const active = pathname === item.href || pathname?.startsWith(item.href + '/');
                  return (
                    <Link key={item.href} href={item.href} className={`pc-nav${active ? ' on' : ''}`}>
                      <span className="pc-nav-code">{item.code}</span>
                      {item.label}
                      {item.badge === 'docs' && unread > 0 && <span className="pc-nav-badge">{unread}</span>}
                      {item.badge === 'preinterview' && attn.preinterview && <span className="pc-nav-dot" title="Action needed" />}
                      {item.badge === 'joining' && attn.joining && <span className="pc-nav-dot" title="Action needed" />}
                    </Link>
                  );
                })}
              </div>
            ))}
          </aside>

          <main className="pc-main">{children}</main>
        </div>
      </div>
    </>
  );
}
