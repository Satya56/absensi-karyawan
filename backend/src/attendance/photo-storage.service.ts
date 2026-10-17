import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { Storage } from "@google-cloud/storage";
import { mkdir, readFile, writeFile } from "fs/promises";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "path";

@Injectable()
export class PhotoStorageService {
  private readonly driver: string;
  private readonly localDir: string;
  private readonly s3: S3Client;
  private readonly gcs: Storage;
  constructor(config: ConfigService) {
    this.driver = config.get("PHOTO_STORAGE", "local");
    this.localDir = resolve(config.get("PHOTO_LOCAL_DIRECTORY", "uploads"));
    if (this.driver === "s3")
      this.s3 = new S3Client({ region: config.getOrThrow("AWS_REGION") });
    if (this.driver === "gcs") this.gcs = new Storage();
  }

  private localPath(key: string) {
    const normalizedKey = key.replace(/\\/g, "/");
    const directoryName = basename(this.localDir);
    const directoryMarker = `/${directoryName}/`;
    const markerIndex = normalizedKey.lastIndexOf(directoryMarker);
    let storageKey = normalizedKey;

    if (markerIndex >= 0) {
      storageKey = normalizedKey.slice(markerIndex + directoryMarker.length);
    } else if (normalizedKey.startsWith(`${directoryName}/`)) {
      storageKey = normalizedKey.slice(directoryName.length + 1);
    }

    const target = resolve(this.localDir, storageKey);
    const relativeTarget = relative(this.localDir, target);
    if (
      !relativeTarget ||
      relativeTarget === ".." ||
      relativeTarget.startsWith(`..${sep}`) ||
      isAbsolute(relativeTarget)
    ) {
      throw new Error("Invalid local photo path");
    }

    return target;
  }

  private contentTypeFor(key: string) {
    const extension = key.split(".").pop()?.toLowerCase();
    if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
    if (extension === "png") return "image/png";
    if (extension === "webp") return "image/webp";
    return "application/octet-stream";
  }

  async save(key: string, bytes: Buffer, contentType: string) {
    try {
      if (this.driver === "s3")
        await this.s3.send(
          new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
            Body: bytes,
            ContentType: contentType,
          }),
        );
      else if (this.driver === "gcs")
        await this.gcs
          .bucket(process.env.GCP_BUCKET!)
          .file(key)
          .save(bytes, { contentType, resumable: false });
      else {
        const target = this.localPath(key);
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, bytes, { flag: "wx" });
      }
    } catch {
      throw new InternalServerErrorException("Photo storage is unavailable.");
    }
  }
  async read(key: string): Promise<{ bytes: Buffer; contentType: string }> {
    try {
      if (this.driver === "s3") {
        const object = await this.s3.send(
          new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: key }),
        );
        const chunks: Uint8Array[] = [];
        for await (const chunk of object.Body as AsyncIterable<Uint8Array>)
          chunks.push(chunk);
        return {
          bytes: Buffer.concat(chunks),
          contentType: object.ContentType ?? "image/jpeg",
        };
      }
      if (this.driver === "gcs") {
        const [bytes] = await this.gcs
          .bucket(process.env.GCP_BUCKET!)
          .file(key)
          .download();
        return { bytes, contentType: `image/${key.split(".").pop()}` };
      }
      const target = this.localPath(key);
      const bytes = await readFile(target);
      return { bytes, contentType: this.contentTypeFor(key) };
    } catch {
      throw new InternalServerErrorException("Photo could not be retrieved.");
    }
  }
}
