/**
 * Masks sensitive field values based on field name.
 * Mirrors the frontend maskValue() in validationEngine.ts.
 */
export function maskValue(value: string, fieldKey: string): string {
  if (!value) return value;
  const k = fieldKey.toLowerCase();
  if (k.includes('aadhaar') || k.includes('aadhar'))
    return value.replace(/\d(?=\d{4})/g, 'X');
  if (k.includes('pan'))
    return value.length >= 10 ? value.slice(0,3) + '****' + value.slice(-3) : '••••';
  if (k.includes('salary') || k.includes('ctc') || k.includes('net_pay') ||
      k.includes('gross') || k.includes('tds') || k.includes('wage')) {
    const prefix = value.match(/^[₹$€£¥]/)?.[0] || '₹';
    return `${prefix} ******`;
  }
  if (k.includes('account') || k.includes('bank') || k.includes('ifsc'))
    return '•'.repeat(Math.max(0, value.length - 4)) + value.slice(-4);
  if (k.includes('mobile') || k.includes('phone') || k.includes('contact'))
    return value.length > 4 ? value.slice(0,3) + '****' + value.slice(-4) : '****';
  if (k.includes('email') && value.includes('@')) {
    const [local, domain] = value.split('@');
    return `${local[0]}${'*'.repeat(Math.max(1,local.length-1))}@${domain}`;
  }
  return value.length > 4 ? '•'.repeat(value.length - 4) + value.slice(-4) : '••••';
}

/**
 * Partial mask — reveal only the first 2 and last 2 characters, mask the middle.
 * Values of 4 characters or fewer are fully masked so nothing meaningful leaks.
 * Mirrors the frontend maskPartial() in validationEngine.ts.
 */
export function maskPartial(value: string): string {
  if (!value) return value;
  const s = String(value);
  if (s.length <= 4) return '••••';
  return s.slice(0, 2) + '•'.repeat(s.length - 4) + s.slice(-2);
}
