import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

export interface R2Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

const STORAGE_PREFIX = "codebook_";

/**
 * 收集当前应用的所有本地状态
 */
export function exportLocalData(): Record<string, any> {
  const data: Record<string, any> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      try {
        const val = localStorage.getItem(key);
        if (val) {
          // 尝试判断是否为潜在的 JSON 对象/数组
          if (
            (val.startsWith("{") && val.endsWith("}")) ||
            (val.startsWith("[") && val.endsWith("]"))
          ) {
            data[key] = JSON.parse(val);
          } else {
            // 如果是纯字符串（如 "pixel"），直接存储
            data[key] = val;
          }
        }
      } catch (e) {
        console.warn(`Failed to parse local storage key: ${key}`, e);
      }
    }
  }
  return data;
}

/**
 * 恢复本地状态
 * @param data 从云端下载的 JSON 数据
 */
export function importLocalData(data: Record<string, any>) {
  for (const key in data) {
    if (key.startsWith(STORAGE_PREFIX)) {
      localStorage.setItem(key, JSON.stringify(data[key]));
    }
  }
}

/**
 * 备份数据到 R2
 */
export async function uploadToR2(config: R2Config, data: Record<string, any>) {
  const s3 = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  const uploadCmd = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: "codebook_backup.json",
    Body: JSON.stringify(data),
    ContentType: "application/json",
  });

  return await s3.send(uploadCmd);
}

/**
 * 从 R2 下载备份数据
 */
export async function downloadFromR2(
  config: R2Config,
): Promise<Record<string, any>> {
  const s3 = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  const downloadCmd = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: "codebook_backup.json",
  });

  const response = await s3.send(downloadCmd);
  if (!response.Body) {
    throw new Error("No data found in backup.");
  }

  const str = await response.Body.transformToString();
  return JSON.parse(str);
}
