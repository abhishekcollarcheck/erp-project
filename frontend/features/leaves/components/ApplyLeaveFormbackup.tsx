// // "use client";
// // import { useEffect, useRef } from "react";
// // import { useForm, FormProvider, useWatch } from "react-hook-form";
// // import { zodResolver } from "@hookform/resolvers/zod";
// // import { useRouter } from "next/navigation";
// // import { usePermission } from "../../auth/hooks/usePermission";
// // import { useEmployee } from "../../employees/hooks/useEmployees";
// // import { searchManagers } from "../../../services/api/employee.service";
// // import {
// //   useLeaveTypeOptions,
// //   useApplyLeave,
// //   useLeaveBalances,
// // } from "../hooks/useLeaves";
// // import {
// //   applyLeaveSchema,
// //   type ApplyLeaveFormData,
// // } from "../validations/leave.schema";
// // import type { ApplyLeaveDto } from "../../../services/api/leave.service";
// // import { FormInput } from "../../../components/form/FormInput";
// // import { FormSelect } from "../../../components/form/FormSelect";
// // import { FormRadio } from "../../../components/form/FormRadio";
// // import { FormTextarea } from "../../../components/form/FormTextarea";
// // import { FormCheckbox } from "../../../components/form/FormCheckbox";
// // import { FormDatePicker } from "../../../components/form/FormDatePicker";
// // import { FormTimeInput } from "../../../components/form/FormTimeInput";
// // import { FormAsyncSelect } from "../../../components/form/FormAsyncSelect";
// // import { SectionTitle } from "../../../components/form/SectionTitle";

// // // Fixed dropdown — these two entries drive the From/To Time requirement below.
// // const LEAVE_APPLICATION_TYPE_OPTIONS = [
// //   { value: "arrival_late", label: "Arrival Late (Short Leave)" },
// //   { value: "leaving_early", label: "Leaving Early (Short Leave)" },
// //   { value: "first_half", label: "1st Half" },
// //   { value: "second_half", label: "2nd Half" },
// //   { value: "full_day", label: "Full Day" },
// // ];
// // const SHORT_LEAVE_APPLICATION_TYPES = new Set([
// //   "arrival_late",
// //   "leaving_early",
// // ]);

// // // Fixed management/HOD list — not tied to employee records.
// // const HOD_OPTIONS = [
// //   { value: "Sh. Preveen Kr. Narula", label: "Sh. Preveen Kr. Narula" },
// //   { value: "Harshil Narula", label: "Harshil Narula" },
// //   { value: "Rudraksh Narula", label: "Rudraksh Narula" },
// // ];

// // // Fixed coordinator list.
// // const COORDINATOR_OPTIONS = [
// //   { value: "Not Applicable", label: "Not Applicable" },
// //   { value: "Harish Bathla", label: "Harish Bathla" },
// //   { value: "Bhavit Shakya", label: "Bhavit Shakya" },
// //   { value: "Ashish Kumar Roy", label: "Ashish Kumar Roy" },
// // ];

// // // ─── Read-only display field (Personal Details) — not part of the form payload ──
// // function ReadOnlyField({ label, value }: { label: string; value: string }) {
// //   return (
// //     <div className="form-field fg">
// //       <label className="field-label">{label}</label>
// //       <input className="form-input readonly" readOnly value={value || "—"} />
// //     </div>
// //   );
// // }

// // interface Props {
// //   onSuccess?: () => void;
// // }

// // export function ApplyLeaveForm({ onSuccess }: Props) {
// //   const router = useRouter();
// //   const { user, canApprove } = usePermission();
// //   const canActOnBehalf = canApprove("leaves");
// //   const applyLeave = useApplyLeave();
// //   const leaveTypeOptions = useLeaveTypeOptions();

// //   const methods = useForm<ApplyLeaveFormData>({
// //     resolver: zodResolver(applyLeaveSchema),
// //     defaultValues: {
// //       submission_type: "self",
// //       target_employee_id: null,
// //       leave_type_id: undefined as any,
// //       leave_application_type: undefined as any,
// //       is_short_leave: false,
// //       from_date: "",
// //       to_date: "",
// //       from_time: "",
// //       to_time: "",
// //       days: undefined as any,
// //       reason: "",
// //       hod_name: "",
// //       coordinator_name: "",
// //       undertaking_accepted: false as any,
// //     },
// //   });

// //   const { handleSubmit, control, setValue, watch } = methods;
// //   const submissionType = useWatch({ control, name: "submission_type" });
// //   const targetEmployeeId = useWatch({ control, name: "target_employee_id" });
// //   const leaveTypeId = useWatch({ control, name: "leave_type_id" });
// //   const leaveApplicationType = useWatch({
// //     control,
// //     name: "leave_application_type",
// //   });
// //   const fromDate = useWatch({ control, name: "from_date" });
// //   const toDate = useWatch({ control, name: "to_date" });
// //   const daysValue = useWatch({ control, name: "days" });

// //   // ── Personal details source: self or admin-picked employee ─────────────────
// //   const { data: selfEmployee } = useEmployee(user?.employeeId ?? 0);
// //   const { data: targetEmployee } = useEmployee(
// //     submissionType === "admin" ? (targetEmployeeId ?? 0) : 0,
// //   );
// //   const personalSource: any =
// //     submissionType === "admin" ? targetEmployee : selfEmployee;

// //   // ── Leave balance for whoever this application is for — self by default,
// //   // the admin-picked employee when filing on someone else's behalf.
// //   const { data: balances } = useLeaveBalances(
// //     submissionType === "admin" ? (targetEmployeeId ?? undefined) : undefined,
// //     submissionType === "self" || !!targetEmployeeId,
// //   );

// //   // ── Leave Application Type options are restricted by Type of Leave: Short
// //   // Leave only offers Arrival Late / Leaving Early, every other type only
// //   // offers 1st Half / 2nd Half / Full Day.
// //   const isShortLeaveType =
// //     leaveTypeOptions.data.find((o) => o.value === leaveTypeId)?.code === "ShL";
// //   const applicationTypeOptions = LEAVE_APPLICATION_TYPE_OPTIONS.filter(
// //     (o) => SHORT_LEAVE_APPLICATION_TYPES.has(o.value) === isShortLeaveType,
// //   );

// //   const selectedBalance = balances?.find(
// //     (b) => b.leave_type_id === leaveTypeId,
// //   );
// //   const insufficientBalance =
// //     !!selectedBalance && !!daysValue && daysValue > selectedBalance.remaining;

// //   // Clear the Leave Application Type selection only when crossing the
// //   // Short/non-Short boundary — switching e.g. Earned → Casual keeps it.
// //   const wasShortLeaveType = useRef(isShortLeaveType);
// //   useEffect(() => {
// //     if (wasShortLeaveType.current !== isShortLeaveType) {
// //       wasShortLeaveType.current = isShortLeaveType;
// //       setValue("leave_application_type", undefined as any, {
// //         shouldValidate: false,
// //       });
// //     }
// //   }, [isShortLeaveType, setValue]);

// //   // ── Toggle is_short_leave when Leave Application Type changes ──────────────
// //   useEffect(() => {
// //     const isShort = SHORT_LEAVE_APPLICATION_TYPES.has(leaveApplicationType);
// //     setValue("is_short_leave", isShort, { shouldValidate: true });
// //     if (!isShort) {
// //       setValue("from_time", "");
// //       setValue("to_time", "");
// //     }
// //   }, [leaveApplicationType, setValue]);

// //   // ── Half day (1st/2nd Half): a single date, days fixed at 0.5 ──────────────
// //   const isHalfDayType =
// //     leaveApplicationType === "first_half" ||
// //     leaveApplicationType === "second_half";
// //   useEffect(() => {
// //     if (isHalfDayType && fromDate && toDate !== fromDate) {
// //       setValue("to_date", fromDate, { shouldValidate: true });
// //     }
// //   }, [isHalfDayType, fromDate, toDate, setValue]);

// //   // ── Total days: 0.5 for half day, otherwise calculated from the date range ──
// //   useEffect(() => {
// //     if (isHalfDayType) {
// //       setValue("days", 0.5, { shouldValidate: true });
// //       return;
// //     }
// //     if (!fromDate || !toDate) {
// //       setValue("days", undefined as any, { shouldValidate: true });
// //       return;
// //     }
// //     const from = new Date(fromDate + "T00:00:00");
// //     const to = new Date(toDate + "T00:00:00");
// //     const diff = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
// //     setValue("days", diff > 0 ? diff : (undefined as any), {
// //       shouldValidate: true,
// //     });
// //   }, [isHalfDayType, fromDate, toDate, setValue]);

// //   // ── Reset target employee when switching back to self ──────────────────────
// //   useEffect(() => {
// //     if (submissionType === "self") setValue("target_employee_id", null);
// //   }, [submissionType, setValue]);

// //   const onSubmit = async (data: ApplyLeaveFormData) => {
// //     const employee_id =
// //       data.submission_type === "admin"
// //         ? data.target_employee_id!
// //         : user!.employeeId;
// //     const payload: ApplyLeaveDto = {
// //       employee_id,
// //       leave_type_id: data.leave_type_id,
// //       leave_application_type: data.leave_application_type,
// //       from_date: data.from_date,
// //       to_date: data.to_date,
// //       from_time: data.is_short_leave ? data.from_time || undefined : undefined,
// //       to_time: data.is_short_leave ? data.to_time || undefined : undefined,
// //       days: data.days,
// //       reason: data.reason,
// //       hod_name: data.hod_name,
// //       coordinator_name: data.coordinator_name,
// //       undertaking_accepted: data.undertaking_accepted,
// //     };
// //     await applyLeave.mutateAsync(payload);
// //     if (onSuccess) onSuccess();
// //     else router.push("/leaves");
// //   };

// //   const setNumeric = (field: "leave_type_id") => (v: string) => {
// //     setValue(field, (v ? Number(v) : undefined) as any, {
// //       shouldValidate: true,
// //       shouldDirty: true,
// //     });
// //   };

// //   return (
// //     <FormProvider {...methods}>
// //       <form onSubmit={handleSubmit(onSubmit)}>
// //         {/* ── Submission Type ────────────────────────────────────────────── */}
// //         {canActOnBehalf && (
// //           <div className="card p-5 mb-4">
// //             <SectionTitle
// //               title="Submission Type"
// //               subtitle="Apply for yourself, or file on behalf of another employee"
// //             />
// //             <FormRadio
// //               name="submission_type"
// //               label="Submission Type"
// //               required
// //               layout="horizontal"
// //               options={[
// //                 { value: "self", label: "Apply Leave" },
// //                 { value: "admin", label: "Admin Use Only" },
// //               ]}
// //             />
// //             {submissionType === "admin" && (
// //               <div className="mt-3">
// //                 <FormAsyncSelect
// //                   name="target_employee_id"
// //                   label="Employee"
// //                   required
// //                   placeholder="Search by name or employee code…"
// //                   loadOptions={async (q) => {
// //                     const res: any = await searchManagers(q);
// //                     return (res?.data || []).map((e: any) => ({
// //                       value: e.id,
// //                       label: `${e.first_name} ${e.last_name} (${e.employee_code})`,
// //                     }));
// //                   }}
// //                 />
// //               </div>
// //             )}
// //           </div>
// //         )}

