import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
  EVIDENCE_MAX_BYTES,
  isAllowedEvidenceMime,
} from "@/lib/evidence-upload";

export { EVIDENCE_MAX_BYTES, isAllowedEvidenceMime };

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl: string | null;
};

export function getR2Config(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucketName = process.env.R2_BUCKET_NAME?.trim();
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim() || null;

  const missing: string[] = [];
  if (!accountId) missing.push("R2_ACCOUNT_ID");
  if (!accessKeyId) missing.push("R2_ACCESS_KEY_ID");
  if (!secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
  if (!bucketName) missing.push("R2_BUCKET_NAME");

  if (missing.length > 0) {
    throw new Error(
      `Cloudflare R2 is not configured. Set ${missing.join(", ")} in the environment.`,
    );
  }

  return {
    accountId: accountId!,
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
    bucketName: bucketName!,
    publicBaseUrl,
  };
}

export function isR2Configured(): boolean {
  try {
    getR2Config();
    return true;
  } catch {
    return false;
  }
}

let cachedClient: S3Client | null = null;
let cachedForAccount: string | null = null;

export function getR2Client(): S3Client {
  const config = getR2Config();
  if (cachedClient && cachedForAccount === config.accountId) {
    return cachedClient;
  }

  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  cachedForAccount = config.accountId;
  return cachedClient;
}

export function buildEvidenceObjectKey(input: {
  commitmentId: string;
  authUserId: string;
  contentType: string;
}): string {
  const ext = extensionForMime(input.contentType);
  const stamp = Date.now().toString(36);
  const rand = crypto.randomUUID().slice(0, 8);
  return `evidence/${input.commitmentId}/${input.authUserId}/${stamp}-${rand}${ext}`;
}

function extensionForMime(contentType: string): string {
  const normalized = contentType.trim().toLowerCase();
  switch (normalized) {
    case "image/jpeg":
    case "image/jpg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/heic":
      return ".heic";
    case "image/heif":
      return ".heif";
    case "application/pdf":
      return ".pdf";
    default:
      if (normalized.startsWith("image/")) return ".img";
      return "";
  }
}

export async function createEvidenceUploadUrl(input: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const config = getR2Config();
  const client = getR2Client();
  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: input.key,
      ContentType: input.contentType,
    }),
    { expiresIn: input.expiresInSeconds ?? 300 },
  );
}

export async function createEvidenceReadUrl(input: {
  key: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const config = getR2Config();
  if (config.publicBaseUrl) {
    return `${config.publicBaseUrl.replace(/\/$/, "")}/${input.key}`;
  }

  const client = getR2Client();
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: config.bucketName,
      Key: input.key,
    }),
    { expiresIn: input.expiresInSeconds ?? 900 },
  );
}

export async function deleteEvidenceObject(key: string): Promise<void> {
  const config = getR2Config();
  const client = getR2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    }),
  );
}
