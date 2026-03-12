import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function parseArgs(argv) {
  const options = {
    collection: "participants",
    outDir: "exports",
    serviceAccountPath:
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS || "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--collection" && next) {
      options.collection = next;
      index += 1;
      continue;
    }

    if (arg === "--out-dir" && next) {
      options.outDir = next;
      index += 1;
      continue;
    }

    if (arg === "--service-account" && next) {
      options.serviceAccountPath = next;
      index += 1;
      continue;
    }
  }

  return options;
}

function escapeCsv(value) {
  const normalized = value == null ? "" : String(value);
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replaceAll('"', '""')}"`;
  }
  return normalized;
}

function flattenParticipantRecord(record) {
  const row = {
    pid: record.pid ?? "",
    ownerUid: record.ownerUid ?? "",
  };

  for (let step = 1; step <= 4; step += 1) {
    const stepData = record.steps?.[`step_${step}`]?.tlx?.responses ?? {};
    row[`step_${step}_mental_demand`] = stepData.mental_demand ?? "";
    row[`step_${step}_physical_demand`] = stepData.physical_demand ?? "";
    row[`step_${step}_temporal_demand`] = stepData.temporal_demand ?? "";
    row[`step_${step}_performance`] = stepData.performance ?? "";
    row[`step_${step}_effort`] = stepData.effort ?? "";
    row[`step_${step}_frustration`] = stepData.frustration ?? "";
  }

  const demographics = record.demographics?.responses ?? {};
  row.age_range = demographics.age_range ?? "";
  row.gender_identity = demographics.gender_identity ?? "";
  row.education = demographics.education ?? "";
  row.employment_status = demographics.employment_status ?? "";
  row.region = demographics.region ?? "";
  row.primary_language = demographics.primary_language ?? "";

  return row;
}

async function loadFirebaseAdmin(serviceAccountPath) {
  try {
    const adminModule = await import("firebase-admin");
    const admin = adminModule.default ?? adminModule;
    const serviceAccount = JSON.parse(await fs.readFile(serviceAccountPath, "utf8"));
    return { admin, serviceAccount };
  } catch (error) {
    if (error.code === "ERR_MODULE_NOT_FOUND") {
      throw new Error(
        'Missing dependency "firebase-admin". Run `npm install firebase-admin` before exporting.',
      );
    }
    throw error;
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!options.serviceAccountPath) {
    throw new Error(
      "Missing service account path. Use --service-account /path/to/service-account.json or set FIREBASE_SERVICE_ACCOUNT_PATH.",
    );
  }

  const absoluteServiceAccountPath = path.resolve(options.serviceAccountPath);
  const { admin, serviceAccount } = await loadFirebaseAdmin(absoluteServiceAccountPath);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  const db = admin.firestore();
  const snapshot = await db.collection(options.collection).get();
  const records = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const flattenedRows = records.map(flattenParticipantRecord);
  const headers = Array.from(new Set(flattenedRows.flatMap((row) => Object.keys(row))));
  const csvLines = [
    headers.join(","),
    ...flattenedRows.map((row) => headers.map((header) => escapeCsv(row[header] ?? "")).join(",")),
  ];

  const outputDir = path.resolve(options.outDir);
  await fs.mkdir(outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replaceAll(":", "-");
  const jsonPath = path.join(outputDir, `firebase-export-${timestamp}.json`);
  const csvPath = path.join(outputDir, `firebase-export-${timestamp}.csv`);

  await fs.writeFile(jsonPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  await fs.writeFile(csvPath, `${csvLines.join("\n")}\n`, "utf8");

  console.log(`Exported ${records.length} participant record(s).`);
  console.log(`JSON: ${jsonPath}`);
  console.log(`CSV:  ${csvPath}`);
}

main().catch((error) => {
  console.error(`Export failed: ${error.message}`);
  process.exitCode = 1;
});
