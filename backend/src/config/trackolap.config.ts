import axios from "axios";
import { env } from "./env";

const TRACKOLA_BASE_URL = 'https://app.trackolap.com';
const TRACKOLA_CUST_ID = env.trackolap.authId || '';
const TRACKOLA_API_KEY = env.trackolap.authKey || '';

if (!TRACKOLA_CUST_ID || !TRACKOLA_API_KEY) {
  console.warn('[Trackola] TRACKOLA_CUST_ID / TRACKOLA_API_KEY not set — Trackola API calls will fail');
}

// export const trackolaClient = axios.create({
//   baseURL: TRACKOLA_BASE_URL,
//   timeout: 20_000,
// });

function buildHeaders() {
  return {
    'Content-Type': 'application/json',
    platform: 'API',
    'tlp-cid': TRACKOLA_CUST_ID,
    'tlp-t': Math.floor(Date.now()/1000).toString(),
    'api-key': TRACKOLA_API_KEY,
  }
}

const headers = buildHeaders()

export interface TrackolaReportCell {
  data: Array<{ value: string | number }>;
}

export interface TrackolaReportResponse {
  s: boolean; 
  rc: number; 
  title: string;
  columns: string[];
  rows: TrackolaReportCell[][];
}

export async function fetchTrakolaReport(
  reportId: string,
  startDate: string,
  endDate: string,
): Promise<TrackolaReportResponse> {
  try {
    const res = await axios.get<TrackolaReportResponse>(
      "https://app.trackolap.com/cust/1/api/report/get",
      {
        params: {
          report_id: reportId,
          start_date: startDate,
          end_date: endDate,
        },
        headers: buildHeaders(),
      }
    );
    if (!res.data?.s) {
      throw new Error(
        `Trakola API returned an unsuccessful response (rc=${res.data?.rc})`
      );
    }

    return res.data;
  } catch (err: any) {
    throw err; // ✅ Important
  }
}