// //         {/* ── Personal Details ───────────────────────────────────────────── */}
// //         <div className="card p-5 mb-4">
// //           <SectionTitle
// //             title="Personal Details"
// //             subtitle="Auto-filled from the employee profile"
// //           />
// //           <div
// //             style={{
// //               display: "grid",
// //               gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
// //               gap: 12,
// //             }}
// //           >
// //             <ReadOnlyField
// //               label="Employee Code"
// //               value={personalSource?.employee_code ?? ""}
// //             />
// //             <ReadOnlyField
// //               label="Full Name"
// //               value={[personalSource?.first_name, personalSource?.last_name]
// //                 .filter(Boolean)
// //                 .join(" ")}
// //             />
// //             <ReadOnlyField label="Email" value={personalSource?.email ?? ""} />
// //             <ReadOnlyField
// //               label="Company"
// //               value={personalSource?.company?.name ?? ""}
// //             />
// //             <ReadOnlyField
// //               label="Department"
// //               value={personalSource?.department?.department_name ?? ""}
// //             />
// //             <ReadOnlyField
// //               label="Designation"
// //               value={personalSource?.designation?.designation_name ?? ""}
// //             />
// //           </div>
// //         </div>

// //         {/* ── Leave Details ───────────────────────────────────────────────── */}
// //         <div className="card p-5 mb-4">
// //           <SectionTitle title="Leave Details" />
// //           <div
// //             style={{
// //               display: "grid",
// //               gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
// //               gap: 12,
// //             }}
// //           >
// //             <FormSelect
// //               name="leave_type_id"
// //               label="Type of Leave"
// //               required
// //               placeholder="Select leave type"
// //               options={leaveTypeOptions.data.map((o) => {
// //                 const bal = balances?.find((b) => b.leave_type_id === o.value);
// //                 const exhausted = !!bal && bal.remaining <= 0;
// //                 return {
// //                   value: o.value,
// //                   label: exhausted ? `${o.label} (0 remaining)` : o.label,
// //                   disabled: exhausted,
// //                 };
// //               })}
// //               onChange={setNumeric("leave_type_id")}
// //               hint={
// //                 selectedBalance
// //                   ? `${selectedBalance.remaining} of ${selectedBalance.allocated} ${selectedBalance.code} day(s) remaining`
// //                   : undefined
// //               }
// //             />
// //             <FormSelect
// //               name="leave_application_type"
// //               label="Leave Application Type"
// //               required
// //               placeholder={
// //                 leaveTypeId
// //                   ? "Select application type"
// //                   : "Select Type of Leave first"
// //               }
// //               disabled={!leaveTypeId}
// //               options={applicationTypeOptions}
// //             />
// //           </div>

// //           {watch("is_short_leave") && (
// //             <div
// //               style={{
// //                 display: "grid",
// //                 gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
// //                 gap: 12,
// //                 marginTop: 12,
// //               }}
// //             >
// //               <FormTimeInput
// //                 name="from_time"
// //                 label="From Time"
// //                 required
// //                 hint="For Short Leave only"
// //               />
// //               <FormTimeInput
// //                 name="to_time"
// //                 label="To Time"
// //                 required
// //                 hint="For Short Leave only"
// //               />
// //             </div>
// //           )}

// //           <div
// //             style={{
// //               display: "grid",
// //               gridTemplateColumns: isHalfDayType
// //                 ? "1fr"
// //                 : "repeat(auto-fit, minmax(200px, 1fr))",
// //               gap: 12,
// //               marginTop: 12,
// //             }}
// //           >
// //             <FormDatePicker
// //               name="from_date"
// //               label={isHalfDayType ? "Date" : "From Date"}
// //               required
// //               disablePast={submissionType === "self"}
// //             />
// //             {!isHalfDayType && (
// //               <FormDatePicker
// //                 name="to_date"
// //                 label="To Date"
// //                 required
// //                 disablePast={submissionType === "self"}
// //               />
// //             )}
// //           </div>

// //           <div className="mt-3">
// //             <FormInput
// //               name="days"
// //               label="Total Number Of Days"
// //               type="number"
// //               required
// //               readOnly
// //               hint={
// //                 isHalfDayType
// //                   ? "Fixed at 0.5 for a half-day application"
// //                   : "Calculated automatically from the selected dates"
// //               }
// //             />
// //           </div>

// //           {insufficientBalance && selectedBalance && (
// //             <div
// //               className="mt-3"
// //               style={{
// //                 padding: "8px 12px",
// //                 borderRadius: "var(--r)",
// //                 background: "var(--danger-lt, #fdecea)",
// //                 border: "1px solid var(--danger)",
// //                 color: "var(--danger)",
// //                 fontSize: 12,
// //                 fontWeight: 500,
// //               }}
// //             >
// //               Insufficient {selectedBalance.name} balance — only{" "}
// //               {selectedBalance.remaining} day(s) remaining, requested{" "}
// //               {daysValue}.
// //             </div>
// //           )}

// //           <div className="mt-3">
// //             <FormTextarea
// //               name="reason"
// //               label="Reason"
// //               required
// //               placeholder="Please enter reason for leave"
// //             />
// //           </div>
// //         </div>

// //         {/* ── Management / HOD Details ───────────────────────────────────── */}
// //         <div className="card p-5 mb-4">
// //           <SectionTitle title="Management / HOD Details" />
// //           <div
// //             style={{
// //               display: "grid",
// //               gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
// //               gap: 12,
// //             }}
// //           >
// //             <FormSelect
// //               name="hod_name"
// //               label="Management / HOD's Name"
// //               required
// //               placeholder="Select"
// //               options={HOD_OPTIONS}
// //             />
// //             <FormSelect
// //               name="coordinator_name"
// //               label="Coordinator's Name if Applicable"
// //               required
// //               placeholder="Select"
// //               options={COORDINATOR_OPTIONS}
// //             />
// //           </div>

// //           <div className="mt-3">
// //             <FormCheckbox
// //               name="undertaking_accepted"
// //               label="I have applied for leave, but I know that in case of exigency I may have to attend duty."
// //             />
// //           </div>
// //         </div>
// //         <div className="flex justify-end gap-2">
// //           <button
// //             type="button"
// //             className="btn btn-sec"
// //             onClick={() => router.push("/leaves")}
// //             disabled={applyLeave.isPending}
// //           >
// //             Cancel
// //           </button>
// //           <button
// //             type="submit"
// //             className="btn btn-pri"
// //             disabled={applyLeave.isPending || insufficientBalance}
// //           >
// //             {applyLeave.isPending
// //               ? "Submitting…"
// //               : "✓ Submit Leave Application"}
// //           </button>
// //         </div>
// //       </form>
// //     </FormProvider>
// //   );
// // }






















// // "use client";
// // import { useEffect, useRef, useState } from "react";
// // import { useForm, FormProvider, useWatch } from "react-hook-form";
// // import { zodResolver } from "@hookform/resolvers/zod";
// // import { useRouter } from "next/navigation";
// // import { usePermission } from "../../auth/hooks/usePermission";
// // import { useEmployee } from "../../employees/hooks/useEmployees";
// // import { searchManagers } from "../../../services/api/employee.service";
// // import {
// //   useLeaveTypeOptions,
// //   useApplyLeave,
// //   useLeaveBalances,
// // } from "../hooks/useLeaves";
// // import {
// //   applyLeaveSchema,
// //   type ApplyLeaveFormData,
// // } from "../validations/leave.schema";
// // import type { ApplyLeaveDto } from "../../../services/api/leave.service";
// // import { FormInput } from "../../../components/form/FormInput";
// // import { FormSelect } from "../../../components/form/FormSelect";
// // import { FormRadio } from "../../../components/form/FormRadio";
// // import { FormTextarea } from "../../../components/form/FormTextarea";
// // import { FormCheckbox } from "../../../components/form/FormCheckbox";
// // import { FormDatePicker } from "../../../components/form/FormDatePicker";
// // import { FormTimeInput } from "../../../components/form/FormTimeInput";
// // import { FormAsyncSelect } from "../../../components/form/FormAsyncSelect";
// // import { SectionTitle } from "../../../components/form/SectionTitle";

// // // Fixed dropdown — these two entries drive the From/To Time requirement below.
// // const LEAVE_APPLICATION_TYPE_OPTIONS = [
// //   { value: "arrival_late", label: "Arrival Late (Short Leave)" },
// //   { value: "leaving_early", label: "Leaving Early (Short Leave)" },
// //   { value: "first_half", label: "1st Half" },
// //   { value: "second_half", label: "2nd Half" },
// //   { value: "full_day", label: "Full Day" },
// // ];
// // const SHORT_LEAVE_APPLICATION_TYPES = new Set([
// //   "arrival_late",
// //   "leaving_early",
// // ]);

// // // Fixed management/HOD list — not tied to employee records.
// // const HOD_OPTIONS = [
// //   { value: "Sh. Preveen Kr. Narula", label: "Sh. Preveen Kr. Narula" },
// //   { value: "Harshil Narula", label: "Harshil Narula" },
// //   { value: "Rudraksh Narula", label: "Rudraksh Narula" },
// // ];

// // // Fixed coordinator list.
// // const COORDINATOR_OPTIONS = [
// //   { value: "Not Applicable", label: "Not Applicable" },
// //   { value: "Harish Bathla", label: "Harish Bathla" },
// //   { value: "Bhavit Shakya", label: "Bhavit Shakya" },
// //   { value: "Ashish Kumar Roy", label: "Ashish Kumar Roy" },
// // ];

// // // One accent per card position (not per leave-type name, so it stays stable
// // // as leave types are added/renamed on the backend). Used only as a thin ring
// // // stroke and a small dot — the card itself stays neutral white/grey.
// // const BALANCE_ACCENTS = [
// //   "#4f46e5", // indigo
// //   "#0d9488", // teal
// //   "#d97706", // amber
// //   "#db2777", // pink
// //   "#7c3aed", // violet
// //   "#0891b2", // cyan
// // ];

// // const RING_R = 25;
// // const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

// // // Shape returned by GET /leaves/balances — matches leave.service#getBalances.
// // interface LeaveBalanceRow {
// //   leave_type_id: number;
// //   name: string;
// //   code: string;
// //   year: number;
// //   allocated: number;
// //   used: number;
// //   pending: number;
// //   carried_forward: number;
// //   available: number;
// // }

// // // ─── Read-only display field (Personal Details) — not part of the form payload ──
// // function ReadOnlyField({ label, value }: { label: string; value: string }) {
// //   return (
// //     <div className="form-field fg">
// //       <label className="field-label">{label}</label>
// //       <input className="form-input readonly" readOnly value={value || "—"} />
// //     </div>
// //   );
// // }

// // // ─── One selectable "leave type" tile in the balance overview ─────────────────
// // function LeaveBalanceCard({
// //   label,
// //   balance,
// //   selected,
// //   disabled,
// //   onSelect,
// //   accent,
// // }: {
// //   label: string;
// //   balance?: LeaveBalanceRow;
// //   selected: boolean;
// //   disabled: boolean;
// //   onSelect: () => void;
// //   accent: string;
// // }) {
// //   const [hovered, setHovered] = useState(false);

