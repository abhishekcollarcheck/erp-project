// Best-effort resume field extraction using regex/heuristics only — no LLM call.
// Accuracy is limited: name/email/phone/dob/qualification are reasonably reliable;
// employment and education rows are NOT structurally extracted (too unreliable
// without NLP) — raw section text is returned instead so HR can copy manually,
// or so this can be swapped for an LLM-based extractor later without changing
// the calling code's shape.

export interface ParsedResumeResult {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  date_of_birth: string | null;
  qualification: string | null;
  total_experience: number | null;
  raw_sections: {
    education: string | null;
    experience: string | null;
  };
  raw_text_length: number;
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3,5}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}\b/;
const DOB_LABEL_RE = /(?:date of birth|dob)\s*[:\-]?\s*([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4}|[0-9]{4}-[0-9]{2}-[0-9]{2})/i;
const EXPERIENCE_YEARS_RE = /(\d+(?:\.\d+)?)\s*\+?\s*years?\s+(?:of\s+)?experience/i;

const QUALIFICATIONS = [
  { keywords: ['phd', 'doctorate'], label: 'PhD' },
  { keywords: ['mba'], label: 'MBA' },
  { keywords: ["master's", 'masters', 'm.tech', 'm.e.', 'm.sc', 'msc', 'm.a.'], label: "Master's" },
  { keywords: ["bachelor's", 'bachelors', 'b.tech', 'b.e.', 'b.sc', 'bsc', 'b.a.', 'b.com'], label: "Bachelor's" },
  { keywords: ['diploma'], label: 'Diploma' },
  { keywords: ['high school', '12th', 'hsc'], label: 'High School' },
];

function normalizeDate(raw: string): string | null {
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return raw;

  const dmy = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (dmy) {
    let [, d, m, y] = dmy;
    if (y.length === 2) y = `20${y}`;
    const dd = d.padStart(2, '0');
    const mm = m.padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }
  return null;
}

function extractSection(text: string, headerPatterns: RegExp[], stopPatterns: RegExp[]): string | null {
  const lines = text.split('\n');
  let startIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    if (headerPatterns.some(p => p.test(lines[i].trim()))) {
      startIdx = i + 1;
      break;
    }
  }
  if (startIdx === -1) return null;

  let endIdx = lines.length;
  for (let i = startIdx; i < lines.length; i++) {
    if (stopPatterns.some(p => p.test(lines[i].trim()))) {
      endIdx = i;
      break;
    }
  }

  const section = lines.slice(startIdx, endIdx).join('\n').trim();
  return section || null;
}

const SECTION_HEADERS = [
  /^education$/i, /^academic (background|qualifications?)$/i,
  /^(work )?experience$/i, /^employment( history)?$/i,
  /^skills?$/i, /^projects?$/i, /^certifications?$/i,
  /^summary$/i, /^objective$/i, /^references?$/i,
];

export function parseResumeText(text: string): ParsedResumeResult {
  const cleaned = text.replace(/\r/g, '').trim();
  const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);

  // Name: best-effort — first non-empty line that looks like a name
  // (2-4 words, no digits, no @ symbol, not a section header).
  let first_name: string | null = null;
  let last_name: string | null = null;
  for (const line of lines.slice(0, 5)) {
    if (/\d|@/.test(line)) continue;
    if (SECTION_HEADERS.some(p => p.test(line))) continue;
    const words = line.split(/\s+/).filter(Boolean);
    if (words.length >= 2 && words.length <= 4) {
      first_name = words[0];
      last_name = words.slice(1).join(' ');
      break;
    }
  }

  const emailMatch = cleaned.match(EMAIL_RE);
  const email = emailMatch ? emailMatch[0] : null;

  const phoneMatch = cleaned.match(PHONE_RE);
  const phone_number = phoneMatch ? phoneMatch[0].replace(/\s+/g, ' ').trim() : null;

  const dobMatch = cleaned.match(DOB_LABEL_RE);
  const date_of_birth = dobMatch ? normalizeDate(dobMatch[1]) : null;

  let qualification: string | null = null;
  const lowerText = cleaned.toLowerCase();
  for (const q of QUALIFICATIONS) {
    if (q.keywords.some(k => lowerText.includes(k))) {
      qualification = q.label;
      break;
    }
  }

  const expMatch = cleaned.match(EXPERIENCE_YEARS_RE);
  const total_experience = expMatch ? parseFloat(expMatch[1]) : null;

  const education = extractSection(
    cleaned,
    [/^education$/i, /^academic (background|qualifications?)$/i],
    SECTION_HEADERS,
  );
  const experience = extractSection(
    cleaned,
    [/^(work )?experience$/i, /^employment( history)?$/i],
    SECTION_HEADERS,
  );

  return {
    first_name,
    last_name,
    email,
    phone_number,
    date_of_birth,
    qualification,
    total_experience,
    raw_sections: { education, experience },
    raw_text_length: cleaned.length,
  };
}