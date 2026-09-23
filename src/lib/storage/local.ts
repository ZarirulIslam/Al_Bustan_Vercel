import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { validateImageFile, validateDocumentFile, type StorageProvider } from "@/lib/storage/types";

// Writes uploaded files straight to /public/uploads/<subdir>/. This
// is the simplest thing that actually works for local development
// and single-server deployment, but it requires a persistent
// filesystem — it will NOT work on serverless hosts (e.g. Vercel),
// since their filesystem is ephemeral/read-only at runtime. For those,
// implement a CloudStorageProvider (S3, Cloudinary, etc.) against the
// same StorageProvider interface and select it via STORAGE_PROVIDER.
export class LocalStorageProvider implements StorageProvider {
  private async saveFile(file: File, subdir: string): Promise<string> {
    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = (file.type.split("/")[1] || "bin").replace("jpeg", "jpg");
    const filename = `${randomUUID()}.${ext}`;

    const dir = path.join(process.cwd(), "public", "uploads", subdir);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), bytes);

    return `/uploads/${subdir}/${filename}`;
  }

  async saveImage(file: File, subdir: string): Promise<string> {
    validateImageFile(file);
    return this.saveFile(file, subdir);
  }

  async saveDocument(file: File, subdir: string): Promise<string> {
    validateDocumentFile(file);
    return this.saveFile(file, subdir);
  }

  async deleteImage(url: string): Promise<void> {
    // Only ever delete files this provider could have written
    // (local /uploads paths) — never touch an absolute/external URL.
    if (!url.startsWith("/uploads/")) return;
    const filePath = path.join(process.cwd(), "public", url);
    await unlink(filePath).catch(() => {});
  }
}
