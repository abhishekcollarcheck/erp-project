"use client";
import { useEffect, useRef } from "react";
import { useForm, FormProvider, useWatch, Path, PathValue } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { usePermission } from "../../auth/hooks/usePermission";
import { useEmployee } from "../../employees/hooks/useEmployees";
import { searchManagers } from "../../../services/api/employee.service";
import {
  useLeaveTypeOptions,
  useApplyLeave,
  useLeaveBalances,
} from "../hooks/useLeaves";
import {
  applyLeaveSchema,
  type ApplyLeaveFormData,
} from "../validations/leave.schema";
import type { ApplyLeaveDto } from "../../../services/api/leave.service";
import { FormInput } from "../../../components/form/FormInput";
import { FormTextarea } from "../../../components/form/FormTextarea";
import { FormCheckbox } from "../../../components/form/FormCheckbox";
import { FormDatePicker } from "../../../components/form/FormDatePicker";
import { FormTimeInput } from "../../../components/form/FormTimeInput";
import { FormAsyncSelect } from "../../../components/form/FormAsyncSelect";
import { SectionTitle } from "../../../components/form/SectionTitle";

// Fixed dropdown — these two entries drive the From/To Time requirement below.
const LEAVE_APPLICATION_TYPE_OPTIONS = [
  { value: "arrival_late", label: "Arrival Late", hint: "Short Leave" },
  { value: "leaving_early", label: "Leaving Early", hint: "Short Leave" },
  { value: "first_half", label: "1st Half" },
  { value: "second_half", label: "2nd Half" },
  { value: "full_day", label: "Full Day" },
];
const SHORT_LEAVE_APPLICATION_TYPES = new Set([
  "arrival_late",
  "leaving_early",
]);

// Fixed management/HOD list — not tied to employee records.
const HOD_OPTIONS = [
  { value: "Sh. Preveen Kr. Narula", label: "Sh. Preveen Kr. Narula" },
  { value: "Harshil Narula", label: "Harshil Narula" },
  { value: "Rudraksh Narula", label: "Rudraksh Narula" },
];

// Fixed coordinator list.
const COORDINATOR_OPTIONS = [
  { value: "Not Applicable", label: "Not Applicable" },
  { value: "Harish Bathla", label: "Harish Bathla" },
  { value: "Bhavit Shakya", label: "Bhavit Shakya" },
  { value: "Ashish Kumar Roy", label: "Ashish Kumar Roy" },
];

// One accent per card position (not per leave-type name) so it stays stable
// as leave types are added/renamed on the backend. Tailwind class names are
// written out in full here (not composed at runtime) so the JIT scanner can
// find them.
const ACCENTS = [
  { border: "border-indigo-500", ring: "ring-indigo-100", solid: "bg-indigo-500", stroke: "#6366f1" },
  { border: "border-teal-500", ring: "ring-teal-100", solid: "bg-teal-500", stroke: "#14b8a6" },
  { border: "border-amber-500", ring: "ring-amber-100", solid: "bg-amber-500", stroke: "#f59e0b" },
  { border: "border-pink-500", ring: "ring-pink-100", solid: "bg-pink-500", stroke: "#ec4899" },
  { border: "border-violet-500", ring: "ring-violet-100", solid: "bg-violet-500", stroke: "#8b5cf6" },
  { border: "border-cyan-500", ring: "ring-cyan-100", solid: "bg-cyan-500", stroke: "#06b6d4" },
];
const BRAND = ACCENTS[0];

const RING_R = 25;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

// Shape returned by GET /leaves/balances — matches leave.service#getBalances.
interface LeaveBalanceRow {
  leave_type_id: number;
  name: string;
  code: string;
  year: number;
  allocated: number;
  used: number;
  pending: number;
  carried_forward: number;
  available: number;
}

