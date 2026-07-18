import axios from "axios";
import { env } from "./env";

export async function testTrackolapConnection() {
  const response = await axios.get(
    'https://app.trackolap.com/integration/api/get',
    {
      params: {
        type: "punchout",
        time: "2025-05-12T17-06-54",
        id: 1,
        source: "biometric",
      },
      headers: {
        "tlp-cid": env.trackolap.authId,
        "api-key": env.trackolap.authKey,
        platform: "API",
      },
    }
  );
  console.log(response.data) 
  return response.data;
}

testTrackolapConnection();