// //   const allocated = balance?.allocated ?? 0;
// //   const used = balance?.used ?? 0;
// //   const pending = balance?.pending ?? 0;
// //   const available = balance?.available ?? 0;
// //   const exhausted = !!balance && available <= 0;

// //   const ringColor = exhausted ? "#d1d5db" : accent;
// //   const fillRatio = allocated > 0 ? Math.min(1, Math.max(0, available / allocated)) : 0;
// //   const dashOffset = RING_CIRCUMFERENCE * (1 - fillRatio);

// //   const lift = hovered && !disabled;

// //   return (
// //     <button
// //       type="button"
// //       onClick={onSelect}
// //       disabled={disabled}
// //       aria-pressed={selected}
// //       onMouseEnter={() => setHovered(true)}
// //       onMouseLeave={() => setHovered(false)}
// //       style={{
// //         all: "unset",
// //         boxSizing: "border-box",
// //         position: "relative",
// //         display: "flex",
// //         flexDirection: "column",
// //         alignItems: "center",
// //         textAlign: "center",
// //         gap: 6,
// //         padding: "18px 14px 14px",
// //         borderRadius: 14,
// //         background: "#ffffff",
// //         border: selected ? `1.5px solid ${accent}` : "1px solid #e6e8eb",
// //         boxShadow: selected
// //           ? `0 0 0 3px ${accent}1f`
// //           : lift
// //             ? "0 6px 16px rgba(15, 23, 42, 0.08)"
// //             : "0 1px 2px rgba(15, 23, 42, 0.03)",
// //         transform: lift ? "translateY(-2px)" : "translateY(0)",
// //         cursor: disabled ? "not-allowed" : "pointer",
// //         opacity: disabled ? 0.55 : 1,
// //         transition: "box-shadow 0.15s ease, transform 0.15s ease, border-color 0.15s ease",
// //       }}
// //     >
// //       {selected && (
// //         <span
// //           style={{
// //             position: "absolute",
// //             top: 10,
// //             right: 10,
// //             width: 16,
// //             height: 16,
// //             borderRadius: "50%",
// //             background: accent,
// //             display: "flex",
// //             alignItems: "center",
// //             justifyContent: "center",
// //           }}
// //         >
// //           <svg width={9} height={9} viewBox="0 0 12 12" fill="none">
// //             <path d="M2 6.2L4.8 9L10 3" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
// //           </svg>
// //         </span>
// //       )}

// //       {exhausted && (
// //         <span
// //           style={{
// //             position: "absolute",
// //             top: 10,
// //             left: 10,
// //             fontSize: 9,
// //             fontWeight: 700,
// //             letterSpacing: "0.04em",
// //             textTransform: "uppercase",
// //             color: "#b91c1c",
// //             background: "#fee2e2",
// //             borderRadius: 999,
// //             padding: "2px 6px",
// //           }}
// //         >
// //           Used up
// //         </span>
// //       )}

// //       <div style={{ position: "relative", width: 64, height: 64, marginTop: 6 }}>
// //         <svg width={64} height={64} viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)" }}>
// //           <circle cx={32} cy={32} r={RING_R} fill="none" stroke="#eef0f3" strokeWidth={5} />
// //           <circle
// //             cx={32}
// //             cy={32}
// //             r={RING_R}
// //             fill="none"
// //             stroke={ringColor}
// //             strokeWidth={5}
// //             strokeLinecap="round"
// //             strokeDasharray={RING_CIRCUMFERENCE}
// //             strokeDashoffset={dashOffset}
// //             style={{ transition: "stroke-dashoffset 0.4s ease" }}
// //           />
// //         </svg>
// //         <div
// //           style={{
// //             position: "absolute",
// //             inset: 0,
// //             display: "flex",
// //             alignItems: "center",
// //             justifyContent: "center",
// //           }}
// //         >
// //           <span style={{ fontSize: 18, fontWeight: 700, color: "#111827", lineHeight: 1 }}>
// //             {available}
// //           </span>
// //         </div>
// //       </div>

// //       <span style={{ fontSize: 12.5, fontWeight: 600, color: "#1f2937", marginTop: 2 }}>
// //         {label}
// //       </span>

// //       <span style={{ fontSize: 10.5, color: "#9ca3af" }}>
// //         {balance ? `of ${allocated} allocated` : "not allocated"}
// //       </span>

// //       {balance && (used > 0 || pending > 0) && (
// //         <span style={{ fontSize: 10, color: "#9ca3af" }}>
// //           {used} used{pending ? ` · ${pending} pending` : ""}
// //         </span>
// //       )}

// //       {exhausted && (
// //         <span style={{ fontSize: 10, color: "#b91c1c", fontWeight: 500, marginTop: 2, lineHeight: 1.3 }}>
// //           Already used up for this year
// //         </span>
// //       )}
// //     </button>
// //   );
// // }

// // interface Props {
// //   onSuccess?: () => void;
// // }

// // export function ApplyLeaveForm({ onSuccess }: Props) {
// //   const router = useRouter();
// //   const { user, canApprove } = usePermission();
// //   const canActOnBehalf = canApprove("leaves");
// //   const applyLeave = useApplyLeave();
// //   const leaveTypeOptions = useLeaveTypeOptions();

// //   const methods = useForm<ApplyLeaveFormData>({
// //     resolver: zodResolver(applyLeaveSchema),
// //     defaultValues: {
// //       submission_type: "self",
// //       target_employee_id: null,
// //       leave_type_id: undefined as any,
// //       leave_application_type: undefined as any,
// //       is_short_leave: false,
// //       from_date: "",
// //       to_date: "",
// //       from_time: "",
// //       to_time: "",
// //       days: undefined as any,
// //       reason: "",
// //       hod_name: "",
// //       coordinator_name: "",
// //       undertaking_accepted: false as any,
// //     },
// //   });

// //   const { handleSubmit, control, setValue, watch } = methods;
// //   const submissionType = useWatch({ control, name: "submission_type" });
// //   const targetEmployeeId = useWatch({ control, name: "target_employee_id" });
// //   const leaveTypeId = useWatch({ control, name: "leave_type_id" });
// //   const leaveApplicationType = useWatch({
// //     control,
// //     name: "leave_application_type",
// //   });
// //   const fromDate = useWatch({ control, name: "from_date" });
// //   const toDate = useWatch({ control, name: "to_date" });
// //   const daysValue = useWatch({ control, name: "days" });

// //   // ── Personal details source: self or admin-picked employee ─────────────────
// //   const { data: selfEmployee } = useEmployee(user?.employeeId ?? 0);
// //   const { data: targetEmployee } = useEmployee(
// //     submissionType === "admin" ? (targetEmployeeId ?? 0) : 0,
// //   );
// //   const personalSource: any =
// //     submissionType === "admin" ? targetEmployee : selfEmployee;

// //   // ── Leave balance for whoever this application is for — self by default,
// //   // the admin-picked employee when filing on someone else's behalf.
// //   const { data: balances } = useLeaveBalances(
// //     submissionType === "admin" ? (targetEmployeeId ?? undefined) : undefined,
// //     submissionType === "self" || !!targetEmployeeId,
// //   ) as { data: LeaveBalanceRow[] | undefined };

// //   const balanceByType = new Map(
// //     (balances ?? []).map((b) => [b.leave_type_id, b]),
// //   );

// //   // ── Leave Application Type options are restricted by Type of Leave: Short
// //   // Leave only offers Arrival Late / Leaving Early, every other type only
// //   // offers 1st Half / 2nd Half / Full Day.
// //   const isShortLeaveType =
// //     leaveTypeOptions.data.find((o) => o.value === leaveTypeId)?.code === "ShL";
// //   const applicationTypeOptions = LEAVE_APPLICATION_TYPE_OPTIONS.filter(
// //     (o) => SHORT_LEAVE_APPLICATION_TYPES.has(o.value) === isShortLeaveType,
// //   );

// //   // NOTE: the balances service returns `available` (allocated + carried
// //   // forward - used - pending), not `remaining` — that field never existed on
// //   // the payload, so the old insufficient-balance check silently no-opped.
// //   const selectedBalance = balanceByType.get(leaveTypeId);
// //   const insufficientBalance =
// //     !!selectedBalance && !!daysValue && daysValue > selectedBalance.available;
// //   const selectedExhausted = !!selectedBalance && selectedBalance.available <= 0;

// //   // Clear the Leave Application Type selection only when crossing the
// //   // Short/non-Short boundary — switching e.g. Earned → Casual keeps it.
// //   const wasShortLeaveType = useRef(isShortLeaveType);
// //   useEffect(() => {
// //     if (wasShortLeaveType.current !== isShortLeaveType) {
// //       wasShortLeaveType.current = isShortLeaveType;
// //       setValue("leave_application_type", undefined as any, {
// //         shouldValidate: false,
// //       });
// //     }
// //   }, [isShortLeaveType, setValue]);

// //   // ── Toggle is_short_leave when Leave Application Type changes ──────────────
// //   useEffect(() => {
// //     const isShort = SHORT_LEAVE_APPLICATION_TYPES.has(leaveApplicationType);
// //     setValue("is_short_leave", isShort, { shouldValidate: true });
// //     if (!isShort) {
// //       setValue("from_time", "");
// //       setValue("to_time", "");
// //     }
// //   }, [leaveApplicationType, setValue]);

// //   // ── Half day (1st/2nd Half): a single date, days fixed at 0.5 ──────────────
// //   const isHalfDayType =
// //     leaveApplicationType === "first_half" ||
// //     leaveApplicationType === "second_half";
// //   useEffect(() => {
// //     if (isHalfDayType && fromDate && toDate !== fromDate) {
// //       setValue("to_date", fromDate, { shouldValidate: true });
// //     }
// //   }, [isHalfDayType, fromDate, toDate, setValue]);

// //   // ── Total days: 0.5 for half day, otherwise calculated from the date range ──
// //   useEffect(() => {
// //     if (isHalfDayType) {
// //       setValue("days", 0.5, { shouldValidate: true });
// //       return;
// //     }
// //     if (!fromDate || !toDate) {
// //       setValue("days", undefined as any, { shouldValidate: true });
// //       return;
// //     }
// //     const from = new Date(fromDate + "T00:00:00");
// //     const to = new Date(toDate + "T00:00:00");
// //     const diff = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
// //     setValue("days", diff > 0 ? diff : (undefined as any), {
// //       shouldValidate: true,
// //     });
// //   }, [isHalfDayType, fromDate, toDate, setValue]);

// //   // ── Reset target employee when switching back to self ──────────────────────
// //   useEffect(() => {
// //     if (submissionType === "self") setValue("target_employee_id", null);
// //   }, [submissionType, setValue]);

