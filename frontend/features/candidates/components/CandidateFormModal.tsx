'use client';
import { useEffect, useRef, useState } from 'react';
import { useForm, useFieldArray, type UseFormRegisterReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Loader2, Sparkles, Plus, Trash2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { candidateService } from '../../../services/api/candidate.service';
import { useCandidate } from '../hooks/useCandidates';
import { useEmployees } from '../../employees/hooks/useEmployees';
import { showToast } from '../../../utils/toast';
import type { Candidate } from '../types/candidate.types';
import { ALL_SOURCES } from '../types/candidate.types';

const today = new Date().toISOString().slice(0, 10);

const emptyToUndefined = (value: unknown) => {
  if (value === '' || value === null) return undefined;
  return value;
};

// A JSON column can come back as a raw string (MariaDB + Sequelize) — tolerate both.
const toStringArray = (v: unknown): string[] => {
  if (Array.isArray(v)) return v as string[];
  if (typeof v === 'string' && v.trim()) {
    try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; }
    catch { return v.split(',').map(s => s.trim()).filter(Boolean); }
  }
  return [];
};

const numberOrUndefined = (value: unknown) => {
  if (
    value === '' ||
    value === null ||
    value === undefined ||
    Number.isNaN(value)
  ) {
    return undefined;
  }

  return Number(value);
};

const employmentSchema = z.object({
  company: z.string().trim().min(1, 'Company is required').max(200),
  designation: z.preprocess(emptyToUndefined, z.string().trim().max(200).optional()),
  joining_date: z.preprocess(emptyToUndefined, z.string().optional()),
  leaving_date: z.preprocess(emptyToUndefined, z.string().optional()),
  currently_working: z.boolean().optional(),
});

const schema = z.object({
  // ── Personal ────────────────────────────────────────────────────────────
  first_name: z.preprocess(
    emptyToUndefined,
    z.string().trim().min(1, 'First name is required').max(100),
  ),
  middle_name: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  last_name: z.preprocess(
    emptyToUndefined,
    z.string().trim().min(1, 'Last name is required').max(100),
  ),

  email: z.preprocess(
    emptyToUndefined,
    z.string({ required_error: 'Email is required' })
      .trim().min(1, 'Email is required')
      .email('Please enter a valid email address'),
  ),

  phone_number: z.preprocess(
    emptyToUndefined,
    z.string({ required_error: 'Phone number is required' })
      .trim().min(1, 'Phone number is required')
      .regex(/^[+\d\s\-()]{7,20}$/, 'Please enter a valid phone number'),
  ),

  gender: z.preprocess(
    emptyToUndefined,
    z.enum(['Male', 'Female', 'Other', 'Prefer not to say']).optional(),
  ),

  date_of_birth: z.preprocess(emptyToUndefined, z.string().optional()),

  // ── Location ────────────────────────────────────────────────────────────
  current_state_id: z.preprocess(numberOrUndefined, z.number().int().positive().optional()),
  current_city_id: z.preprocess(numberOrUndefined, z.number().int().positive().optional()),
  ready_to_relocate: z.preprocess(emptyToUndefined, z.enum(['Yes', 'No']).optional()),
  perm_address_same_as_present: z.boolean().optional(),
  perm_state_id: z.preprocess(numberOrUndefined, z.number().int().positive().optional()),
  perm_city_id: z.preprocess(numberOrUndefined, z.number().int().positive().optional()),

  // ── Education ───────────────────────────────────────────────────────────
  qualification: z.preprocess(emptyToUndefined, z.string().trim().max(200).optional()),
  course: z.preprocess(emptyToUndefined, z.string().trim().max(200).optional()),
  institute: z.preprocess(emptyToUndefined, z.string().trim().max(200).optional()),
  edu_mode: z.preprocess(emptyToUndefined, z.enum(['Regular', 'Non Regular', 'Not Applicable']).optional()),
  edu_start_date: z.preprocess(emptyToUndefined, z.string().optional()),
  edu_end_date: z.preprocess(emptyToUndefined, z.string().optional()),
  edu_currently_pursuing: z.boolean().optional(),

  // ── Professional / experience ──────────────────────────────────────────
  fresher: z.boolean().optional(),
  current_company_name: z.preprocess(emptyToUndefined, z.string().trim().max(200).optional()),
  current_company_designation: z.preprocess(emptyToUndefined, z.string().trim().max(200).optional()),
  location: z.preprocess(emptyToUndefined, z.string().trim().max(200).optional()),
  total_experience: z.preprocess(
    numberOrUndefined,
    z.number({ invalid_type_error: 'Total experience must be a number' })
      .min(0, 'Total experience cannot be negative')
      .max(60, 'Total experience cannot exceed 60 years')
      .optional(),
  ),
  relevant_experience: z.preprocess(
    numberOrUndefined,
    z.number({ invalid_type_error: 'Relevant experience must be a number' })
      .min(0, 'Relevant experience cannot be negative')
      .max(60, 'Relevant experience cannot exceed 60 years')
      .optional(),
  ),
  employments: z.array(employmentSchema).max(20).optional(),

  apply_department: z.preprocess(emptyToUndefined, z.string().trim().max(200).optional()),
  apply_designation: z.preprocess(emptyToUndefined, z.string().trim().max(200).optional()),

  current_salary: z.preprocess(
    numberOrUndefined,
    z.number({ invalid_type_error: 'Current salary must be a number' }).min(0, 'Current salary cannot be negative').optional(),
  ),
  expected_salary: z.preprocess(
    numberOrUndefined,
    z.number({ invalid_type_error: 'Expected salary must be a number' }).min(0, 'Expected salary cannot be negative').optional(),
  ),

  // ── Availability ────────────────────────────────────────────────────────
  currently_working: z.preprocess(emptyToUndefined, z.enum(['Yes', 'No']).optional()),
  notice_period: z.preprocess(
    numberOrUndefined,
    z.number({ invalid_type_error: 'Notice period must be a number' })
      .int('Notice period must be a whole number')
      .min(0, 'Notice period cannot be negative')
      .optional(),
  ),
  serving_notice_period: z.preprocess(emptyToUndefined, z.enum(['Yes', 'No']).optional()),
  last_working_day: z.preprocess(emptyToUndefined, z.string().optional()),
  immediate_joiner: z.boolean().optional(),
  expected_joining_date: z.preprocess(
    emptyToUndefined,
    z.string().refine(d => !d || d >= today, 'Expected joining date cannot be in the past').optional(),
  ),

  // ── Vehicle ─────────────────────────────────────────────────────────────
  own_vehicle: z.boolean().optional(),
  vehicle_car: z.boolean().optional(),
  vehicle_bike: z.boolean().optional(),
  vehicle_scooty: z.boolean().optional(),

  // ── Sourcing ────────────────────────────────────────────────────────────
  source: z.preprocess(emptyToUndefined, z.enum(ALL_SOURCES).optional()),
  is_internal_referral: z.preprocess(emptyToUndefined, z.enum(['Yes', 'No']).optional()),
  referred_by_employee_id: z.preprocess(numberOrUndefined, z.number().int().positive().optional()),
  reference_source: z.preprocess(emptyToUndefined, z.string().trim().max(300).optional()),

  remarks: z.preprocess(emptyToUndefined, z.string().trim().max(1000, 'Remarks must be under 1000 characters').optional()),
});

