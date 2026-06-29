import sql from "mssql";

async function test() {
  try {
    const pool = await sql.connect({
      user: "sa",
      password: "abc@123",
      server: "192.168.1.197",
      database: "Realtime",
      port: 1433,
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
    });

    console.log("✅ Connected");

    const result = await pool.request().query("SELECT @@VERSION AS version");
    console.log(result.recordset);

    await pool.close();
  } catch (err) {
    console.dir(err, { depth: null });
  }
}

test();