// //   const onSubmit = async (data: ApplyLeaveFormData) => {
// //     const employee_id =
// //       data.submission_type === "admin"
// //         ? data.target_employee_id!
// //         : user!.employeeId;
// //     const payload: ApplyLeaveDto = {
// //       employee_id,
// //       leave_type_id: data.leave_type_id,
// //       leave_application_type: data.leave_application_type,
// //       from_date: data.from_date,
// //       to_date: data.to_date,
// //       from_time: data.is_short_leave ? data.from_time || undefined : undefined,
// //       to_time: data.is_short_leave ? data.to_time || undefined : undefined,
// //       days: data.days,
// //       reason: data.reason,
// //       hod_name: data.hod_name,
// //       coordinator_name: data.coordinator_name,
// //       undertaking_accepted: data.undertaking_accepted,
// //     };
// //     await applyLeave.mutateAsync(payload);
// //     if (onSuccess) onSuccess();
// //     else router.push("/leaves");
// //   };

// //   const setNumeric = (field: "leave_type_id") => (v: string) => {
// //     setValue(field, (v ? Number(v) : undefined) as any, {
// //       shouldValidate: true,
// //       shouldDirty: true,
// //     });
// //   };

// //   return (
// //     <FormProvider {...methods}>
// //       <form onSubmit={handleSubmit(onSubmit)}>
// //         {/* ── Submission Type ────────────────────────────────────────────── */}
// //         {canActOnBehalf && (
// //           <div className="card p-5 mb-4">
// //             <SectionTitle
// //               title="Submission Type"
// //               subtitle="Apply for yourself, or file on behalf of another employee"
// //             />
// //             <FormRadio
// //               name="submission_type"
// //               label="Submission Type"
// //               required
// //               layout="horizontal"
// //               options={[
// //                 { value: "self", label: "Apply Leave" },
// //                 { value: "admin", label: "Admin Use Only" },
// //               ]}
// //             />
// //             {submissionType === "admin" && (
// //               <div className="mt-3">
// //                 <FormAsyncSelect
// //                   name="target_employee_id"
// //                   label="Employee"
// //                   required
// //                   placeholder="Search by name or employee code…"
// //                   loadOptions={async (q) => {
// //                     const res: any = await searchManagers(q);
// //                     return (res?.data || []).map((e: any) => ({
// //                       value: e.id,
// //                       label: `${e.first_name} ${e.last_name} (${e.employee_code})`,
// //                     }));
// //                   }}
// //                 />
// //               </div>
// //             )}
// //           </div>
// //         )}

// //         {/* ── Personal Details ───────────────────────────────────────────── */}
// //         <div className="card p-5 mb-4">
// //           <SectionTitle
// //             title="Personal Details"
// //             subtitle="Auto-filled from the employee profile"
// //           />
// //           <div
// //             style={{
// //               display: "grid",
// //               gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
// //               gap: 12,
// //             }}
// //           >
// //             <ReadOnlyField
// //               label="Employee Code"
// //               value={personalSource?.employee_code ?? ""}
// //             />
// //             <ReadOnlyField
// //               label="Full Name"
// //               value={[personalSource?.first_name, personalSource?.last_name]
// //                 .filter(Boolean)
// //                 .join(" ")}
// //             />
// //             <ReadOnlyField label="Email" value={personalSource?.email ?? ""} />
// //             <ReadOnlyField
// //               label="Company"
// //               value={personalSource?.company?.name ?? ""}
// //             />
// //             <ReadOnlyField
// //               label="Department"
// //               value={personalSource?.department?.department_name ?? ""}
// //             />
// //             <ReadOnlyField
// //               label="Designation"
// //               value={personalSource?.designation?.designation_name ?? ""}
// //             />
// //           </div>
// //         </div>

// //         {/* ── Leave Details ───────────────────────────────────────────────── */}
// //         <div className="card p-5 mb-4">
// //           <SectionTitle
// //             title="Leave Details"
// //             subtitle="Pick a leave type below — the card shows what you have left"
// //           />

// //           {/* Leave balance overview — clickable cards drive leave_type_id */}
// //           {leaveTypeOptions.data.length > 0 && (
// //             <div
// //               style={{
// //                 display: "grid",
// //                 gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))",
// //                 gap: 12,
// //               }}
// //             >
// //               {leaveTypeOptions.data.map((opt, i) => {
// //                 const bal = balanceByType.get(opt.value);
// //                 const exhausted = !!bal && bal.available <= 0;
// //                 return (
// //                   <LeaveBalanceCard
// //                     key={opt.value}
// //                     label={opt.label}
// //                     balance={bal}
// //                     selected={leaveTypeId === opt.value}
// //                     disabled={exhausted}
// //                     onSelect={() => setNumeric("leave_type_id")(String(opt.value))}
// //                     accent={BALANCE_ACCENTS[i % BALANCE_ACCENTS.length]}
// //                   />
// //                 );
// //               })}
// //             </div>
// //           )}

// //           <div
// //             style={{
// //               display: "grid",
// //               gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
// //               gap: 12,
// //               marginTop: 16,
// //             }}
// //           >
// //             <FormSelect
// //               name="leave_type_id"
// //               label="Type of Leave"
// //               required
// //               placeholder="Select leave type"
// //               options={leaveTypeOptions.data.map((o) => {
// //                 const bal = balanceByType.get(o.value);
// //                 const exhausted = !!bal && bal.available <= 0;
// //                 return {
// //                   value: o.value,
// //                   label: exhausted ? `${o.label} (used up)` : o.label,
// //                   disabled: exhausted,
// //                 };
// //               })}
// //               onChange={setNumeric("leave_type_id")}
// //               hint={
// //                 selectedBalance
// //                   ? `${selectedBalance.available} of ${selectedBalance.allocated} ${selectedBalance.code} day(s) remaining`
// //                   : undefined
// //               }
// //             />
// //             <FormSelect
// //               name="leave_application_type"
// //               label="Leave Application Type"
// //               required
// //               placeholder={
// //                 leaveTypeId
// //                   ? "Select application type"
// //                   : "Select Type of Leave first"
// //               }
// //               disabled={!leaveTypeId || selectedExhausted}
// //               options={applicationTypeOptions}
// //             />
// //           </div>

// //           {selectedExhausted && selectedBalance && (
// //             <div
// //               className="mt-3"
// //               style={{
// //                 padding: "10px 14px",
// //                 borderRadius: 10,
// //                 background: "#fdecea",
// //                 border: "1px solid #f5b5b0",
// //                 color: "#b3261e",
// //                 fontSize: 12.5,
// //                 fontWeight: 500,
// //               }}
// //             >
// //               You've already used your entire {selectedBalance.name}{" "}
// //               allowance for this year — pick a different leave type above.
// //             </div>
// //           )}

// //           {watch("is_short_leave") && (
// //             <div
// //               style={{
// //                 display: "grid",
// //                 gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
// //                 gap: 12,
// //                 marginTop: 12,
// //               }}
// //             >
// //               <FormTimeInput
// //                 name="from_time"
// //                 label="From Time"
// //                 required
// //                 hint="For Short Leave only"
// //               />
// //               <FormTimeInput
// //                 name="to_time"
// //                 label="To Time"
// //                 required
// //                 hint="For Short Leave only"
// //               />
// //             </div>
// //           )}

// //           <div
// //             style={{
// //               display: "grid",
// //               gridTemplateColumns: isHalfDayType
// //                 ? "1fr"
// //                 : "repeat(auto-fit, minmax(200px, 1fr))",
// //               gap: 12,
// //               marginTop: 12,
// //             }}
// //           >
// //             <FormDatePicker
// //               name="from_date"
// //               label={isHalfDayType ? "Date" : "From Date"}
// //               required
// //               disablePast={submissionType === "self"}
// //             />
// //             {!isHalfDayType && (
// //               <FormDatePicker
// //                 name="to_date"
// //                 label="To Date"
// //                 required
// //                 disablePast={submissionType === "self"}
// //               />
// //             )}
// //           </div>

// //           <div className="mt-3">
// //             <FormInput
// //               name="days"
// //               label="Total Number Of Days"
// //               type="number"
// //               required
// //               readOnly
// //               hint={
// //                 isHalfDayType
// //                   ? "Fixed at 0.5 for a half-day application"
// //                   : "Calculated automatically from the selected dates"
// //               }
// //             />
// //           </div>

// //           {insufficientBalance && selectedBalance && !selectedExhausted && (
// //             <div
// //               className="mt-3"
// //               style={{
// //                 padding: "10px 14px",
// //                 borderRadius: 10,
// //                 background: "#fdecea",
// //                 border: "1px solid #f5b5b0",
// //                 color: "#b3261e",
// //                 fontSize: 12.5,
// //                 fontWeight: 500,
// //               }}
// //             >
// //               Insufficient {selectedBalance.name} balance — only{" "}
// //               {selectedBalance.available} day(s) remaining, requested{" "}
// //               {daysValue}.
// //             </div>
// //           )}

// //           <div className="mt-3">
// //             <FormTextarea
// //               name="reason"
// //               label="Reason"
// //               required
// //               placeholder="Please enter reason for leave"
// //             />
// //           </div>
// //         </div>

// //         {/* ── Management / HOD Details ───────────────────────────────────── */}
// //         <div className="card p-5 mb-4">
// //           <SectionTitle title="Management / HOD Details" />
// //           <div
// //             style={{
// //               display: "grid",
// //               gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
// //               gap: 12,
// //             }}
// //           >
// //             <FormSelect
// //               name="hod_name"
// //               label="Management / HOD's Name"
// //               required
// //               placeholder="Select"
// //               options={HOD_OPTIONS}
// //             />
// //             <FormSelect
// //               name="coordinator_name"
// //               label="Coordinator's Name if Applicable"
// //               required
// //               placeholder="Select"
// //               options={COORDINATOR_OPTIONS}
// //             />
// //           </div>

// //           <div className="mt-3">
// //             <FormCheckbox
// //               name="undertaking_accepted"
// //               label="I have applied for leave, but I know that in case of exigency I may have to attend duty."
// //             />
// //           </div>
// //         </div>

// //         <div className="flex justify-end gap-2">
// //           <button
// //             type="button"
// //             className="btn btn-sec"
// //             onClick={() => router.push("/leaves")}
// //             disabled={applyLeave.isPending}
// //           >
// //             Cancel
// //           </button>
// //           <button
// //             type="submit"
// //             className="btn btn-pri"
// //             disabled={
// //               applyLeave.isPending || insufficientBalance || selectedExhausted
// //             }
// //           >
// //             {applyLeave.isPending
// //               ? "Submitting…"
// //               : "✓ Submit Leave Application"}
// //           </button>
// //         </div>
// //       </form>

// //       <style jsx>{`
// //         .lb-shell {
// //           --lb-radius: 14px;
// //         }

// //         .lb-grid {
// //           display: grid;
// //           grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
// //           gap: 12px;
// //         }

// //         .lb-card {
// //           all: unset;
// //           box-sizing: border-box;
// //           cursor: pointer;
// //           display: flex;
// //           flex-direction: column;
// //           gap: 8px;
// //           padding: 14px 16px;
// //           border-radius: var(--lb-radius);
// //           background: var(--lb-bg);
// //           border: 2px solid transparent;
// //           transition: transform 0.15s ease, box-shadow 0.15s ease,
// //             border-color 0.15s ease;
// //         }

// //         .lb-card:hover:not(:disabled) {
// //           transform: translateY(-2px);
// //           box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
// //         }

// //         .lb-card:focus-visible {
// //           outline: 3px solid var(--lb-accent);
// //           outline-offset: 2px;
// //         }