type FormData = z.infer<typeof schema>;
type FieldName = keyof FormData;

interface Props {
  open: boolean;
  onClose: () => void;
  candidate?: Candidate | null;
}

const Section = ({ title, hint }: { title: string; hint?: string }) => (
  <div className="cfm-sec">
    <span className="cfm-sec__t">{title}</span>
    {hint && <span className="cfm-sec__h">{hint}</span>}
    <span className="cfm-sec__line" />
  </div>
);

// Custom checkbox row — stable module-scope component; pass the register() result in.
function Check2({ reg, label, hint, disabled }: {
  reg: UseFormRegisterReturn; label: string; hint?: string; disabled?: boolean;
}) {
  return (
    <label className="cfm-check" data-disabled={disabled || undefined}>
      <input type="checkbox" disabled={disabled} {...reg} />
      <span className="cfm-check__txt">{label}{hint && <em> {hint}</em>}</span>
    </label>
  );
}

// Segmented Yes / No control — keeps the exact 'Yes' | 'No' | undefined form value.
function SegYesNo({ value, onChange }: {
  value?: 'Yes' | 'No'; onChange: (v: 'Yes' | 'No' | undefined) => void;
}) {
  return (
    <div className="cfm-seg" role="group">
      {(['Yes', 'No'] as const).map(opt => (
        <button
          key={opt}
          type="button"
          className="cfm-seg__btn"
          data-on={value === opt || undefined}
          onClick={() => onChange(value === opt ? undefined : opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ── Wizard step definitions ───────────────────────────────────────────────────
const STEPS: { key: string; label: string; sub: string; fields: FieldName[] }[] = [
  {
    key: 'profile', label: 'Profile', sub: 'Contact & location',
    fields: ['first_name', 'middle_name', 'last_name', 'email', 'phone_number', 'gender', 'date_of_birth',
      'current_state_id', 'current_city_id', 'ready_to_relocate', 'perm_address_same_as_present', 'perm_state_id', 'perm_city_id'],
  },
  {
    key: 'background', label: 'Background', sub: 'Education & work',
    fields: ['qualification', 'course', 'institute', 'edu_mode', 'edu_start_date', 'edu_end_date', 'edu_currently_pursuing',
      'fresher', 'current_company_name', 'current_company_designation', 'location', 'total_experience', 'relevant_experience', 'employments'],
  },
  {
    key: 'opportunity', label: 'Opportunity', sub: 'Role & pay',
    fields: ['apply_department', 'apply_designation', 'current_salary', 'expected_salary',
      'currently_working', 'notice_period', 'serving_notice_period', 'last_working_day',
      'immediate_joiner', 'expected_joining_date', 'own_vehicle', 'vehicle_car', 'vehicle_bike', 'vehicle_scooty'],
  },
  {
    key: 'source', label: 'Source', sub: 'Channel & notes',
    fields: ['source', 'is_internal_referral', 'referred_by_employee_id', 'reference_source', 'remarks'],
  },
];

// Which parsed-resume fields map to which form fields — used by the autofill dropzone.
const PARSE_FIELD_MAP: Record<string, FieldName> = {
  first_name: 'first_name',
  last_name: 'last_name',
  email: 'email',
  phone_number: 'phone_number',
  date_of_birth: 'date_of_birth',
  qualification: 'qualification',
  total_experience: 'total_experience',
};

export function CandidateFormModal({ open, onClose, candidate }: Props) {
  const isEdit = !!candidate;
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);

  // ── Persistent resume autofill dropzone state ───────────────────────────
  const [resumeParseFile, setResumeParseFile] = useState<File | null>(null);
  const [resumeParseState, setResumeParseState] = useState<'empty' | 'ready' | 'parsing'>('empty');
  const [resumeDragOver, setResumeDragOver] = useState(false);
  const [resumeHint, setResumeHint] = useState<string | null>(null);

  // The list payload omits the `employments` relation; always hydrate from the
  // detail endpoint when editing so saving never wipes existing employment rows.
  const { data: fetchedCandidate } = useCandidate(open && candidate?.id ? candidate.id : 0);
  const src = fetchedCandidate ?? candidate;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      immediate_joiner: false,
      own_vehicle: false,
      perm_address_same_as_present: true,
      fresher: false,
    },
  });

  const { fields: employmentFields, append: appendEmployment, remove: removeEmployment } = useFieldArray({
    control,
    name: 'employments',
  });

  const { data: empData } = useEmployees({ limit: 200, status: 'Active' as any });
  const employees = empData?.data ?? [];

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setResumeParseFile(null);
    setResumeParseState('empty');
    setResumeHint(null);

    const srcVehicles = toStringArray(src?.vehicle_types);

    reset(src ? {
      first_name: src.first_name || '',
      middle_name: src.middle_name || '',
      last_name: src.last_name || '',
      email: src.email || '',
      phone_number: src.phone_number || '',
      gender: src.gender ?? undefined,
      date_of_birth: src.date_of_birth?.slice(0, 10) || '',

      current_state_id: src.current_state_id ?? undefined,
      current_city_id: src.current_city_id ?? undefined,
      ready_to_relocate: src.ready_to_relocate === true ? 'Yes' : src.ready_to_relocate === false ? 'No' : undefined,
      perm_address_same_as_present: src.perm_address_same_as_present ?? true,
      perm_state_id: src.perm_state_id ?? undefined,
      perm_city_id: src.perm_city_id ?? undefined,

      qualification: src.qualification || '',
      course: src.course || '',
      institute: src.institute || '',
      edu_mode: src.edu_mode ?? undefined,
      edu_start_date: src.edu_start_date?.slice(0, 10) || '',
      edu_end_date: src.edu_end_date?.slice(0, 10) || '',
      edu_currently_pursuing: src.edu_currently_pursuing ?? false,

      fresher: src.fresher ?? false,
      current_company_name: src.current_company_name || '',
      current_company_designation: src.current_company_designation || '',
      location: src.location || '',
      total_experience: src.total_experience ?? undefined,
      relevant_experience: src.relevant_experience ?? undefined,
      employments: (src.employments ?? []).map(e => ({
        company: e.company,
        designation: e.designation || '',
        joining_date: e.joining_date?.slice(0, 10) || '',
        leaving_date: e.leaving_date?.slice(0, 10) || '',
        currently_working: e.currently_working ?? false,
      })),

      apply_department: src.apply_department ?? undefined,
      apply_designation: src.apply_designation ?? undefined,
      current_salary: src.current_salary ?? undefined,
      expected_salary: src.expected_salary ?? undefined,

      currently_working: src.currently_working === true ? 'Yes' : src.currently_working === false ? 'No' : undefined,
      notice_period: src.notice_period ?? undefined,
      serving_notice_period: src.serving_notice_period === true ? 'Yes' : src.serving_notice_period === false ? 'No' : undefined,
      last_working_day: src.last_working_day?.slice(0, 10) || '',
      immediate_joiner: src.immediate_joiner ?? false,
      expected_joining_date: src.expected_joining_date?.slice(0, 10) || '',

      own_vehicle: src.own_vehicle ?? false,
      vehicle_car: srcVehicles.includes('Car'),
      vehicle_bike: srcVehicles.includes('Bike'),
      vehicle_scooty: srcVehicles.includes('Scooty'),

      source: src.source ?? undefined,
      is_internal_referral: src.is_internal_referral === true ? 'Yes' : src.is_internal_referral === false ? 'No' : undefined,
      referred_by_employee_id: src.referred_by_employee_id ?? undefined,
      reference_source: src.reference_source || '',
      remarks: src.remarks || '',
    } : {
      immediate_joiner: false,
      own_vehicle: false,
      perm_address_same_as_present: true,
      fresher: false,
      employments: [],
    });
  }, [open, src, reset]);

  // ── Resume autofill: parse + fill only currently-empty fields ────────────
  const parseMutation = useMutation({
    mutationFn: (file: File) => candidateService.parseResume(file),
    onSuccess: (res) => {
      const parsed = res.data;
      let filledCount = 0;

      (Object.keys(PARSE_FIELD_MAP) as (keyof typeof PARSE_FIELD_MAP)[]).forEach(key => {
        const formField = PARSE_FIELD_MAP[key];
        const parsedValue = (parsed as any)[key];
        if (parsedValue === null || parsedValue === undefined || parsedValue === '') return;

        const current = getValues(formField);
        if (current !== undefined && current !== null && current !== '') return; // never clobber a filled field

        setValue(formField, parsedValue as any, { shouldDirty: true, shouldValidate: false });
        filledCount++;
      });

      setResumeParseState('ready');
      if (filledCount > 0) {
        setResumeHint(`Autofilled ${filledCount} field${filledCount === 1 ? '' : 's'} — please review before saving.`);
        showToast(`✓ Resume parsed — ${filledCount} field${filledCount === 1 ? '' : 's'} autofilled`);
      } else {
        setResumeHint('Parsed, but nothing new to autofill (fields already had values, or none were confidently detected).');
      }
    },
    onError: (err: any) => {
      setResumeParseState('ready');
      setResumeHint('Could not parse this resume automatically — please fill the form manually.');
      showToast(err?.message || 'Resume parsing failed');
    },
  });

  const handleResumeFile = (file: File | null) => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'txt', 'text'].includes(ext || '')) {
      showToast('Only PDF or TXT files can be auto-parsed');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('Resume size must be under 10 MB');
      return;
    }
    setResumeParseFile(file);
    setResumeParseState('parsing');
    setResumeHint(null);
    parseMutation.mutate(file);
  };

  const clearResumeParse = () => {
    setResumeParseFile(null);
    setResumeParseState('empty');
    setResumeHint(null);
    if (resumeInputRef.current) resumeInputRef.current.value = '';
  };

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => {
      const toBool = (v: 'Yes' | 'No' | undefined) => v === undefined ? null : v === 'Yes';

      const vehicleTypes = [
        data.vehicle_car && 'Car',
        data.vehicle_bike && 'Bike',
        data.vehicle_scooty && 'Scooty',
      ].filter(Boolean) as string[];

      const payload: any = {
        first_name: data.first_name,
        middle_name: data.middle_name || null,
        last_name: data.last_name,
        email: data.email || null,
        phone_number: data.phone_number || null,
        gender: data.gender || null,
        date_of_birth: data.date_of_birth || null,

        current_state_id: data.current_state_id ?? null,
        current_city_id: data.current_city_id ?? null,
        ready_to_relocate: toBool(data.ready_to_relocate),
        perm_address_same_as_present: data.perm_address_same_as_present ?? true,
        perm_state_id: data.perm_address_same_as_present ? null : (data.perm_state_id ?? null),
        perm_city_id: data.perm_address_same_as_present ? null : (data.perm_city_id ?? null),

        qualification: data.qualification || null,
        course: data.course || null,
        institute: data.institute || null,
        edu_mode: data.edu_mode || null,
        edu_start_date: data.edu_start_date || null,
        edu_end_date: data.edu_currently_pursuing ? null : (data.edu_end_date || null),
        edu_currently_pursuing: data.edu_currently_pursuing ?? false,

        fresher: data.fresher ?? false,
        current_company_name: data.fresher ? null : (data.current_company_name || null),
        current_company_designation: data.fresher ? null : (data.current_company_designation || null),
        location: data.location || null,
        total_experience: data.total_experience ?? null,
        relevant_experience: data.relevant_experience ?? null,

        apply_department: data.apply_department || null,
        apply_designation: data.apply_designation || null,
        current_salary: data.current_salary ?? null,
        expected_salary: data.expected_salary ?? null,

        currently_working: toBool(data.currently_working),
        notice_period: data.notice_period ?? null,
        serving_notice_period: toBool(data.serving_notice_period),
        last_working_day: data.serving_notice_period === 'Yes' ? (data.last_working_day || null) : null,
        immediate_joiner: data.immediate_joiner ?? false,
        expected_joining_date: data.expected_joining_date || null,

        own_vehicle: data.own_vehicle ?? false,
        vehicle_types: data.own_vehicle ? vehicleTypes : null,

        source: data.source || null,
        is_internal_referral: toBool(data.is_internal_referral),
        referred_by_employee_id: data.is_internal_referral === 'Yes' ? (data.referred_by_employee_id ?? null) : null,
        reference_source: data.is_internal_referral === 'No' ? (data.reference_source || null) : null,
        remarks: data.remarks || null,
      };

      // Only send `employments` when we hold the authoritative list for this
      // candidate (a fresh create, or an edit hydrated from the detail endpoint).
      // Otherwise omit the key so the server leaves existing rows untouched
      // rather than replace-all wiping them.
      if (!isEdit || fetchedCandidate) {
        payload.employments = data.fresher ? [] : (data.employments ?? []).map(e => ({
          company: e.company,
          designation: e.designation || null,
          joining_date: e.joining_date || null,
          leaving_date: e.currently_working ? null : (e.leaving_date || null),
          currently_working: e.currently_working ?? false,
        }));
      }

      return isEdit
        ? candidateService.update(candidate!.id, payload)
        : candidateService.create(payload);
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['candidates'] });
      const refTag = res.data.reference_code ? ` (${res.data.reference_code})` : '';
      showToast(`✓ ${res.data.candidate_name}${refTag} ${isEdit ? 'updated' : 'added'}`);
      onClose();
    },
    onError: (err: any) => showToast(err?.message || 'Save failed'),
  });

  const resumeMutation = useMutation({
    mutationFn: (file: File) => candidateService.uploadResume(candidate!.id, file),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['candidates'] }); showToast('✓ Resume uploaded'); },
    onError: (err: any) => showToast(err?.message || 'Upload failed'),
  });

  const Err = ({ f }: { f: keyof FormData }) => errors[f] ? <span className="err">{errors[f]!.message as string}</span> : null;

  const cur = watch('current_salary') ?? 0;
  const exp = watch('expected_salary') ?? 0;
  const hike = cur > 0 && exp > 0 ? (((exp - cur) / cur) * 100).toFixed(1) : null;

  const isFresher = watch('fresher');
  const sameAsPresent = watch('perm_address_same_as_present');
  const eduPursuing = watch('edu_currently_pursuing');
  const ownVehicle = watch('own_vehicle');
  const isServingNotice = watch('serving_notice_period');
  const isCurrentlyWorking = watch('currently_working');
  const isInternalReferral = watch('is_internal_referral');

  const isLastStep = step === STEPS.length - 1;

  const onInvalid = (formErrors: typeof errors) => {
    // Jump to the first step that contains an error, since fields on other
    // steps aren't visible right now — required fields are only checked on save.
    const erroredKeys = Object.keys(formErrors);
    const firstStepWithError = STEPS.findIndex(s => s.fields.some(f => erroredKeys.includes(f)));
    if (firstStepWithError !== -1) setStep(firstStepWithError);
  };

  return (
    <Modal open={open} onClose={onClose}
      title={isEdit ? 'Edit Candidate' : 'Add Candidate'}
      subtitle={
        isEdit
          ? `${candidate?.candidate_name ?? ''}${src?.reference_code ? `  ·  ${src.reference_code}` : ''}`
          : 'Only name is required — jump to any section, we validate on save'
      }
      width={820}
      footer={
        <div className="cfm-ft">
          <span className="cfm-ft__count">Step {step + 1} of {STEPS.length}</span>
          <div className="cfm-ft__actions">
            <button type="button" className="btn btn-sec" onClick={onClose}>Cancel</button>
            {step > 0 && (
              <button type="button" className="btn btn-sec" onClick={() => setStep(s => Math.max(0, s - 1))}>← Back</button>
            )}
            {!isLastStep ? (
              <button type="button" className="btn btn-pri" onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}>Continue →</button>
            ) : (
              <button type="button" className="btn btn-pri" onClick={handleSubmit(d => saveMutation.mutate(d), onInvalid)} disabled={saveMutation.isPending} style={{ minWidth: 128, justifyContent: 'center' }}>
                {saveMutation.isPending && <Loader2 size={13} className="cfm-spin" />}
                {saveMutation.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add candidate'}
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="cfm">

        {/* ── Stepper ──────────────────────────────────────────────────────── */}
        <div className="cfm-steps">
          <div
            className="cfm-steps__rail"
            style={{ left: `${100 / (STEPS.length * 2)}%`, right: `${100 / (STEPS.length * 2)}%` }}
            aria-hidden
          >
            <div className="cfm-steps__rail-fill" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
          </div>
          {STEPS.map((s, i) => {
            const state = i === step ? 'active' : i < step ? 'done' : 'todo';
            return (
              <button key={s.key} type="button" className="cfm-step" data-state={state} onClick={() => setStep(i)}>
                <span className="cfm-step__dot">{state === 'done' ? <Check size={13} strokeWidth={3.5} /> : i + 1}</span>
                <span className="cfm-step__label">{s.label}</span>
                <span className="cfm-step__sub">{s.sub}</span>
              </button>
            );
          })}
        </div>

        {/* ── Resume autofill — persistent across steps ─────────────────────── */}
        <div
          className="cfm-resume"
          data-drag={resumeDragOver || undefined}
          data-state={resumeParseState}
          onDragOver={e => { e.preventDefault(); setResumeDragOver(true); }}
          onDragLeave={() => setResumeDragOver(false)}
          onDrop={e => {
            e.preventDefault();
            setResumeDragOver(false);
            handleResumeFile(e.dataTransfer.files?.[0] || null);
          }}
        >
          <input
            ref={resumeInputRef}
            type="file"
            accept=".pdf,.txt,.text,text/plain,application/pdf"
            hidden
            onChange={e => handleResumeFile(e.target.files?.[0] || null)}
          />
          <span className="cfm-resume__icon" aria-hidden>
            {resumeParseState === 'parsing'
              ? <Loader2 size={15} className="cfm-spin" />
              : resumeParseState === 'ready'
                ? <Check size={15} />
                : <Sparkles size={15} />}
          </span>
          <div className="cfm-resume__body">
            {resumeParseState === 'empty' ? (
              <>
                <strong>Autofill from Resume</strong>
                <span>
                  Drop a PDF or TXT, or{' '}
                  <button type="button" className="cfm-linkbtn" onClick={() => resumeInputRef.current?.click()}>browse</button>
                  {' '}— we’ll pre-fill the blanks.
                </span>
              </>
            ) : (
              <>
                <strong>{resumeParseFile?.name || 'Resume'}</strong>
                <span>
                  {resumeParseState === 'parsing'
                    ? 'Reading Resume…'
                    : resumeHint || (resumeParseFile ? `${(resumeParseFile.size / 1024).toFixed(1)} KB · ready` : 'Ready')}
                </span>
              </>
            )}
          </div>
          {resumeParseState !== 'empty' && (
            <div className="cfm-resume__actions">
              <button type="button" className="btn btn-sec btn-sm" onClick={() => resumeInputRef.current?.click()} disabled={resumeParseState === 'parsing'}>Replace</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={clearResumeParse} disabled={resumeParseState === 'parsing'}>Clear</button>
            </div>
          )}
        </div>

        {/* ── Step panels ──────────────────────────────────────────────────── */}
        <div className="cfm-panel" key={step}>

        {/* ═══════════════════════ Step 1 · Profile ═══════════════════════ */}
        {step === 0 && (
          <>
            <Section title="Personal" />
            <div className="cfm-full cfm-row3">
              <div className="fg"><label>First Name <i className="cfm-req">*</i></label><input placeholder="Priya" {...register('first_name')} autoFocus /><Err f="first_name" /></div>
              <div className="fg"><label>Middle Name</label><input placeholder="Optional" {...register('middle_name')} /></div>
              <div className="fg"><label>Last Name <i className="cfm-req">*</i></label><input placeholder="Sharma" {...register('last_name')} /><Err f="last_name" /></div>
            </div>
            <div className="fg"><label>Email <i className="cfm-req">*</i></label><input type="email" placeholder="priya@gmail.com" {...register('email')} /><Err f="email" /></div>
            <div className="fg"><label>Phone <i className="cfm-req">*</i></label><input type="tel" placeholder="+91 98765 43210" {...register('phone_number')} /><Err f="phone_number" /></div>
            <div className="fg"><label>Gender</label><select {...register('gender')}><option value="">— Select —</option><option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option></select></div>
            <div className="fg"><label>Date of Birth</label><input type="date" {...register('date_of_birth')} /></div>

            <Section title="Location" hint="State / city dropdowns coming soon — enter IDs for now" />
            <div className="fg">
              <label>Current State (ID)</label>
              <input type="number" placeholder="State ID" {...register('current_state_id', { valueAsNumber: true })} />
            </div>
            <div className="fg">
              <label>Current City (ID)</label>
              <input type="number" placeholder="City ID" {...register('current_city_id', { valueAsNumber: true })} />
            </div>
            <div className="fg">
              <label>Ready to Relocate</label>
              <SegYesNo value={watch('ready_to_relocate')} onChange={v => setValue('ready_to_relocate', v, { shouldDirty: true })} />
            </div>
            <div className="fg cfm-full">
              <Check2 reg={register('perm_address_same_as_present')} label="Permanent address same as present" />
            </div>
            {!sameAsPresent && (
              <>
                <div className="fg"><label>Permanent State (ID)</label><input type="number" placeholder="State ID" {...register('perm_state_id', { valueAsNumber: true })} /></div>
                <div className="fg"><label>Permanent City (ID)</label><input type="number" placeholder="City ID" {...register('perm_city_id', { valueAsNumber: true })} /></div>
              </>
            )}
          </>
        )}

        {/* ═══════════════════════ Step 2 · Background ════════════════════ */}
        {step === 1 && (
          <>
            <Section title="Education" />
            <div className="fg"><label>Qualification</label><input placeholder="Bachelor's" {...register('qualification')} /></div>
            <div className="fg"><label>Course</label><input placeholder="B.E. Computer Science" {...register('course')} /></div>
            <div className="fg"><label>Institute</label><input placeholder="ABC Engineering College" {...register('institute')} /></div>
            <div className="fg"><label>Mode</label><select {...register('edu_mode')}><option value="">— Select —</option><option>Regular</option><option>Non Regular</option><option>Not Applicable</option></select></div>
            <div className="fg"><label>Start Date</label><input type="date" {...register('edu_start_date')} /></div>
            <div className="fg">
              <label>End Date</label>
              <input type="date" disabled={eduPursuing} {...register('edu_end_date')} />
            </div>
            <div className="fg cfm-full">
              <Check2 reg={register('edu_currently_pursuing')} label="Currently pursuing" />
            </div>

            <Section title="Work Experience" />
            <div className="fg cfm-full">
              <Check2 reg={register('fresher')} label="Fresher" hint="— no prior work experience" />
            </div>
            <div className="fg"><label>Total Experience (yrs)</label><input type="number" step="0.5" min="0" max="60" placeholder="4.5" disabled={isFresher} {...register('total_experience', { valueAsNumber: true })} /><Err f="total_experience" /></div>
            <div className="fg"><label>Relevant Experience (yrs)</label><input type="number" step="0.5" min="0" max="60" placeholder="3.0" disabled={isFresher} {...register('relevant_experience', { valueAsNumber: true })} /></div>
            <div className="fg"><label>Location</label><input placeholder="Bengaluru, Karnataka" {...register('location')} /></div>

            {!isFresher && (
              <>
                <div className="fg"><label>Current Company</label><input placeholder="Infosys, TCS…" {...register('current_company_name')} /></div>
                <div className="fg"><label>Current Designation</label><input placeholder="Senior Engineer" {...register('current_company_designation')} /></div>

                <div className="fg cfm-full">
                  <div className="cfm-eh__head">
                    <label style={{ margin: 0 }}>Employment History</label>
                    <span className="cfm-eh__count">{employmentFields.length ? `${employmentFields.length} added` : 'None yet'}</span>
                  </div>
                  {employmentFields.map((field, idx) => (
                    <div key={field.id} className="cfm-eh__card">
                      <div className="cfm-eh__card-top">
                        <span className="cfm-eh__badge">{idx + 1}</span>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeEmployment(idx)}>
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                        <div className="fg"><label>Company</label><input placeholder="e.g. Infosys" {...register(`employments.${idx}.company` as const)} />{errors.employments?.[idx]?.company && <span className="err">{errors.employments[idx]?.company?.message}</span>}</div>
                        <div className="fg"><label>Designation</label><input placeholder="e.g. Software Engineer" {...register(`employments.${idx}.designation` as const)} /></div>
                        <div className="fg"><label>Joining Date</label><input type="date" {...register(`employments.${idx}.joining_date` as const)} /></div>
                        <div className="fg"><label>Leaving Date</label><input type="date" disabled={!!watch(`employments.${idx}.currently_working` as const)} {...register(`employments.${idx}.leaving_date` as const)} /></div>
                        <div className="fg cfm-full" style={{ marginBottom: 0 }}>
                          <Check2 reg={register(`employments.${idx}.currently_working` as const)} label="Presently working here" />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="btn btn-sec btn-sm" onClick={() => appendEmployment({ company: '', designation: '', joining_date: '', leaving_date: '', currently_working: false })}>
                    <Plus size={12} /> Add employment
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ═══════════════════════ Step 3 · Opportunity ════════════════════ */}
        {step === 2 && (
          <>
            <Section title="Applying For" />
            <div className="fg"><label>Apply Department</label><input type="text" placeholder="IT" {...register('apply_department')} /></div>
            <div className="fg"><label>Apply Designation</label><input type="text" placeholder="Backend Developer" {...register('apply_designation')} /></div>

            <Section title="Compensation & Availability" />
            <div className="fg"><label>Current Salary (₹/mo)</label><input type="number" min="0" placeholder="75000" {...register('current_salary', { valueAsNumber: true })} /></div>
            <div className="fg"><label>Expected Salary (₹/mo)</label><input type="number" min="0" placeholder="90000" {...register('expected_salary', { valueAsNumber: true })} /></div>

            {hike !== null && (
              <div className="cfm-hike cfm-full">
                <div className="cfm-hike__item"><span>Current CTC</span><strong>₹{(cur * 12 / 100000).toFixed(2)}L</strong></div>
                <div className="cfm-hike__sep" />
                <div className="cfm-hike__item"><span>Expected CTC</span><strong>₹{(exp * 12 / 100000).toFixed(2)}L</strong></div>
                <div className="cfm-hike__sep" />
                <div className="cfm-hike__item">
                  <span>Hike</span>
                  <strong style={{ color: Number(hike) >= 0 ? 'var(--green)' : 'var(--red)' }}>{Number(hike) >= 0 ? '+' : ''}{hike}%</strong>
                </div>
              </div>
            )}

            <div className="fg"><label>Currently Working</label><SegYesNo value={watch('currently_working')} onChange={v => setValue('currently_working', v, { shouldDirty: true })} /></div>
            <div className="fg"><label>Expected Joining Date</label><input type="date" min={today} {...register('expected_joining_date')} /><Err f="expected_joining_date" /></div>

            {isCurrentlyWorking === 'Yes' && (
              <>
                <div className="fg"><label>Serving Notice Period</label><SegYesNo value={watch('serving_notice_period')} onChange={v => setValue('serving_notice_period', v, { shouldDirty: true })} /></div>
                {isServingNotice === 'Yes' && (
                  <div className="fg"><label>Last Working Day</label><input type="date" {...register('last_working_day')} /></div>
                )}
                <div className="fg"><label>Notice Period (days)</label><input type="number" min="0" placeholder="30" {...register('notice_period', { valueAsNumber: true })} /></div>
              </>
            )}

            <div className="cfm-full" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <Check2 reg={register('immediate_joiner')} label="Immediate joiner" />
              <Check2 reg={register('own_vehicle')} label="Owns a vehicle" />
            </div>

            {ownVehicle && (
              <div className="fg cfm-full">
                <label>Vehicle Type</label>
                <div className="cfm-pills">
                  <label className="cfm-pill"><input type="checkbox" {...register('vehicle_car')} /><span>Car</span></label>
                  <label className="cfm-pill"><input type="checkbox" {...register('vehicle_bike')} /><span>Bike</span></label>
                  <label className="cfm-pill"><input type="checkbox" {...register('vehicle_scooty')} /><span>Scooty</span></label>
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════ Step 4 · Source ═════════════════════════ */}
        {step === 3 && (
          <>
            <Section title="Source" />
            <div className="fg"><label>Source</label><select {...register('source')}><option value="">— Select —</option>{ALL_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div className="fg"><label>Internal Employee Referral?</label><SegYesNo value={watch('is_internal_referral')} onChange={v => setValue('is_internal_referral', v, { shouldDirty: true })} /></div>

            {isInternalReferral === 'Yes' && (
              <div className="fg cfm-full">
                <label>Referred By</label>
                <select {...register('referred_by_employee_id', { valueAsNumber: true })}>
                  <option value="">— Select employee —</option>
                  {employees.map((e: any) => (
                    <option key={e.id} value={e.id}>{e.first_name} {e.last_name} · {e.email || e.employee_code}</option>
                  ))}
                </select>
              </div>
            )}
            {isInternalReferral === 'No' && (
              <div className="fg cfm-full">
                <label>Referee Name</label>
                <input placeholder="Who referred or which posting" {...register('reference_source')} />
              </div>
            )}

            <div className="fg cfm-full"><label>Remarks</label><textarea rows={3} placeholder="Notes about this candidate…" {...register('remarks')} /><Err f="remarks" /></div>

            {isEdit && (
              <>
                <Section title="Resume File" />
                <div className="fg cfm-full">
                  <div className="cfm-file">
                    <span className="cfm-file__meta">
                      {candidate?.resume_url
                        ? <a href={`${process.env.NEXT_PUBLIC_API_URL}${candidate.resume_url}`} target="_blank" rel="noopener noreferrer" className="cfm-linkbtn">View current Resume →</a>
                        : <span style={{ color: 'var(--ink4)' }}>No Resume on file</span>}
                    </span>
                    <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
                      onChange={e => {
                        const f = e.target.files?.[0];

                        if (!f) return;

                        const ext = f.name.split('.').pop()?.toLowerCase();

                        if (!['pdf', 'doc', 'docx'].includes(ext || '')) {
                          showToast('Only PDF, DOC, and DOCX files are allowed');
                          e.target.value = '';
                          return;
                        }

                        if (f.size > 10 * 1024 * 1024) {
                          showToast('Resume size must be under 10 MB');
                          e.target.value = '';
                          return;
                        }

                        resumeMutation.mutate(f);
                        e.target.value = '';
                      }}
                    />
                    <button type="button" className="btn btn-sec btn-sm" onClick={() => fileRef.current?.click()} disabled={resumeMutation.isPending}>
                      {resumeMutation.isPending && <Loader2 size={12} className="cfm-spin" />}
                      {resumeMutation.isPending ? 'Uploading…' : candidate?.resume_url ? 'Replace' : 'Upload'}
                    </button>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--ink4)', marginTop: 4 }}>PDF, DOC, DOCX · max 10 MB</span>
                </div>
              </>
            )}
          </>
        )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .cfm-spin { animation: spin .7s linear infinite; }

        .cfm { display: flex; flex-direction: column; }

        /* ── Stepper ─────────────────────────────────────────────── */
        .cfm-steps {
          position: relative; display: flex; gap: 4px;
          margin: 2px 0 18px; padding-bottom: 2px;
        }
        .cfm-steps__rail {
          position: absolute; top: 13px; height: 2px;
          background: var(--border2); border-radius: 2px; overflow: hidden;
        }
        .cfm-steps__rail-fill { height: 100%; background: var(--blue); transition: width .25s ease; }
        .cfm-step {
          flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center;
          gap: 6px; background: none; border: 0; padding: 0 2px; cursor: pointer;
          min-height: 56px; position: relative;
        }
        .cfm-step__dot {
          width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center;
          justify-content: center; font-size: 12px; font-weight: 700; font-family: var(--mono);
          border: 2px solid var(--border2); background: var(--surface); color: var(--ink4);
          transition: all .18s ease; position: relative; z-index: 1;
        }
        .cfm-step[data-state="active"] .cfm-step__dot {
          border-color: var(--blue); background: var(--blue); color: #fff;
          box-shadow: 0 0 0 4px var(--blue-lt);
        }
        .cfm-step[data-state="done"] .cfm-step__dot {
          border-color: var(--blue); background: var(--blue-lt); color: var(--blue);
        }
        .cfm-step__label { font-size: 11.5px; font-weight: 600; color: var(--ink4); text-align: center; line-height: 1.2; }
        .cfm-step[data-state="active"] .cfm-step__label { color: var(--ink); }
        .cfm-step[data-state="done"] .cfm-step__label { color: var(--ink2); }
        .cfm-step__sub { font-size: 10px; color: var(--ink4); text-align: center; line-height: 1.2; display: none; }
        .cfm-step[data-state="active"] .cfm-step__sub { display: block; }
        .cfm-step:hover .cfm-step__dot { border-color: var(--blue); }

        /* ── Resume autofill ─────────────────────────────────────── */
        .cfm-resume {
          display: flex; align-items: flex-start; gap: 11px;
          border: 1.5px dashed var(--border2); border-radius: var(--r2);
          background: var(--surface2); padding: 12px 14px; margin-bottom: 18px;
          transition: border-color .12s, background .12s;
        }
        .cfm-resume[data-drag] { border-color: var(--blue); background: var(--blue-lt); }
        .cfm-resume[data-state="ready"] { border-style: solid; border-color: var(--green-bd); background: var(--green-lt); }
        .cfm-resume__icon {
          width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: var(--surface); border: 1px solid var(--border);
          color: var(--blue);
        }
        .cfm-resume[data-state="ready"] .cfm-resume__icon { color: var(--green); border-color: var(--green-bd); }
        .cfm-resume__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .cfm-resume__body strong { font-size: 12.5px; color: var(--ink); word-break: break-word; }
        .cfm-resume__body span { font-size: 11px; color: var(--ink3); line-height: 1.45; }
        .cfm-resume__actions { display: flex; gap: 6px; flex-shrink: 0; }
        .cfm-linkbtn {
          background: none; border: 0; padding: 0; font: inherit; cursor: pointer;
          color: var(--blue); font-weight: 600; text-decoration: underline;
        }

        /* ── Panel + fields ──────────────────────────────────────── */
        .cfm-panel {
          display: grid; grid-template-columns: 1fr 1fr; gap: 0 14px;
          animation: cfmFade .18s ease;
        }
        @keyframes cfmFade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .cfm-full { grid-column: 1 / -1; }
        .cfm-row3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0 12px; }

        .cfm .fg { margin-bottom: 13px; }
        .cfm .fg label { display: flex; align-items: center; gap: 4px; }
        .cfm-req { color: var(--red); font-style: normal; font-weight: 700; }
        .cfm .fg input, .cfm .fg select, .cfm .fg textarea {
          transition: border-color .12s, box-shadow .12s;
        }
        .cfm .fg input:focus, .cfm .fg select:focus, .cfm .fg textarea:focus {
          border-color: var(--blue); box-shadow: 0 0 0 3px var(--blue-lt);
        }
        .cfm .fg input:disabled, .cfm .fg select:disabled {
          background: var(--surface2); color: var(--ink4); cursor: not-allowed; border-style: dashed;
        }
        .cfm .fg textarea { min-height: 68px; }

        /* ── Section header ──────────────────────────────────────── */
        .cfm-sec {
          grid-column: 1 / -1; display: flex; align-items: center; gap: 10px;
          margin: 8px 0 12px;
        }
        .cfm-panel > .cfm-sec:first-child { margin-top: 0; }
        .cfm-sec__t {
          font-size: 11px; font-weight: 700; color: var(--ink3);
          text-transform: uppercase; letter-spacing: .09em; white-space: nowrap;
        }
        .cfm-sec__h { font-size: 10.5px; color: var(--ink4); white-space: nowrap; }
        .cfm-sec__line { flex: 1; height: 1px; background: var(--border); }

        /* ── Custom checkbox ─────────────────────────────────────── */
        .cfm-check {
          display: flex; align-items: flex-start; gap: 9px; padding: 9px 12px;
          border: 1px solid var(--border); border-radius: var(--r);
          background: var(--surface); cursor: pointer; transition: all .12s;
          font-size: 12px; font-weight: 600; color: var(--ink2);
        }
        .cfm-check:hover { border-color: var(--border2); background: var(--surface2); }
        .cfm-check:has(input:checked) { border-color: var(--blue-md); background: var(--blue-lt); color: var(--blue); }
        .cfm-check[data-disabled] { opacity: .5; cursor: not-allowed; }
        .cfm-check input {
          appearance: none; -webkit-appearance: none; margin: 0; flex-shrink: 0;
          width: 16px; height: 16px; border: 1.5px solid var(--border2); border-radius: 5px;
          background: var(--surface); cursor: pointer; position: relative; transition: all .12s;
          margin-top: 1px;
        }
        .cfm-check input:checked { background: var(--blue); border-color: var(--blue); }
        .cfm-check input:checked::after {
          content: ""; position: absolute; left: 4.5px; top: 1px;
          width: 4px; height: 8px; border: solid #fff; border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
        .cfm-check__txt em { font-style: normal; font-weight: 500; color: var(--ink4); }
        .cfm-check:has(input:checked) .cfm-check__txt em { color: var(--blue); opacity: .8; }

        /* ── Segmented Yes/No ────────────────────────────────────── */
        .cfm-seg {
          display: inline-flex; gap: 3px; padding: 3px; width: fit-content;
          background: var(--surface2); border: 1px solid var(--border); border-radius: var(--r);
        }
        .cfm-seg__btn {
          padding: 5px 18px; border: 0; background: none; border-radius: 5px;
          font-size: 12px; font-weight: 600; font-family: var(--font);
          color: var(--ink4); cursor: pointer; transition: all .12s;
        }
        .cfm-seg__btn:hover { color: var(--ink2); }
        .cfm-seg__btn[data-on] { background: var(--surface); color: var(--blue); box-shadow: var(--sh); }

        /* ── Pills (vehicle types) ───────────────────────────────── */
        .cfm-pills { display: flex; gap: 8px; flex-wrap: wrap; }
        .cfm-pill {
          display: inline-flex; align-items: center; gap: 7px; padding: 7px 14px;
          border: 1px solid var(--border2); border-radius: 99px; cursor: pointer;
          font-size: 12px; font-weight: 600; color: var(--ink3); transition: all .12s;
          user-select: none;
        }
        .cfm-pill:hover { border-color: var(--blue-md); }
        .cfm-pill input { appearance: none; -webkit-appearance: none; width: 0; height: 0; margin: 0; }
        .cfm-pill:has(input:checked) { border-color: var(--blue); background: var(--blue-lt); color: var(--blue); }
        .cfm-pill span::before { content: "+"; margin-right: 2px; opacity: .5; }
        .cfm-pill:has(input:checked) span::before { content: "✓"; opacity: 1; }

        /* ── Hike strip ──────────────────────────────────────────── */
        .cfm-hike {
          display: flex; align-items: center; gap: 14px;
          background: var(--surface2); border: 1px solid var(--border);
          border-radius: var(--r); padding: 10px 14px; margin-bottom: 13px;
        }
        .cfm-hike__item { display: flex; flex-direction: column; gap: 2px; }
        .cfm-hike__item span { font-size: 10px; color: var(--ink4); text-transform: uppercase; letter-spacing: .06em; font-weight: 600; }
        .cfm-hike__item strong { font-size: 14px; font-family: var(--mono); color: var(--ink); }
        .cfm-hike__sep { width: 1px; align-self: stretch; background: var(--border); }

        /* ── Employment history ──────────────────────────────────── */
        .cfm-eh__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .cfm-eh__count { font-size: 10.5px; color: var(--ink4); font-weight: 600; }
        .cfm-eh__card {
          border: 1px solid var(--border); border-radius: var(--r2);
          background: var(--surface2); padding: 12px; margin-bottom: 10px;
        }
        .cfm-eh__card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .cfm-eh__badge {
          width: 20px; height: 20px; border-radius: 6px; background: var(--blue-lt);
          color: var(--blue); font-size: 11px; font-weight: 700; font-family: var(--mono);
          display: flex; align-items: center; justify-content: center;
        }
        .cfm-eh__card .fg input { background: var(--surface); }

        /* ── Resume file row ─────────────────────────────────────── */
        .cfm-file { display: flex; align-items: center; gap: 12px; }
        .cfm-file__meta { flex: 1; font-size: 12px; }

        /* ── Footer ──────────────────────────────────────────────── */
        .cfm-ft { display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 12px; }
        .cfm-ft__count { font-size: 11px; font-weight: 600; color: var(--ink4); font-family: var(--mono); white-space: nowrap; }
        .cfm-ft__actions { display: flex; gap: 8px; }

        @media (max-width: 700px) {
          .cfm-row3 { grid-template-columns: 1fr 1fr; }
          .cfm-row3 > .fg:last-child { grid-column: 1 / -1; }
        }
        @media (max-width: 560px) {
          .cfm-panel { grid-template-columns: 1fr; }
          .cfm-row3 { grid-template-columns: 1fr; }
          .cfm-step__label { font-size: 10.5px; }
          .cfm-ft__count { display: none; }
        }
      `}</style>
    </Modal>
  );
}