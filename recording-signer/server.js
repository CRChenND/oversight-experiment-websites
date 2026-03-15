import http from "node:http";
import process from "node:process";
import { Storage } from "@google-cloud/storage";

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET || "chaoran-agent-oversight-study-recording";
const objectPrefix = normalizePrefix(process.env.GCS_PREFIX || "recordings/");
const signedUrlTtlSeconds = Number(process.env.SIGNED_URL_TTL_SECONDS || 900);
const allowedOrigins = parseAllowedOrigins(
  process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN || "https://gui-agent-oversight.duckdns.org",
);

const server = http.createServer(async (request, response) => {
  const origin = request.headers.origin || "";

  if (request.method === "OPTIONS") {
    if (!applyCors(origin, response)) {
      response.writeHead(403);
      response.end();
      return;
    }

    response.writeHead(204, {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "3600",
    });
    response.end();
    return;
  }

  if (request.url === "/healthz" && request.method === "GET") {
    applyCors(origin, response);
    writeJson(response, 200, { ok: true });
    return;
  }

  if (request.url !== "/api/recording-upload-url" || request.method !== "POST") {
    applyCors(origin, response);
    writeJson(response, 404, { error: "Not found." });
    return;
  }

  if (!applyCors(origin, response)) {
    writeJson(response, 403, { error: "Origin is not allowed." });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const participantId = sanitizeParticipantId(body.participantId);
    const recordedAt = sanitizeTimestamp(body.recordedAt);
    const contentType = sanitizeContentType(body.contentType);

    if (!participantId || !recordedAt || !contentType) {
      writeJson(response, 400, {
        error: "participantId, recordedAt, and a video/webm contentType are required.",
      });
      return;
    }

    const objectName = `${objectPrefix}${participantId}/${recordedAt}.webm`;
    const expiresAt = Date.now() + signedUrlTtlSeconds * 1000;
    const [uploadUrl] = await storage.bucket(bucketName).file(objectName).getSignedUrl({
      version: "v4",
      action: "write",
      expires: expiresAt,
      contentType,
    });

    writeJson(response, 200, {
      bucketName,
      objectName,
      uploadUrl,
      expiresAt: new Date(expiresAt).toISOString(),
    });
  } catch (error) {
    writeJson(response, 500, {
      error: error instanceof Error ? error.message : "Unknown signing error.",
    });
  }
});

const port = Number(process.env.PORT || 8080);
server.listen(port, () => {
  console.log(`Recording signer listening on ${port}`);
});

function parseAllowedOrigins(value) {
  return new Set(
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function normalizePrefix(prefix) {
  if (!prefix) {
    return "";
  }

  return prefix.endsWith("/") ? prefix : `${prefix}/`;
}

function applyCors(origin, response) {
  if (!origin || !allowedOrigins.has(origin)) {
    return false;
  }

  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Vary", "Origin");
  return true;
}

function writeJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    request.on("data", (chunk) => {
      chunks.push(chunk);
    });

    request.on("end", () => {
      if (!chunks.length) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(error);
      }
    });

    request.on("error", reject);
  });
}

function sanitizeParticipantId(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 64);
}

function sanitizeTimestamp(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/[^0-9TZ-]/g, "").slice(0, 64);
}

function sanitizeContentType(value) {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.trim().toLowerCase();
  return normalized.startsWith("video/webm") ? normalized : "";
}