// //         .lb-card--selected {
// //           border-color: var(--lb-accent);
// //           box-shadow: 0 6px 18px rgba(15, 23, 42, 0.1);
// //         }

// //         .lb-card:disabled {
// //           cursor: not-allowed;
// //           opacity: 0.55;
// //           filter: grayscale(0.35);
// //         }

// //         .lb-card--exhausted {
// //           background: linear-gradient(135deg, #fef2f2, #fee2e2);
// //         }

// //         .lb-card__top {
// //           display: flex;
// //           align-items: flex-start;
// //           justify-content: space-between;
// //           gap: 8px;
// //         }

// //         .lb-card__name {
// //           font-size: 13px;
// //           font-weight: 600;
// //           color: var(--lb-text);
// //           line-height: 1.25;
// //         }

// //         .lb-card__badge {
// //           flex-shrink: 0;
// //           font-size: 10px;
// //           font-weight: 700;
// //           text-transform: uppercase;
// //           letter-spacing: 0.03em;
// //           padding: 2px 7px;
// //           border-radius: 999px;
// //           background: #dc2626;
// //           color: #fff;
// //         }

// //         .lb-card__figure {
// //           display: flex;
// //           align-items: baseline;
// //           gap: 6px;
// //         }

// //         .lb-card__available {
// //           font-size: 26px;
// //           font-weight: 700;
// //           color: var(--lb-text);
// //           line-height: 1;
// //         }

// //         .lb-card__of {
// //           font-size: 11px;
// //           color: rgba(15, 23, 42, 0.55);
// //         }

// //         .lb-card__track {
// //           height: 6px;
// //           border-radius: 999px;
// //           background: rgba(15, 23, 42, 0.08);
// //           overflow: hidden;
// //         }

// //         .lb-card__fill {
// //           height: 100%;
// //           border-radius: 999px;
// //           background: var(--lb-accent);
// //           transition: width 0.3s ease;
// //         }

// //         .lb-card__meta {
// //           font-size: 11px;
// //           color: rgba(15, 23, 42, 0.6);
// //         }

// //         .lb-card__note {
// //           font-size: 11px;
// //           font-weight: 600;
// //           color: #b91c1c;
// //           line-height: 1.3;
// //         }

// //         .lb-alert {
// //           padding: 10px 14px;
// //           border-radius: 10px;
// //           font-size: 12.5px;
// //           font-weight: 500;
// //         }

// //         .lb-alert--danger {
// //           background: #fdecea;
// //           border: 1px solid #f5b5b0;
// //           color: #b3261e;
// //         }
// //       `}</style>
// //     </FormProvider>
// //   );
// // }













// "use client";
// import { useEffect, useRef } from "react";
// import { useForm, FormProvider, useWatch } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useRouter } from "next/navigation";
// import { usePermission } from "../../auth/hooks/usePermission";
// import { useEmployee } from "../../employees/hooks/useEmployees";
// import { searchManagers } from "../../../services/api/employee.service";
// import {
//   useLeaveTypeOptions,
//   useApplyLeave,
//   useLeaveBalances,
// } from "../hooks/useLeaves";
// import {
//   applyLeaveSchema,
//   type ApplyLeaveFormData,
// } from "../validations/leave.schema";
// import type { ApplyLeaveDto } from "../../../services/api/leave.service";
// import { FormInput } from "../../../components/form/FormInput";
// import { FormTextarea } from "../../../components/form/FormTextarea";
// import { FormCheckbox } from "../../../components/form/FormCheckbox";
// import { FormDatePicker } from "../../../components/form/FormDatePicker";
// import { FormTimeInput } from "../../../components/form/FormTimeInput";
// import { FormAsyncSelect } from "../../../components/form/FormAsyncSelect";
// import { SectionTitle } from "../../../components/form/SectionTitle";

// // Fixed dropdown — these two entries drive the From/To Time requirement below.
// const LEAVE_APPLICATION_TYPE_OPTIONS = [
//   { value: "arrival_late", label: "Arrival Late", hint: "Short Leave" },
//   { value: "leaving_early", label: "Leaving Early", hint: "Short Leave" },
//   { value: "first_half", label: "1st Half" },
//   { value: "second_half", label: "2nd Half" },
//   { value: "full_day", label: "Full Day" },
// ];
// const SHORT_LEAVE_APPLICATION_TYPES = new Set([
//   "arrival_late",
//   "leaving_early",
// ]);

// // Fixed management/HOD list — not tied to employee records.
// const HOD_OPTIONS = [
//   { value: "Sh. Preveen Kr. Narula", label: "Sh. Preveen Kr. Narula" },
//   { value: "Harshil Narula", label: "Harshil Narula" },
//   { value: "Rudraksh Narula", label: "Rudraksh Narula" },
// ];

// // Fixed coordinator list.
// const COORDINATOR_OPTIONS = [
//   { value: "Not Applicable", label: "Not Applicable" },
//   { value: "Harish Bathla", label: "Harish Bathla" },
//   { value: "Bhavit Shakya", label: "Bhavit Shakya" },
//   { value: "Ashish Kumar Roy", label: "Ashish Kumar Roy" },
// ];

// // One accent per card position (not per leave-type name) so it stays stable
// // as leave types are added/renamed on the backend. Tailwind class names are
// // written out in full here (not composed at runtime) so the JIT scanner can
// // find them.
// const ACCENTS = [
//   { border: "border-indigo-500", ring: "ring-indigo-100", solid: "bg-indigo-500", stroke: "#6366f1" },
//   { border: "border-teal-500", ring: "ring-teal-100", solid: "bg-teal-500", stroke: "#14b8a6" },
//   { border: "border-amber-500", ring: "ring-amber-100", solid: "bg-amber-500", stroke: "#f59e0b" },
//   { border: "border-pink-500", ring: "ring-pink-100", solid: "bg-pink-500", stroke: "#ec4899" },
//   { border: "border-violet-500", ring: "ring-violet-100", solid: "bg-violet-500", stroke: "#8b5cf6" },
//   { border: "border-cyan-500", ring: "ring-cyan-100", solid: "bg-cyan-500", stroke: "#06b6d4" },
// ];
// const BRAND = ACCENTS[0];

// const RING_R = 25;
// const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

// // Shape returned by GET /leaves/balances — matches leave.service#getBalances.
// interface LeaveBalanceRow {
//   leave_type_id: number;
//   name: string;
//   code: string;
//   year: number;
//   allocated: number;
//   used: number;
//   pending: number;
//   carried_forward: number;
//   available: number;
// }

// // Derives display/eligibility state from a balance row. Kept separate from
// // rendering so the card grid, the summary banner, and validation all agree
// // on what "blocked" means and why.
// function balanceState(bal?: LeaveBalanceRow) {
//   const hasBalance = !!bal;
//   const allocated = bal?.allocated ?? 0;
//   const used = bal?.used ?? 0;
//   const pending = bal?.pending ?? 0;
//   const available = bal?.available ?? 0;

//   // Truly out of allocation: used alone already meets/exceeds what was granted.
//   const usedUp = hasBalance && allocated > 0 && used >= allocated;
//   // Days remain on paper, but every one of them is tied up in a pending
//   // (not-yet-approved) request — different from "used up" and worth saying so.
//   const pendingBlocked = hasBalance && !usedUp && available <= 0 && pending > 0;
//   const noAllocation = !hasBalance;
//   const blocked = usedUp || pendingBlocked || noAllocation;

//   // What the ring/number shows: allocated minus what's actually been used,
//   // ignoring pending — this is the number a person intuitively expects to see.
//   const visualRemaining = Math.max(0, allocated - used);

//   return {
//     hasBalance,
//     allocated,
//     used,
//     pending,
//     available,
//     usedUp,
//     pendingBlocked,
//     noAllocation,
//     blocked,
//     visualRemaining,
//   };
// }

// // ─── Small primitives shared by every "pick one of these cards" field ─────────
// function FieldLabel({
//   children,
//   required,
// }: {
//   children: React.ReactNode;
//   required?: boolean;
// }) {
//   return (
//     <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
//       {children}
//       {required && <span className="text-red-500"> *</span>}
//     </label>
//   );
// }

// function FieldError({ message }: { message?: string }) {
//   if (!message) return null;
//   return <p className="mt-1.5 text-[11.5px] font-medium text-red-600">{message}</p>;
// }

// function CheckBadge({ className = "" }: { className?: string }) {
//   return (
//     <span
//       className={`absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full ${className}`}
//     >
//       <svg width={9} height={9} viewBox="0 0 12 12" fill="none">
//         <path
//           d="M2 6.2L4.8 9L10 3"
//           stroke="#fff"
//           strokeWidth={1.8}
//           strokeLinecap="round"
//           strokeLinejoin="round"
//         />
//       </svg>
//     </span>
//   );
// }

// // ─── Generic selectable tile, used for every enumerable choice in the form ────
// function ChoiceCard({
//   label,
//   description,
//   selected,
//   disabled,
//   onSelect,
// }: {
//   label: string;
//   description?: string;
//   selected: boolean;
//   disabled?: boolean;
//   onSelect: () => void;
// }) {
//   return (
//     <button
//       type="button"
//       onClick={onSelect}
//       disabled={disabled}
//       aria-pressed={selected}
//       className={[
//         "relative flex flex-col gap-0.5 rounded-xl border bg-white px-4 py-3 text-left transition-all",
//         selected
//           ? `${BRAND.border} ring-4 ${BRAND.ring}`
//           : "border-gray-200 hover:border-gray-300 hover:shadow-sm",
//         disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
//       ].join(" ")}
//     >
//       {selected && <CheckBadge className={BRAND.solid} />}
//       <span className="pr-5 text-[13px] font-semibold text-gray-800">{label}</span>
//       {description && <span className="text-[11px] text-gray-400">{description}</span>}
//     </button>
//   );
// }

// // ─── Read-only info tile (Personal Details) ────────────────────────────────
// function InfoCard({ label, value }: { label: string; value: string }) {
//   return (
//     <div className="rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3">
//       <div className="text-[10.5px] font-semibold uppercase tracking-wide text-gray-400">
//         {label}
//       </div>
//       <div className="mt-1 truncate text-[13.5px] font-medium text-gray-800">
//         {value || "—"}
//       </div>
//     </div>
//   );
// }

// // ─── Leave-type tile with a ring-progress indicator ────────────────────────
// function LeaveBalanceCard({
//   label,
//   balance,
//   selected,
//   onSelect,
//   accent,
// }: {
//   label: string;
//   balance?: LeaveBalanceRow;
//   selected: boolean;
//   onSelect: () => void;
//   accent: (typeof ACCENTS)[number];
// }) {
//   const s = balanceState(balance);
//   const ringColor = s.usedUp || s.noAllocation ? "#d1d5db" : accent.stroke;
//   const ringRatio = s.allocated > 0 ? Math.min(1, s.visualRemaining / s.allocated) : 0;
//   const dashOffset = RING_CIRCUMFERENCE * (1 - ringRatio);

//   const badge = s.noAllocation
//     ? { text: "No allocation", classes: "bg-gray-100 text-gray-500" }
//     : s.usedUp
//       ? { text: "Used up", classes: "bg-red-50 text-red-600" }
//       : s.pendingBlocked
//         ? { text: "Pending hold", classes: "bg-amber-50 text-amber-600" }
//         : null;

