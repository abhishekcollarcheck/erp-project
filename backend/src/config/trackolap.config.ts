import axios from "axios";
import { env } from "./env";

const TRACKOLA_BASE_URL = "https://app.trackolap.com";
const TRACKOLA_CUST_ID = env.trackolap.authId || "";
const TRACKOLA_API_KEY = env.trackolap.authKey || "";
const TRACKOLA_ADMIN_ID = env.trackolap.adminId || "";

if (!TRACKOLA_CUST_ID || !TRACKOLA_API_KEY) {
  console.warn(
    "[Trackola] TC_CUSTOMERID / TC_KEY not set — Trackola API calls will fail",
  );
}
if (!TRACKOLA_ADMIN_ID) {
  console.warn(
    "[Trackola] TC_ADMIN_ID not set — the employee-wise report API will fail",
  );
}

/**
 * Every Trackola request carries the same auth headers. `tlp-t` is a fresh
 * unix timestamp per call, so build these per request, never once at module
 * load.
 */
function buildHeaders() {
  return {
    "Content-Type": "application/json",
    platform: "API",
    "tlp-cid": TRACKOLA_CUST_ID,
    "tlp-t": Math.floor(Date.now() / 1000).toString(),
    "api-key": TRACKOLA_API_KEY,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

export interface TrackolaReportCell {
  data: Array<{ value: string | number }>;
}

export type TrackolaTemplateType = "DAILY_PRODUCTIVITY_BY_DAY";

export interface TrackolaTemplateFilter {
  filter: string; // e.g. "employeeIden"
  condition: string; // e.g. "in"
  values: string[];
}

export interface TrackolaTemplateRunResponse {
  s: boolean;
  rc?: number;
  ed?: string; // error description when s === false
  msg?: string;
  columns: string[];
  columnsMulti: unknown[];
  rows: TrackolaReportCell[][];
  totalCol: number;
  edit: boolean;
  exports: unknown[];
  onlyExcelDownload: boolean;
  showFilterModel: boolean;
  multiColumn: boolean;
}

/** Thrown when Trackola replies `s: false` (invalid employee, bad filter, …). */
export class TrackolaApiError extends Error {
  constructor(
    message: string,
    /** true when the failure is caused by the request (bad employee id / filter),
     *  false when it's a config / upstream problem. */
    public readonly invalidInput: boolean,
  ) {
    super(message);
    this.name = "TrackolaApiError";
  }
}

export interface RunTrackolaTemplateParams {
  templateType: TrackolaTemplateType;
  /** Trackola Admin ID → `employee_id` query param. Defaults to env config. */
  adminId?: string;
  filters: TrackolaTemplateFilter[];
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

const INVALID_INPUT_HINTS = [
  "invalid employee",
  "valid values in filter",
  "employee_id is missing",
];

export async function runTrackolaTemplate(
  params: RunTrackolaTemplateParams,
): Promise<TrackolaTemplateRunResponse> {
  const adminId = params.adminId || TRACKOLA_ADMIN_ID;
  if (!adminId) {
    throw new TrackolaApiError(
      "Trackola Admin ID is not configured (set TC_ADMIN_ID)",
      false,
    );
  }

  const res = await axios.post<TrackolaTemplateRunResponse>(
    `${TRACKOLA_BASE_URL}/cust/1/api/report/template/run`,
    {
      type: params.templateType,
      filters: params.filters,
      startDate: params.startDate,
      endDate: params.endDate,
    },
    {
      params: { employee_id: adminId },
      headers: buildHeaders(),
      timeout: 20_000,
    },
  );

  if (!res.data?.s) {
    const reason =
      res.data?.ed ||
      res.data?.msg ||
      `Trackola template run failed (rc=${res.data?.rc})`;
    const invalidInput = INVALID_INPUT_HINTS.some((h) =>
      reason.toLowerCase().includes(h),
    );
    throw new TrackolaApiError(reason, invalidInput);
  }

  return res.data;
}
