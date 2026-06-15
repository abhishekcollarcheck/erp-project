import type { Employee, EmployeeStatus } from '../types/employee.types';

/** Format currency in Indian notation  ₹1,68,500 */
export function formatINR(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Short format: ₹12.5L, ₹2.3Cr */
export function formatINRShort(amount: number | null | undefined): string {
  if (amount == null) return '—';
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)}Cr`;
  if (amount >= 100_000)    return `₹${(amount / 100_000).toFixed(1)}L`;
  return formatINR(amount);
}

/** Format date string to "15 Jan 2024" */
export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

/** Tenure from a DOJ date: "3 Yrs 2 Mos" */
export function getTenure(doj: string | null | undefined): string {
  if (!doj) return '';
  const ms    = Date.now() - new Date(doj).getTime();
  const days  = Math.floor(ms / 86_400_000);
  const years = Math.floor(days / 365);
  const months= Math.floor((days % 365) / 30);
  if (years === 0 && months === 0) return `${days}d`;
  if (years === 0) return `${months} Mo`;
  if (months === 0) return `${years} Yr${years > 1 ? 's' : ''}`;
  return `${years} Yr${years > 1 ? 's' : ''} ${months} Mo`;
}

/** Get initials from full name: "Rahul Kumar Sharma" → "RS" */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Full name of an employee */
export function getFullName(emp: Pick<Employee, 'first_name' | 'middle_name' | 'last_name'>): string {
  return [emp.first_name, emp.middle_name, emp.last_name].filter(Boolean).join(' ');
}

/** Status → chip variant */
export function statusVariant(status: EmployeeStatus): 'green' | 'amber' | 'red' | 'gray' {
  switch (status) {
    case 'Active':  return 'green';
    case 'Left':    return 'red';
    case 'Retired': return 'gray';
    default:        return 'gray';
  }
}

/** Onboarding % complete from onboardingDocs */
export function onboardingPct(docs: Record<string, boolean> | null | undefined): number {
  if (!docs) return 0;
  const keys  = ['offer_letter','address_verification','service_agreement','indemnity_bond','asset_deduction_letter','account_opening_letter','nda'];
  const done  = keys.filter(k => docs[k]).length;
  return Math.round((done / keys.length) * 100);
}

/** Mask middle of a string: "12345678" → "1234••5678" */
export function maskSensitive(val: string | null | undefined, showLast = 4): string {
  if (!val) return '—';
  if (val.includes('•')) return val; // already masked by backend
  if (val.length <= showLast) return '••••';
  return '•'.repeat(val.length - showLast) + val.slice(-showLast);
}