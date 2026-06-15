import { erpSeed } from "../src/mocks/erpSeed.mock.js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de rodar o seed.");
  process.exit(1);
}

const rows = Object.entries(erpSeed).flatMap(([collectionName, records]) =>
  records.map((record) => ({
    collection_name: collectionName,
    record_id: record.id,
    payload: record,
  }))
);

const response = await fetch(`${supabaseUrl.replace(/\/+$/, "")}/rest/v1/erp_records?on_conflict=collection_name,record_id`, {
  body: JSON.stringify(rows),
  headers: {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=minimal",
  },
  method: "POST",
});

if (!response.ok) {
  throw new Error(await response.text());
}

console.log(`Seed concluido: ${rows.length} registro(s) enviados ao Supabase.`);