// Derives display/eligibility state from a balance row. Kept separate from
// rendering so the card grid, the validation messages, and the submit guard
// all agree on what "blocked" means and why.
function balanceState(bal?: LeaveBalanceRow) {
  const hasBalance = !!bal;
  const allocated = bal?.allocated ?? 0;
  const used = bal?.used ?? 0;
  const pending = bal?.pending ?? 0;
  const available = bal?.available ?? 0;

  // Truly out of allocation: used alone already meets/exceeds what was granted.
  const usedUp = hasBalance && allocated > 0 && used >= allocated;
  // Days remain on paper, but every one of them is tied up in a pending
  // (not-yet-approved) request — different from "used up" and worth saying so.
  const pendingBlocked = hasBalance && !usedUp && available <= 0 && pending > 0;
  const noAllocation = !hasBalance;
  const blocked = usedUp || pendingBlocked || noAllocation;

  // What the ring/number shows: allocated minus what's actually been used,
  // ignoring pending — this is the number a person intuitively expects to see.
  const visualRemaining = Math.max(0, allocated - used);

  return {
    hasBalance,
    allocated,
    used,
    pending,
    available,
    usedUp,
    pendingBlocked,
    noAllocation,
    blocked,
    visualRemaining,
  };
}

// ─── Small primitives shared by every "pick one of these cards" field ─────────
function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-[11.5px] font-medium text-red-600">{message}</p>;
}

function CheckBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full ${className}`}
    >
      <svg width={9} height={9} viewBox="0 0 12 12" fill="none">
        <path
          d="M2 6.2L4.8 9L10 3"
          stroke="#fff"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

// ─── Generic selectable tile, used for every enumerable choice in the form ────
function ChoiceCard({
  label,
  description,
  selected,
  disabled,
  onSelect,
}: {
  label: string;
  description?: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={[
        "relative flex flex-col gap-0.5 rounded-xl border bg-white px-4 py-3 text-left transition-all",
        selected
          ? `${BRAND.border} ring-4 ${BRAND.ring}`
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      ].join(" ")}
    >
      {selected && <CheckBadge className={BRAND.solid} />}
      <span className="pr-5 text-[13px] font-semibold text-gray-800">{label}</span>
      {description && <span className="text-[11px] text-gray-400">{description}</span>}
    </button>
  );
}

// ─── Read-only info tile (Personal Details) ────────────────────────────────
function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3">
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </div>
      <div className="mt-1 truncate text-[13.5px] font-medium text-gray-800">
        {value || "—"}
      </div>
    </div>
  );
}

// ─── Leave-type tile with a ring-progress indicator ────────────────────────
// Ring container is absolutely positioned so long labels/large balances never
// push the circle off-center, and large balances (>999) collapse to "1.2k"
// instead of overflowing the ring.
function LeaveBalanceCard({
  label,
  balance,
  selected,
  onSelect,
  accent,
}: {
  label: string;
  balance?: LeaveBalanceRow;
  selected: boolean;
  onSelect: () => void;
  accent: (typeof ACCENTS)[number];
}) {
  const s = balanceState(balance);
  const ringColor = s.usedUp || s.noAllocation ? "#d1d5db" : accent.stroke;
  const ringRatio = s.allocated > 0 ? Math.min(1, s.visualRemaining / s.allocated) : 0;
  const dashOffset = RING_CIRCUMFERENCE * (1 - ringRatio);

  const badge = s.noAllocation
    ? { text: "No allocation", classes: "bg-gray-100 text-gray-500" }
    : s.usedUp
      ? { text: "Used up", classes: "bg-red-50 text-red-600" }
      : s.pendingBlocked
        ? { text: "Pending hold", classes: "bg-amber-50 text-amber-600" }
        : null;

  const caption = s.noAllocation
    ? "Not allocated this year"
    : s.usedUp
      ? "No allowance left this year"
      : s.pendingBlocked
        ? `${s.pending} day(s) awaiting approval`
        : null;

  // Large balances (rare, but some orgs carry-forward big pools) collapse to
  // "1.2k" so the number never overflows the ring.
  const formattedRemaining =
    typeof s.visualRemaining === "number" && s.visualRemaining > 999
      ? `${(s.visualRemaining / 1000).toFixed(1)}k`
      : s.visualRemaining;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={s.blocked}
      aria-pressed={selected}
      className={[
        "relative flex w-full flex-col items-center gap-1 rounded-2xl border bg-white px-4 pb-4 pt-5 text-center transition-all",
        selected
          ? `${accent.border} ring-4 ${accent.ring}`
          : "border-gray-200 hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5",
        s.blocked ? "cursor-not-allowed opacity-60" : "cursor-pointer",
      ].join(" ")}
    >
      {selected && <CheckBadge className={accent.solid} />}
      {badge && (
        <span
          className={`absolute left-2.5 top-2.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${badge.classes}`}
        >
          {badge.text}
        </span>
      )}

      <div className="relative mt-2 flex h-16 w-16 shrink-0 items-center justify-center">
        <svg width={64} height={64} viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
          <circle cx={32} cy={32} r={RING_R} fill="none" stroke="#eef0f3" strokeWidth={5} />
          <circle
            cx={32}
            cy={32}
            r={RING_R}
            fill="none"
            stroke={ringColor}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.4s ease" }}
          />
        </svg>
        <span className="relative z-10 text-center text-base font-bold leading-none tracking-tight text-gray-900">
          {formattedRemaining}
        </span>
      </div>

      <span className="mt-1 w-full truncate text-[13px] font-semibold text-gray-800">{label}</span>
      <span className="text-[10.5px] text-gray-400">
        {s.hasBalance ? `of ${s.allocated} allocated` : "not on record"}
      </span>

      {s.hasBalance && (s.used > 0 || s.pending > 0) && (
        <span className="text-[10px] text-gray-400">
          {s.used} used{s.pending ? ` · ${s.pending} pending` : ""}
        </span>
      )}

      {caption && (
        <span
          className={`mt-0.5 text-[10px] font-medium leading-snug ${
            s.usedUp ? "text-red-600" : s.pendingBlocked ? "text-amber-600" : "text-gray-400"
          }`}
        >
          {caption}
        </span>
      )}
    </button>
  );
}

interface Props {
  onSuccess?: () => void;
}

export function ApplyLeaveForm({ onSuccess }: Props) {
  const router = useRouter();
  const { user, canApprove } = usePermission();
  const canActOnBehalf = canApprove("leaves");
  const applyLeave = useApplyLeave();
  const leaveTypeOptions = useLeaveTypeOptions();

  const methods = useForm<ApplyLeaveFormData>({
    resolver: zodResolver(applyLeaveSchema),
    defaultValues: {
      submission_type: "self",
      target_employee_id: null,
      leave_type_id: undefined as any,
      leave_application_type: undefined as any,
      is_short_leave: false,
      from_date: "",
      to_date: "",
      from_time: "",
      to_time: "",
      days: undefined as any,
      reason: "",
      hod_name: "",
      coordinator_name: "",
      undertaking_accepted: false as any,
    },
  });

  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = methods;

  // Type-safe setter — Path/PathValue keep the field name and the value it
  // accepts in sync, so a typo'd field name or a mismatched value fails at
  // compile time instead of silently no-op'ing at runtime.
  const setField = <K extends keyof ApplyLeaveFormData>(
    field: K,
    value: ApplyLeaveFormData[K],
  ) =>
    setValue(
      field as Path<ApplyLeaveFormData>,
      value as PathValue<ApplyLeaveFormData, Path<ApplyLeaveFormData>>,
      { shouldValidate: true, shouldDirty: true },
    );

  const submissionType = useWatch({ control, name: "submission_type" });
  const targetEmployeeId = useWatch({ control, name: "target_employee_id" });
  const leaveTypeId = useWatch({ control, name: "leave_type_id" });
  const leaveApplicationType = useWatch({ control, name: "leave_application_type" });
  const hodName = useWatch({ control, name: "hod_name" });
  const coordinatorName = useWatch({ control, name: "coordinator_name" });
  const fromDate = useWatch({ control, name: "from_date" });
  const toDate = useWatch({ control, name: "to_date" });
  const daysValue = useWatch({ control, name: "days" });

  // ── Personal details source: self or admin-picked employee ─────────────────
  const { data: selfEmployee } = useEmployee(user?.employeeId ?? 0);
  const { data: targetEmployee } = useEmployee(
    submissionType === "admin" ? (targetEmployeeId ?? 0) : 0,
  );
  const personalSource: any =
    submissionType === "admin" ? targetEmployee : selfEmployee;

  // ── Leave balance for whoever this application is for — self by default,
  // the admin-picked employee when filing on someone else's behalf.
  const { data: balances } = useLeaveBalances(
    submissionType === "admin" ? (targetEmployeeId ?? undefined) : undefined,
    submissionType === "self" || !!targetEmployeeId,
  ) as { data: LeaveBalanceRow[] | undefined };

  const balanceByType = new Map((balances ?? []).map((b) => [b.leave_type_id, b]));

  // ── Leave Application Type options are restricted by Type of Leave: Short
  // Leave only offers Arrival Late / Leaving Early, every other type only
  // offers 1st Half / 2nd Half / Full Day.
  const isShortLeaveType =
    leaveTypeOptions.data.find((o) => o.value === leaveTypeId)?.code === "ShL";
  const applicationTypeOptions = LEAVE_APPLICATION_TYPE_OPTIONS.filter(
    (o) => SHORT_LEAVE_APPLICATION_TYPES.has(o.value) === isShortLeaveType,
  );

  const selectedBalance = balanceByType.get(leaveTypeId);
  const selectedState = balanceState(selectedBalance);
  const insufficientBalance =
    !!selectedBalance && !!daysValue && daysValue > selectedBalance.available;

  // Clear the Leave Application Type selection only when crossing the
  // Short/non-Short boundary — switching e.g. Earned → Casual keeps it.
  const wasShortLeaveType = useRef(isShortLeaveType);
  useEffect(() => {
    if (wasShortLeaveType.current !== isShortLeaveType) {
      wasShortLeaveType.current = isShortLeaveType;
      setValue("leave_application_type", undefined as any, { shouldValidate: false });
    }
  }, [isShortLeaveType, setValue]);

  // ── Toggle is_short_leave when Leave Application Type changes ──────────────
  useEffect(() => {
    const isShort = SHORT_LEAVE_APPLICATION_TYPES.has(leaveApplicationType);
    setValue("is_short_leave", isShort, { shouldValidate: true });
    if (!isShort) {
      setValue("from_time", "");
      setValue("to_time", "");
    }
  }, [leaveApplicationType, setValue]);

  // ── Half day (1st/2nd Half): a single date, days fixed at 0.5 ──────────────
  const isHalfDayType =
    leaveApplicationType === "first_half" || leaveApplicationType === "second_half";
  useEffect(() => {
    if (isHalfDayType && fromDate && toDate !== fromDate) {
      setValue("to_date", fromDate, { shouldValidate: true });
    }
  }, [isHalfDayType, fromDate, toDate, setValue]);

  // ── Total days: 0.5 for half day, otherwise calculated from the date range ──
  useEffect(() => {
    if (isHalfDayType) {
      setValue("days", 0.5, { shouldValidate: true });
      return;
    }
    if (!fromDate || !toDate) {
      setValue("days", undefined as any, { shouldValidate: true });
      return;
    }
    const from = new Date(fromDate + "T00:00:00");
    const to = new Date(toDate + "T00:00:00");
    const diff = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
    setValue("days", diff > 0 ? diff : (undefined as any), { shouldValidate: true });
  }, [isHalfDayType, fromDate, toDate, setValue]);

  // ── Reset target employee when switching back to self ──────────────────────
  useEffect(() => {
    if (submissionType === "self") setValue("target_employee_id", null);
  }, [submissionType, setValue]);

  const onSubmit = async (data: ApplyLeaveFormData) => {
    const employee_id =
      data.submission_type === "admin" ? data.target_employee_id! : user!.employeeId;
    const payload: ApplyLeaveDto = {
      employee_id,
      leave_type_id: data.leave_type_id,
      leave_application_type: data.leave_application_type,
      from_date: data.from_date,
      to_date: data.to_date,
      from_time: data.is_short_leave ? data.from_time || undefined : undefined,
      to_time: data.is_short_leave ? data.to_time || undefined : undefined,
      days: data.days,
      reason: data.reason,
      hod_name: data.hod_name,
      coordinator_name: data.coordinator_name,
      undertaking_accepted: data.undertaking_accepted,
    };
    await applyLeave.mutateAsync(payload);
    if (onSuccess) onSuccess();
    else router.push("/leaves");
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* ── Submission Type ────────────────────────────────────────────── */}
        {canActOnBehalf && (
          <div className="card p-5 mb-4">
            <SectionTitle
              title="Submission Type"
              subtitle="Apply for yourself, or file on behalf of another employee"
            />
            <FieldLabel required>Submission Type</FieldLabel>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ChoiceCard
                label="Apply for myself"
                description="File your own leave request"
                selected={submissionType === "self"}
                onSelect={() => setField("submission_type", "self")}
              />
              <ChoiceCard
                label="Admin use only"
                description="File on behalf of another employee"
                selected={submissionType === "admin"}
                onSelect={() => setField("submission_type", "admin")}
              />
            </div>
            <FieldError message={errors.submission_type?.message as string} />

            {submissionType === "admin" && (
              <div className="mt-3">
                <FormAsyncSelect
                  name="target_employee_id"
                  label="Employee"
                  required
                  placeholder="Search by name or employee code…"
                  loadOptions={async (q) => {
                    const res: any = await searchManagers(q);
                    return (res?.data || []).map((e: any) => ({
                      value: e.id,
                      label: `${e.first_name} ${e.last_name} (${e.employee_code})`,
                    }));
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Personal Details ───────────────────────────────────────────── */}
        <div className="card p-5 mb-4">
          <SectionTitle title="Personal Details" subtitle="Auto-filled from the employee profile" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <InfoCard label="Employee Code" value={personalSource?.employee_code ?? ""} />
            <InfoCard
              label="Full Name"
              value={[personalSource?.first_name, personalSource?.last_name]
                .filter(Boolean)
                .join(" ")}
            />
            <InfoCard label="Email" value={personalSource?.email ?? ""} />
            <InfoCard label="Company" value={personalSource?.company?.name ?? ""} />
            <InfoCard
              label="Department"
              value={personalSource?.department?.department_name ?? ""}
            />
            <InfoCard
              label="Designation"
              value={personalSource?.designation?.designation_name ?? ""}
            />
          </div>
        </div>

        {/* ── Leave Details ───────────────────────────────────────────────── */}
        <div className="card p-5 mb-4">
          <SectionTitle
            title="Leave Details"
            subtitle="Pick a leave type below — the card shows what you actually have left"
          />

          {/* Type of Leave — the balance card IS the field */}
          <FieldLabel required>Type of Leave</FieldLabel>
          {leaveTypeOptions.data.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {leaveTypeOptions.data.map((opt, i) => (
                <LeaveBalanceCard
                  key={opt.value}
                  label={opt.label}
                  balance={balanceByType.get(opt.value)}
                  selected={leaveTypeId === opt.value}
                  onSelect={() => setField("leave_type_id", opt.value as any)}
                  accent={ACCENTS[i % ACCENTS.length]}
                />
              ))}
            </div>
          )}
          <FieldError message={errors.leave_type_id?.message as string} />

          {selectedState.blocked && selectedBalance && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] font-medium text-red-700">
              {selectedState.usedUp
                ? `You've used your entire ${selectedBalance.name} allowance for this year — pick a different leave type above.`
                : `Every remaining ${selectedBalance.name} day is on a pending request — pick a different leave type, or wait for approval.`}
            </div>
          )}

          {/* Leave Application Type */}
          <div className="mt-5">
            <FieldLabel required>Leave Application Type</FieldLabel>
            {!leaveTypeId ? (
              <p className="text-[12px] text-gray-400">Select a Type of Leave first</p>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                {applicationTypeOptions.map((o) => (
                  <ChoiceCard
                    key={o.value}
                    label={o.label}
                    description={o.hint}
                    disabled={selectedState.blocked}
                    selected={leaveApplicationType === o.value}
                    onSelect={() => setField("leave_application_type", o.value as any)}
                  />
                ))}
              </div>
            )}
            <FieldError message={errors.leave_application_type?.message as string} />
          </div>

          {watch("is_short_leave") && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormTimeInput name="from_time" label="From Time" required hint="For Short Leave only" />
              <FormTimeInput name="to_time" label="To Time" required hint="For Short Leave only" />
            </div>
          )}

          <div
            className={`mt-4 grid grid-cols-1 gap-3 ${isHalfDayType ? "" : "sm:grid-cols-2"}`}
          >
            <FormDatePicker
              name="from_date"
              label={isHalfDayType ? "Date" : "From Date"}
              required
              disablePast={submissionType === "self"}
            />
            {!isHalfDayType && (
              <FormDatePicker
                name="to_date"
                label="To Date"
                required
                disablePast={submissionType === "self"}
              />
            )}
          </div>

          <div className="mt-3">
            <FormInput
              name="days"
              label="Total Number Of Days"
              type="number"
              required
              readOnly
              hint={
                isHalfDayType
                  ? "Fixed at 0.5 for a half-day application"
                  : "Calculated automatically from the selected dates"
              }
            />
          </div>

          {insufficientBalance && selectedBalance && !selectedState.blocked && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] font-medium text-red-700">
              Insufficient {selectedBalance.name} balance — only {selectedBalance.available}{" "}
              day(s) remaining, requested {daysValue}.
            </div>
          )}

          <div className="mt-3">
            <FormTextarea
              name="reason"
              label="Reason"
              required
              placeholder="Please enter reason for leave"
            />
          </div>
        </div>

        {/* ── Management / HOD Details ───────────────────────────────────── */}
        <div className="card p-5 mb-4">
          <SectionTitle title="Management / HOD Details" />

          <FieldLabel required>Management / HOD's Name</FieldLabel>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {HOD_OPTIONS.map((o) => (
              <ChoiceCard
                key={o.value}
                label={o.label}
                selected={hodName === o.value}
                onSelect={() => setField("hod_name", o.value)}
              />
            ))}
          </div>
          <FieldError message={errors.hod_name?.message as string} />

          <div className="mt-5">
            <FieldLabel required>Coordinator's Name if Applicable</FieldLabel>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {COORDINATOR_OPTIONS.map((o) => (
                <ChoiceCard
                  key={o.value}
                  label={o.label}
                  selected={coordinatorName === o.value}
                  onSelect={() => setField("coordinator_name", o.value)}
                />
              ))}
            </div>
            <FieldError message={errors.coordinator_name?.message as string} />
          </div>

          <div className="mt-4">
            <FormCheckbox
              name="undertaking_accepted"
              label="I have applied for leave, but I know that in case of exigency I may have to attend duty."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="btn btn-sec"
            onClick={() => router.push("/leaves")}
            disabled={applyLeave.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-pri"
            disabled={applyLeave.isPending || insufficientBalance || selectedState.blocked}
          >
            {applyLeave.isPending ? "Submitting…" : "✓ Submit Leave Application"}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}