//   const caption = s.noAllocation
//     ? "Not allocated this year"
//     : s.usedUp
//       ? "No allowance left this year"
//       : s.pendingBlocked
//         ? `${s.pending} day(s) awaiting approval`
//         : null;

//   return (
//     <button
//       type="button"
//       onClick={onSelect}
//       disabled={s.blocked}
//       aria-pressed={selected}
//       className={[
//         "relative flex flex-col items-center gap-1 rounded-2xl border bg-white px-4 pb-4 pt-5 text-center transition-all",
//         selected
//           ? `${accent.border} ring-4 ${accent.ring}`
//           : "border-gray-200 hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5",
//         s.blocked ? "cursor-not-allowed opacity-60" : "cursor-pointer",
//       ].join(" ")}
//     >
//       {selected && <CheckBadge className={accent.solid} />}
//       {badge && (
//         <span
//           className={`absolute left-2.5 top-2.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${badge.classes}`}
//         >
//           {badge.text}
//         </span>
//       )}

//       <div className="relative mt-1 h-16 w-16">
//         <svg width={64} height={64} viewBox="0 0 64 64" className="-rotate-90">
//           <circle cx={32} cy={32} r={RING_R} fill="none" stroke="#eef0f3" strokeWidth={5} />
//           <circle
//             cx={32}
//             cy={32}
//             r={RING_R}
//             fill="none"
//             stroke={ringColor}
//             strokeWidth={5}
//             strokeLinecap="round"
//             strokeDasharray={RING_CIRCUMFERENCE}
//             strokeDashoffset={dashOffset}
//             style={{ transition: "stroke-dashoffset 0.4s ease" }}
//           />
//         </svg>
//         <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-900">
//           {s.visualRemaining}
//         </div>
//       </div>

//       <span className="mt-1 text-[13px] font-semibold text-gray-800">{label}</span>
//       <span className="text-[10.5px] text-gray-400">
//         {s.hasBalance ? `of ${s.allocated} allocated` : "not on record"}
//       </span>

//       {s.hasBalance && (s.used > 0 || s.pending > 0) && (
//         <span className="text-[10px] text-gray-400">
//           {s.used} used{s.pending ? ` · ${s.pending} pending` : ""}
//         </span>
//       )}

//       {caption && (
//         <span
//           className={`mt-0.5 text-[10px] font-medium leading-snug ${
//             s.usedUp ? "text-red-600" : s.pendingBlocked ? "text-amber-600" : "text-gray-400"
//           }`}
//         >
//           {caption}
//         </span>
//       )}
//     </button>
//   );
// }

// interface Props {
//   onSuccess?: () => void;
// }

// export function ApplyLeaveForm({ onSuccess }: Props) {
//   const router = useRouter();
//   const { user, canApprove } = usePermission();
//   const canActOnBehalf = canApprove("leaves");
//   const applyLeave = useApplyLeave();
//   const leaveTypeOptions = useLeaveTypeOptions();

//   const methods = useForm<ApplyLeaveFormData>({
//     resolver: zodResolver(applyLeaveSchema),
//     defaultValues: {
//       submission_type: "self",
//       target_employee_id: null,
//       leave_type_id: undefined as any,
//       leave_application_type: undefined as any,
//       is_short_leave: false,
//       from_date: "",
//       to_date: "",
//       from_time: "",
//       to_time: "",
//       days: undefined as any,
//       reason: "",
//       hod_name: "",
//       coordinator_name: "",
//       undertaking_accepted: false as any,
//     },
//   });

//   const {
//     handleSubmit,
//     control,
//     setValue,
//     watch,
//     formState: { errors },
//   } = methods;

//   const setField = <K extends keyof ApplyLeaveFormData>(
//     field: K,
//     value: ApplyLeaveFormData[K],
//   ) => setValue(field, value, { shouldValidate: true, shouldDirty: true });

//   const submissionType = useWatch({ control, name: "submission_type" });
//   const targetEmployeeId = useWatch({ control, name: "target_employee_id" });
//   const leaveTypeId = useWatch({ control, name: "leave_type_id" });
//   const leaveApplicationType = useWatch({ control, name: "leave_application_type" });
//   const hodName = useWatch({ control, name: "hod_name" });
//   const coordinatorName = useWatch({ control, name: "coordinator_name" });
//   const fromDate = useWatch({ control, name: "from_date" });
//   const toDate = useWatch({ control, name: "to_date" });
//   const daysValue = useWatch({ control, name: "days" });

//   // ── Personal details source: self or admin-picked employee ─────────────────
//   const { data: selfEmployee } = useEmployee(user?.employeeId ?? 0);
//   const { data: targetEmployee } = useEmployee(
//     submissionType === "admin" ? (targetEmployeeId ?? 0) : 0,
//   );
//   const personalSource: any =
//     submissionType === "admin" ? targetEmployee : selfEmployee;

//   // ── Leave balance for whoever this application is for — self by default,
//   // the admin-picked employee when filing on someone else's behalf.
//   const { data: balances } = useLeaveBalances(
//     submissionType === "admin" ? (targetEmployeeId ?? undefined) : undefined,
//     submissionType === "self" || !!targetEmployeeId,
//   ) as { data: LeaveBalanceRow[] | undefined };

//   const balanceByType = new Map((balances ?? []).map((b) => [b.leave_type_id, b]));

//   // ── Leave Application Type options are restricted by Type of Leave: Short
//   // Leave only offers Arrival Late / Leaving Early, every other type only
//   // offers 1st Half / 2nd Half / Full Day.
//   const isShortLeaveType =
//     leaveTypeOptions.data.find((o) => o.value === leaveTypeId)?.code === "ShL";
//   const applicationTypeOptions = LEAVE_APPLICATION_TYPE_OPTIONS.filter(
//     (o) => SHORT_LEAVE_APPLICATION_TYPES.has(o.value) === isShortLeaveType,
//   );

//   const selectedBalance = balanceByType.get(leaveTypeId);
//   const selectedState = balanceState(selectedBalance);
//   const insufficientBalance =
//     !!selectedBalance && !!daysValue && daysValue > selectedBalance.available;

//   // Clear the Leave Application Type selection only when crossing the
//   // Short/non-Short boundary — switching e.g. Earned → Casual keeps it.
//   const wasShortLeaveType = useRef(isShortLeaveType);
//   useEffect(() => {
//     if (wasShortLeaveType.current !== isShortLeaveType) {
//       wasShortLeaveType.current = isShortLeaveType;
//       setValue("leave_application_type", undefined as any, { shouldValidate: false });
//     }
//   }, [isShortLeaveType, setValue]);

//   // ── Toggle is_short_leave when Leave Application Type changes ──────────────
//   useEffect(() => {
//     const isShort = SHORT_LEAVE_APPLICATION_TYPES.has(leaveApplicationType);
//     setValue("is_short_leave", isShort, { shouldValidate: true });
//     if (!isShort) {
//       setValue("from_time", "");
//       setValue("to_time", "");
//     }
//   }, [leaveApplicationType, setValue]);

//   // ── Half day (1st/2nd Half): a single date, days fixed at 0.5 ──────────────
//   const isHalfDayType =
//     leaveApplicationType === "first_half" || leaveApplicationType === "second_half";
//   useEffect(() => {
//     if (isHalfDayType && fromDate && toDate !== fromDate) {
//       setValue("to_date", fromDate, { shouldValidate: true });
//     }
//   }, [isHalfDayType, fromDate, toDate, setValue]);

//   // ── Total days: 0.5 for half day, otherwise calculated from the date range ──
//   useEffect(() => {
//     if (isHalfDayType) {
//       setValue("days", 0.5, { shouldValidate: true });
//       return;
//     }
//     if (!fromDate || !toDate) {
//       setValue("days", undefined as any, { shouldValidate: true });
//       return;
//     }
//     const from = new Date(fromDate + "T00:00:00");
//     const to = new Date(toDate + "T00:00:00");
//     const diff = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
//     setValue("days", diff > 0 ? diff : (undefined as any), { shouldValidate: true });
//   }, [isHalfDayType, fromDate, toDate, setValue]);

//   // ── Reset target employee when switching back to self ──────────────────────
//   useEffect(() => {
//     if (submissionType === "self") setValue("target_employee_id", null);
//   }, [submissionType, setValue]);

//   const onSubmit = async (data: ApplyLeaveFormData) => {
//     const employee_id =
//       data.submission_type === "admin" ? data.target_employee_id! : user!.employeeId;
//     const payload: ApplyLeaveDto = {
//       employee_id,
//       leave_type_id: data.leave_type_id,
//       leave_application_type: data.leave_application_type,
//       from_date: data.from_date,
//       to_date: data.to_date,
//       from_time: data.is_short_leave ? data.from_time || undefined : undefined,
//       to_time: data.is_short_leave ? data.to_time || undefined : undefined,
//       days: data.days,
//       reason: data.reason,
//       hod_name: data.hod_name,
//       coordinator_name: data.coordinator_name,
//       undertaking_accepted: data.undertaking_accepted,
//     };
//     await applyLeave.mutateAsync(payload);
//     if (onSuccess) onSuccess();
//     else router.push("/leaves");
//   };

//   return (
//     <FormProvider {...methods}>
//       <form onSubmit={handleSubmit(onSubmit)}>
//         {/* ── Submission Type ────────────────────────────────────────────── */}
//         {canActOnBehalf && (
//           <div className="card p-5 mb-4">
//             <SectionTitle
//               title="Submission Type"
//               subtitle="Apply for yourself, or file on behalf of another employee"
//             />
//             <FieldLabel required>Submission Type</FieldLabel>
//             <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
//               <ChoiceCard
//                 label="Apply for myself"
//                 description="File your own leave request"
//                 selected={submissionType === "self"}
//                 onSelect={() => setField("submission_type", "self")}
//               />
//               <ChoiceCard
//                 label="Admin use only"
//                 description="File on behalf of another employee"
//                 selected={submissionType === "admin"}
//                 onSelect={() => setField("submission_type", "admin")}
//               />
//             </div>
//             <FieldError message={errors.submission_type?.message as string} />

//             {submissionType === "admin" && (
//               <div className="mt-3">
//                 <FormAsyncSelect
//                   name="target_employee_id"
//                   label="Employee"
//                   required
//                   placeholder="Search by name or employee code…"
//                   loadOptions={async (q) => {
//                     const res: any = await searchManagers(q);
//                     return (res?.data || []).map((e: any) => ({
//                       value: e.id,
//                       label: `${e.first_name} ${e.last_name} (${e.employee_code})`,
//                     }));
//                   }}
//                 />
//               </div>
//             )}
//           </div>
//         )}

