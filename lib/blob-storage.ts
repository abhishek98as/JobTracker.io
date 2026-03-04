import { del, put } from "@vercel/blob";

function requireBlobToken() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Missing BLOB_READ_WRITE_TOKEN.");
  }

  return process.env.BLOB_READ_WRITE_TOKEN;
}

export async function uploadResumeBlob(params: {
  pathname: string;
  file: Blob;
}) {
  const token = requireBlobToken();

  return put(params.pathname, params.file, {
    access: "public",
    token
  });
}

export async function deleteResumeBlob(url: string) {
  const token = requireBlobToken();
  await del(url, { token });
}