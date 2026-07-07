import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

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
    if (this.provider === 's3' && this.s3Client) {
      const bucket = process.env.AWS_S3_BUCKET as string;
      const key = `${folder ? `${folder.replace(/\/$/, "")}/` : ""}${Date.now()}-${filename}`;
      const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: mimetype });
      await this.s3Client.send(cmd);
      const url = process.env.AWS_S3_PUBLIC_URL ? `${process.env.AWS_S3_PUBLIC_URL}/${key}` : `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      return { url, key };
    }

    if (this.provider === 'supabase' && this.supabase) {
      const bucket = process.env.SUPABASE_BUCKET ?? 'public';
      const key = `${folder ? `${folder.replace(/\/$/, "")}/` : ""}${Date.now()}-${filename}`;
      const res = await this.supabase.storage.from(bucket).upload(key, buffer, { contentType: mimetype });
      if (res.error) throw res.error;
      const url = `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${key}`;
      return { url, key };
    }

    if (this.provider === 'cloudinary' && cloudinary) {
      // Cloudinary supports streams; use upload_stream
      return new Promise<UploadResult>((resolve, reject) => {
        const opts: any = {};
        if (folder) opts.folder = folder;
        const stream = cloudinary.uploader.upload_stream(opts, (err: any, result: any) => {
          if (err) return reject(err);
          resolve({ url: result.secure_url, key: result.public_id });
        });
        stream.end(buffer);
      });
    }

    // local fallback
    const uploadsDir = path.join(process.cwd(), 'uploads', folder ?? 'files');
    await fs.promises.mkdir(uploadsDir, { recursive: true });
    const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '')}`;
    const filePath = path.join(uploadsDir, safeName);
    await fs.promises.writeFile(filePath, buffer);
    const url = process.env.LOCAL_UPLOAD_URL ? `${process.env.LOCAL_UPLOAD_URL}/${folder ?? 'files'}/${safeName}` : `/uploads/${folder ?? 'files'}/${safeName}`;
    return { url, key: safeName };
  }
}