//         {/* ── Personal Details ───────────────────────────────────────────── */}
//         <div className="card p-5 mb-4">
//           <SectionTitle title="Personal Details" subtitle="Auto-filled from the employee profile" />
//           <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
//             <InfoCard label="Employee Code" value={personalSource?.employee_code ?? ""} />
//             <InfoCard
//               label="Full Name"
//               value={[personalSource?.first_name, personalSource?.last_name]
//                 .filter(Boolean)
//                 .join(" ")}
//             />
//             <InfoCard label="Email" value={personalSource?.email ?? ""} />
//             <InfoCard label="Company" value={personalSource?.company?.name ?? ""} />
//             <InfoCard
//               label="Department"
//               value={personalSource?.department?.department_name ?? ""}
//             />
//             <InfoCard
//               label="Designation"
//               value={personalSource?.designation?.designation_name ?? ""}
//             />
//           </div>
//         </div>

//         {/* ── Leave Details ───────────────────────────────────────────────── */}
//         <div className="card p-5 mb-4">
//           <SectionTitle
//             title="Leave Details"
//             subtitle="Pick a leave type below — the card shows what you actually have left"
//           />

//           {/* Type of Leave — the balance card IS the field */}
//           <FieldLabel required>Type of Leave</FieldLabel>
//           {leaveTypeOptions.data.length > 0 && (
//             <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
//               {leaveTypeOptions.data.map((opt, i) => (
//                 <LeaveBalanceCard
//                   key={opt.value}
//                   label={opt.label}
//                   balance={balanceByType.get(opt.value)}
//                   selected={leaveTypeId === opt.value}
//                   onSelect={() => setField("leave_type_id", opt.value as any)}
//                   accent={ACCENTS[i % ACCENTS.length]}
//                 />
//               ))}
//             </div>
//           )}
//           <FieldError message={errors.leave_type_id?.message as string} />

//           {selectedState.blocked && selectedBalance && (
//             <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] font-medium text-red-700">
//               {selectedState.usedUp
//                 ? `You've used your entire ${selectedBalance.name} allowance for this year — pick a different leave type above.`
//                 : `Every remaining ${selectedBalance.name} day is on a pending request — pick a different leave type, or wait for approval.`}
//             </div>
//           )}

//           {/* Leave Application Type */}
//           <div className="mt-5">
//             <FieldLabel required>Leave Application Type</FieldLabel>
//             {!leaveTypeId ? (
//               <p className="text-[12px] text-gray-400">Select a Type of Leave first</p>
//             ) : (
//               <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
//                 {applicationTypeOptions.map((o) => (
//                   <ChoiceCard
//                     key={o.value}
//                     label={o.label}
//                     description={o.hint}
//                     disabled={selectedState.blocked}
//                     selected={leaveApplicationType === o.value}
//                     onSelect={() => setField("leave_application_type", o.value as any)}
//                   />
//                 ))}
//               </div>
//             )}
//             <FieldError message={errors.leave_application_type?.message as string} />
//           </div>

//           {watch("is_short_leave") && (
//             <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
//               <FormTimeInput name="from_time" label="From Time" required hint="For Short Leave only" />
//               <FormTimeInput name="to_time" label="To Time" required hint="For Short Leave only" />
//             </div>
//           )}

//           <div
//             className={`mt-4 grid grid-cols-1 gap-3 ${isHalfDayType ? "" : "sm:grid-cols-2"}`}
//           >
//             <FormDatePicker
//               name="from_date"
//               label={isHalfDayType ? "Date" : "From Date"}
//               required
//               disablePast={submissionType === "self"}
//             />
//             {!isHalfDayType && (
//               <FormDatePicker
//                 name="to_date"
//                 label="To Date"
//                 required
//                 disablePast={submissionType === "self"}
//               />
//             )}
//           </div>

//           <div className="mt-3">
//             <FormInput
//               name="days"
//               label="Total Number Of Days"
//               type="number"
//               required
//               readOnly
//               hint={
//                 isHalfDayType
//                   ? "Fixed at 0.5 for a half-day application"
//                   : "Calculated automatically from the selected dates"
//               }
//             />
//           </div>

//           {insufficientBalance && selectedBalance && !selectedState.blocked && (
//             <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] font-medium text-red-700">
//               Insufficient {selectedBalance.name} balance — only {selectedBalance.available}{" "}
//               day(s) remaining, requested {daysValue}.
//             </div>
//           )}

//           <div className="mt-3">
//             <FormTextarea
//               name="reason"
//               label="Reason"
//               required
//               placeholder="Please enter reason for leave"
//             />
//           </div>
//         </div>

//         {/* ── Management / HOD Details ───────────────────────────────────── */}
//         <div className="card p-5 mb-4">
//           <SectionTitle title="Management / HOD Details" />

//           <FieldLabel required>Management / HOD's Name</FieldLabel>
//           <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
//             {HOD_OPTIONS.map((o) => (
//               <ChoiceCard
//                 key={o.value}
//                 label={o.label}
//                 selected={hodName === o.value}
//                 onSelect={() => setField("hod_name", o.value)}
//               />
//             ))}
//           </div>
//           <FieldError message={errors.hod_name?.message as string} />

//           <div className="mt-5">
//             <FieldLabel required>Coordinator's Name if Applicable</FieldLabel>
//             <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
//               {COORDINATOR_OPTIONS.map((o) => (
//                 <ChoiceCard
//                   key={o.value}
//                   label={o.label}
//                   selected={coordinatorName === o.value}
//                   onSelect={() => setField("coordinator_name", o.value)}
//                 />
//               ))}
//             </div>
//             <FieldError message={errors.coordinator_name?.message as string} />
//           </div>

//           <div className="mt-4">
//             <FormCheckbox
//               name="undertaking_accepted"
//               label="I have applied for leave, but I know that in case of exigency I may have to attend duty."
//             />
//           </div>
//         </div>

//         <div className="flex justify-end gap-2">
//           <button
//             type="button"
//             className="btn btn-sec"
//             onClick={() => router.push("/leaves")}
//             disabled={applyLeave.isPending}
//           >
//             Cancel
//           </button>
//           <button
//             type="submit"
//             className="btn btn-pri"
//             disabled={applyLeave.isPending || insufficientBalance || selectedState.blocked}
//           >
//             {applyLeave.isPending ? "Submitting…" : "✓ Submit Leave Application"}
//           </button>
//         </div>
//       </form>
//     </FormProvider>
//   );
// }






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

const FORM_ID = "apply-leave-form";

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
// find them. Kept deliberately muted (600-weight, not 500) so the leave-type
// grid reads as "color-coded reference data" rather than a decoration.
const ACCENTS = [
  { border: "border-indigo-600", ring: "ring-indigo-100", solid: "bg-indigo-600", stroke: "#4f46e5", soft: "text-indigo-700 bg-indigo-50" },
  { border: "border-teal-600", ring: "ring-teal-100", solid: "bg-teal-600", stroke: "#0d9488", soft: "text-teal-700 bg-teal-50" },
  { border: "border-amber-600", ring: "ring-amber-100", solid: "bg-amber-600", stroke: "#d97706", soft: "text-amber-700 bg-amber-50" },
  { border: "border-rose-600", ring: "ring-rose-100", solid: "bg-rose-600", stroke: "#e11d48", soft: "text-rose-700 bg-rose-50" },
  { border: "border-violet-600", ring: "ring-violet-100", solid: "bg-violet-600", stroke: "#7c3aed", soft: "text-violet-700 bg-violet-50" },
  { border: "border-cyan-600", ring: "ring-cyan-100", solid: "bg-cyan-600", stroke: "#0891b2", soft: "text-cyan-700 bg-cyan-50" },
];
// Neutral selection color for plain either/or choices (submission type,
// application type, HOD, coordinator) — reserved separately from ACCENTS so
// the bright colors stay meaningful (leave-type identity) rather than
// decorative. A near-black selection state reads as restrained and deliberate
// next to the colorful balance cards.
const BRAND = { border: "border-slate-900", ring: "ring-slate-900/10", solid: "bg-slate-900" };

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
// rendering so the card grid, the summary panel, and validation all agree
// on what "blocked" means and why.
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

