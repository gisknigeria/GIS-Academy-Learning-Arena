import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

// Optional dependencies
let S3Client: any = null;
let PutObjectCommand: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const aws = require('@aws-sdk/client-s3');
  S3Client = aws.S3Client;
  PutObjectCommand = aws.PutObjectCommand;
} catch (e) {
  // ignore if not installed
}

let createClient: any = null;
try {
  createClient = require('@supabase/supabase-js').createClient;
} catch (e) {
  // ignore
}

let cloudinary: any = null;
try {
  cloudinary = require('cloudinary').v2;
} catch (e) {
  // ignore
}

export type UploadResult = { url: string; key?: string };

function sanitizePart(value: string, fallback: string): string {
  const safe = value.trim().replace(/[^a-zA-Z0-9._-]/g, '-').replace(/^[.-]+|[.-]+$/g, '');
  return safe || fallback;
}

function sanitizeFolder(folder?: string): string {
  return (folder ?? 'files')
    .split(/[\\/]+/)
    .filter((part) => part && part !== '.' && part !== '..')
    .map((part) => sanitizePart(part, 'files'))
    .join('/');
}

function getPublicUploadUrl(uploadPath: string): string {
  const publicApiUrl = (process.env.PUBLIC_API_URL ?? process.env.RENDER_EXTERNAL_URL ?? '').replace(/\/$/, '');
  if (publicApiUrl) return `${publicApiUrl}${uploadPath}`;

  const localUploadUrl = process.env.LOCAL_UPLOAD_URL?.replace(/\/$/, '');
  if (localUploadUrl) {
    return localUploadUrl.endsWith('/uploads')
      ? `${localUploadUrl}${uploadPath.replace(/^\/uploads/, '')}`
      : `${localUploadUrl}${uploadPath}`;
  }

  return uploadPath;
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  private provider = process.env.UPLOAD_PROVIDER ?? 'local';

  private s3Client: any | null = null;
  private supabase: any | null = null;

  constructor() {
    if (this.provider === 's3' && S3Client) {
      this.s3Client = new S3Client({ region: process.env.AWS_REGION, credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY } });
    }

    if (this.provider === 'supabase' && createClient) {
      this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    }

    if (this.provider === 'cloudinary' && cloudinary) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    }
  }

  async uploadBuffer(filename: string, buffer: Buffer, mimetype?: string, folder?: string): Promise<UploadResult> {
    if (!buffer?.length) throw new Error('Cannot upload an empty file.');

    const safeFolder = sanitizeFolder(folder);
    const safeFilename = sanitizePart(filename, 'upload');
    const objectName = `${Date.now()}-${randomUUID()}-${safeFilename}`;
    const key = `${safeFolder}/${objectName}`;

    if (this.provider === 's3' && this.s3Client) {
      const bucket = process.env.AWS_S3_BUCKET as string;
      const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: mimetype });
      await this.s3Client.send(cmd);
      const url = process.env.AWS_S3_PUBLIC_URL ? `${process.env.AWS_S3_PUBLIC_URL}/${key}` : `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      return { url, key };
    }

    if (this.provider === 'supabase' && this.supabase) {
      const bucket = process.env.SUPABASE_BUCKET ?? 'public';
      const res = await this.supabase.storage.from(bucket).upload(key, buffer, { contentType: mimetype });
      if (res.error) throw res.error;
      const url = `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${key}`;
      return { url, key };
    }

    if (this.provider === 'cloudinary' && cloudinary) {
      // Cloudinary supports streams; use upload_stream
      return new Promise<UploadResult>((resolve, reject) => {
        const opts: any = { resource_type: 'auto', folder: safeFolder, public_id: objectName.replace(/\.[^.]+$/, '') };
        const stream = cloudinary.uploader.upload_stream(opts, (err: any, result: any) => {
          if (err) return reject(err);
          resolve({ url: result.secure_url, key: result.public_id });
        });
        stream.end(buffer);
      });
    }

    // local fallback
    const uploadsDir = path.join(process.cwd(), 'uploads', ...safeFolder.split('/'));
    await fs.promises.mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, objectName);
    await fs.promises.writeFile(filePath, buffer);
    const uploadPath = `/uploads/${safeFolder}/${objectName}`;
    const url = getPublicUploadUrl(uploadPath);
    return { url, key };
  }
}