// ─── Page chrome ────────────────────────────────────────────────────────────
function PageHeader() {
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center gap-1.5 text-[12.5px] font-medium text-slate-400">
        <span>Leaves</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-slate-300">
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-slate-600">New Application</span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-slate-900">Apply for Leave</h1>
          <p className="mt-1 text-[13.5px] text-slate-500">
            Complete the sections below in order — later fields adapt to what you choose first.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Numbered section shell — the sections genuinely are sequential (leave
// type gates application type, which gates the time fields), so a step rail
// encodes real structure rather than decorating the form. ─────────────────
function Section({
  index,
  total,
  title,
  subtitle,
  children,
}: {
  index: number;
  total: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[12.5px] font-bold text-white">
          {index}
        </div>
        {index < total && <div className="mt-1 w-px flex-1 bg-slate-200" />}
      </div>
      <div className="flex-1 pb-8">
        <div className="mb-4">
          <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[12.5px] text-slate-500">{subtitle}</p>}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
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
    <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
      {children}
      {required && <span className="text-rose-500"> *</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-[12px] font-medium text-rose-600">
      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" className="shrink-0">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2} />
        <path d="M12 8v5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
        <circle cx="12" cy="16" r="0.9" fill="currentColor" />
      </svg>
      {message}
    </p>
  );
}

function CheckBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full shadow-sm ${className}`}
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
        "relative flex flex-col gap-0.5 rounded-xl border bg-white px-4 py-3 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2",
        selected
          ? `${BRAND.border} ring-4 ${BRAND.ring}`
          : "border-slate-200 hover:border-slate-300 hover:shadow-sm",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      ].join(" ")}
    >
      {selected && <CheckBadge className={BRAND.solid} />}
      <span className="pr-5 text-[13px] font-semibold text-slate-800">{label}</span>
      {description && <span className="text-[11px] text-slate-400">{description}</span>}
    </button>
  );
}

// ─── Read-only info tile (Personal Details) ────────────────────────────────
function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
      <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="mt-1 truncate text-[13.5px] font-semibold text-slate-800">
        {value || "—"}
      </div>
    </div>
  );
}

// ─── Leave-type tile with a ring-progress indicator ────────────────────────
// function LeaveBalanceCard({
//   label,
//   balance,
//   selected,
//   onSelect,
//   accent,
// }: {
//   label: string;
//   balance?: LeaveBalanceRow;
//   selected: boolean;
//   onSelect: () => void;
//   accent: (typeof ACCENTS)[number];
// }) {
//   const s = balanceState(balance);
//   const ringColor = s.usedUp || s.noAllocation ? "#d1d5db" : accent.stroke;
//   const ringRatio = s.allocated > 0 ? Math.min(1, s.visualRemaining / s.allocated) : 0;
//   const dashOffset = RING_CIRCUMFERENCE * (1 - ringRatio);

//   const badge = s.noAllocation
//     ? { text: "No allocation", classes: "bg-slate-100 text-slate-500" }
//     : s.usedUp
//       ? { text: "Used up", classes: "bg-rose-50 text-rose-600" }
//       : s.pendingBlocked
//         ? { text: "Pending hold", classes: "bg-amber-50 text-amber-600" }
//         : null;

//   const caption = s.noAllocation
//     ? "Not allocated this year"
//     : s.usedUp
//       ? "No allowance left this year"
//       : s.pendingBlocked
//         ? `${s.pending} day(s) awaiting approval`
//         : null;

//   return (
//     <button
//       type="button"
//       onClick={onSelect}
//       disabled={s.blocked}
//       aria-pressed={selected}
//       className={[
//         "relative flex flex-col items-center gap-1 rounded-2xl border bg-white px-4 pb-4 pt-5 text-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
//         selected
//           ? `${accent.border} ring-4 ${accent.ring}`
//           : "border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5",
//         s.blocked ? "cursor-not-allowed opacity-60" : "cursor-pointer",
//       ].join(" ")}
//     >
//       {selected && <CheckBadge className={accent.solid} />}
//       {badge && (
//         <span
//           className={`absolute left-2.5 top-2.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${badge.classes}`}
//         >
//           {badge.text}
//         </span>
//       )}

//       <div className="relative mt-1 h-16 w-16">
//         <svg width={64} height={64} viewBox="0 0 64 64" className="-rotate-90">
//           <circle cx={32} cy={32} r={RING_R} fill="none" stroke="#eef0f3" strokeWidth={5} />
//           <circle
//             cx={32}
//             cy={32}
//             r={RING_R}
//             fill="none"
//             stroke={ringColor}
//             strokeWidth={5}
//             strokeLinecap="round"
//             strokeDasharray={RING_CIRCUMFERENCE}
//             strokeDashoffset={dashOffset}
//             style={{ transition: "stroke-dashoffset 0.4s ease" }}
//           />
//         </svg>
//         <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-slate-900">
//           {s.visualRemaining}
//         </div>
//       </div>

//       <span className="mt-1 text-[13px] font-semibold text-slate-800">{label}</span>
//       <span className="text-[10.5px] text-slate-400">
//         {s.hasBalance ? `of ${s.allocated} allocated` : "not on record"}
//       </span>

//       {s.hasBalance && (s.used > 0 || s.pending > 0) && (
//         <span className="text-[10px] text-slate-400">
//           {s.used} used{s.pending ? ` · ${s.pending} pending` : ""}
//         </span>
//       )}

//       {caption && (
//         <span
//           className={`mt-0.5 text-[10px] font-medium leading-snug ${
//             s.usedUp ? "text-rose-600" : s.pendingBlocked ? "text-amber-600" : "text-slate-400"
//           }`}
//         >
//           {caption}
//         </span>
//       )}
//     </button>
//   );
// }


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
    ? { text: "No allocation", classes: "bg-slate-100 text-slate-500" }
    : s.usedUp
      ? { text: "Used up", classes: "bg-rose-50 text-rose-600" }
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

  // Format large numbers/decimals to fit nicely inside the circle
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
        "relative flex w-full flex-col items-center gap-1 rounded-2xl border bg-white px-4 pb-4 pt-5 text-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        selected
          ? `${accent.border} ring-4 ${accent.ring}`
          : "border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5",
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

      {/* Circle Container - fixed sizing & precise alignment */}
      <div className="relative mt-2 flex h-16 w-16 shrink-0 items-center justify-center">
        <svg
          width={64}
          height={64}
          viewBox="0 0 64 64"
          className="absolute inset-0 -rotate-90"
        >
          <circle
            cx={32}
            cy={32}
            r={RING_R}
            fill="none"
            stroke="#eef0f3"
            strokeWidth={5}
          />
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

        {/* Text scaled to fit neatly within the ring */}
        <span className="relative z-10 text-center text-base font-bold leading-none tracking-tight text-slate-900">
          {formattedRemaining}
        </span>
      </div>

      <span className="mt-1 w-full truncate text-[13px] font-semibold text-slate-800">
        {label}
      </span>
      <span className="text-[10.5px] text-slate-400">
        {s.hasBalance ? `of ${s.allocated} allocated` : "not on record"}
      </span>

      {s.hasBalance && (s.used > 0 || s.pending > 0) && (
        <span className="text-[10px] text-slate-400">
          {s.used} used{s.pending ? ` · ${s.pending} pending` : ""}
        </span>
      )}

      {caption && (
        <span
          className={`mt-0.5 text-[10px] font-medium leading-snug ${s.usedUp
              ? "text-rose-600"
              : s.pendingBlocked
                ? "text-amber-600"
                : "text-slate-400"
            }`}
        >
          {caption}
        </span>
      )}
    </button>
  );
}

// ─── Sticky summary panel — a live "receipt" of the application being built.
// This is the signature element: since the submit action deducts real leave
// balance, showing exactly what will be sent — and what it will cost —
// before the person commits is worth more here than a duplicated button. ──
function SummaryRow({ label, value, muted }: { label: string; value: React.ReactNode; muted?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 text-[12.5px]">
      <span className="text-slate-400">{label}</span>
      <span className={`text-right font-semibold ${muted ? "text-slate-300" : "text-slate-800"}`}>
        {value}
      </span>
    </div>
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

  // const setField = <K extends keyof ApplyLeaveFormData>(
  //   field: K,
  //   value: ApplyLeaveFormData[K],
  // ) => setValue(field, value, { shouldValidate: true, shouldDirty: true });

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

  // ── Derived display strings for the summary panel ───────────────────────
  const applicantName = [personalSource?.first_name, personalSource?.last_name]
    .filter(Boolean)
    .join(" ");
  const leaveTypeLabel = leaveTypeOptions.data.find((o) => o.value === leaveTypeId)?.label;
  const applicationTypeLabel = LEAVE_APPLICATION_TYPE_OPTIONS.find(
    (o) => o.value === leaveApplicationType,
  )?.label;
  const dateRangeLabel = isHalfDayType
    ? fromDate || "—"
    : fromDate && toDate
      ? fromDate === toDate
        ? fromDate
        : `${fromDate} → ${toDate}`
      : "—";
  const projectedRemaining =
    selectedBalance && daysValue ? Math.max(0, selectedBalance.available - daysValue) : undefined;
  const canSubmit = !applyLeave.isPending && !insufficientBalance && !selectedState.blocked;

  const TOTAL_SECTIONS = canActOnBehalf ? 4 : 3;
  let sectionIndex = 0;

  return (
    <FormProvider {...methods}>
      <div className="mx-auto max-w-6xl">
        <PageHeader />

        <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
            {/* ── Left column: sequential sections ─────────────────────── */}
            <div>
              {canActOnBehalf && (
                <Section
                  index={++sectionIndex}
                  total={TOTAL_SECTIONS}
                  title="Submission Type"
                  subtitle="Apply for yourself, or file on behalf of another employee"
                >
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
                </Section>
              )}

              <Section
                index={++sectionIndex}
                total={TOTAL_SECTIONS}
                title="Personal Details"
                subtitle="Auto-filled from the employee profile"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoCard label="Employee Code" value={personalSource?.employee_code ?? ""} />
                  <InfoCard label="Full Name" value={applicantName} />
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
              </Section>

              <Section
                index={++sectionIndex}
                total={TOTAL_SECTIONS}
                title="Leave Details"
                subtitle="Pick a leave type below — the card shows what you actually have left"
              >
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
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[12.5px] font-medium text-rose-700">
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0">
                      <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L14.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {selectedState.usedUp
                      ? `You've used your entire ${selectedBalance.name} allowance for this year — pick a different leave type above.`
                      : `Every remaining ${selectedBalance.name} day is on a pending request — pick a different leave type, or wait for approval.`}
                  </div>
                )}

                {/* Leave Application Type */}
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <FieldLabel required>Leave Application Type</FieldLabel>
                  {!leaveTypeId ? (
                    <p className="text-[12px] text-slate-400">Select a Type of Leave first</p>
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
                  <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2">
                    <FormTimeInput name="from_time" label="From Time" required hint="For Short Leave only" />
                    <FormTimeInput name="to_time" label="To Time" required hint="For Short Leave only" />
                  </div>
                )}

                <div className="mt-5 border-t border-slate-100 pt-5">
                  <div
                    className={`grid grid-cols-1 gap-3 ${isHalfDayType ? "" : "sm:grid-cols-2"}`}
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
                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[12.5px] font-medium text-rose-700">
                      <svg width={15} height={15} viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0">
                        <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L14.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Insufficient {selectedBalance.name} balance — only {selectedBalance.available}{" "}
                      day(s) remaining, requested {daysValue}.
                    </div>
                  )}
                </div>

                <div className="mt-5 border-t border-slate-100 pt-5">
                  <FormTextarea
                    name="reason"
                    label="Reason"
                    required
                    placeholder="Please enter reason for leave"
                  />
                </div>
              </Section>

              <Section
                index={++sectionIndex}
                total={TOTAL_SECTIONS}
                title="Management / HOD Details"
                subtitle="Route this application to the right approver"
              >
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

                <div className="mt-6 border-t border-slate-100 pt-5">
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

                <div className="mt-5 border-t border-slate-100 pt-5">
                  <FormCheckbox
                    name="undertaking_accepted"
                    label="I have applied for leave, but I know that in case of exigency I may have to attend duty."
                  />
                </div>
              </Section>
            </div>

            {/* ── Right column: sticky live summary ────────────────────── */}
            <div className="lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h3 className="text-[13px] font-bold uppercase tracking-wide text-slate-800">
                    Application Summary
                  </h3>
                  <p className="mt-0.5 text-[11.5px] text-slate-400">
                    Review before you submit
                  </p>
                </div>

                <div className="divide-y divide-slate-100 px-5">
                  <SummaryRow
                    label="Applicant"
                    value={applicantName || "—"}
                    muted={!applicantName}
                  />
                  <SummaryRow
                    label="Leave type"
                    value={leaveTypeLabel ?? "—"}
                    muted={!leaveTypeLabel}
                  />
                  <SummaryRow
                    label="Application type"
                    value={applicationTypeLabel ?? "—"}
                    muted={!applicationTypeLabel}
                  />
                  <SummaryRow label="Dates" value={dateRangeLabel} muted={dateRangeLabel === "—"} />
                  <SummaryRow
                    label="Duration"
                    value={daysValue ? `${daysValue} day${daysValue === 1 ? "" : "s"}` : "—"}
                    muted={!daysValue}
                  />
                  {selectedBalance && (
                    <SummaryRow
                      label="Balance after"
                      value={
                        projectedRemaining !== undefined
                          ? `${projectedRemaining} of ${selectedBalance.allocated} left`
                          : `${selectedBalance.available} available`
                      }
                    />
                  )}
                  <SummaryRow label="HOD" value={hodName || "—"} muted={!hodName} />
                  <SummaryRow
                    label="Coordinator"
                    value={coordinatorName || "—"}
                    muted={!coordinatorName}
                  />
                </div>

                {(insufficientBalance || selectedState.blocked) && (
                  <div className="mx-5 mt-4 rounded-lg bg-rose-50 px-3 py-2 text-[11.5px] font-medium text-rose-600">
                    Resolve the balance issue above before you can submit.
                  </div>
                )}

                <div className="flex flex-col gap-2 px-5 pb-5 pt-4">
                  <button
                    type="submit"
                    form={FORM_ID}
                    disabled={!canSubmit}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-[13.5px] font-bold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {applyLeave.isPending ? (
                      "Submitting…"
                    ) : (
                      <>
                        <svg width={15} height={15} viewBox="0 0 24 24" fill="none">
                          <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Submit Leave Application
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/leaves")}
                    disabled={applyLeave.isPending}
                    className="flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}