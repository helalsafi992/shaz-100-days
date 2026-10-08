import { admin } from "@/lib/auth";
import { sameOrigin, HttpError, failure, rate } from "@/lib/security";
import { db, audit } from "@/lib/db";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const s = await admin(req.headers);
    await rate("upload:" + s.user.id, 10, 60);
    const root = process.env.VIDEO_STORAGE_PATH;
    if (!root)
      throw new HttpError(503, "Vedvarende videolager er ikke konfigureret.");
    const max = 26 * 1024 * 1024;
    if (Number(req.headers.get("content-length") || 0) > max)
      throw new HttpError(413, "Filen er for stor. Maks. 25 MB.");
    const reader = req.body?.getReader();
    if (!reader) throw new HttpError(400, "Filen mangler.");
    let bytes = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > max) {
        await reader.cancel();
        throw new HttpError(413, "Filen er for stor.");
      }
      chunks.push(value);
    }
    const raw = Buffer.concat(chunks);
    const form = await new Response(raw, {
      headers: { "Content-Type": req.headers.get("content-type") || "" },
    }).formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size > 25 * 1024 * 1024)
      throw new HttpError(400, "Vælg en video på højst 25 MB.");
    const data = Buffer.from(await file.arrayBuffer());
    const mp4 = data.subarray(4, 8).toString() === "ftyp",
      webm = data.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    if (!mp4 && !webm)
      throw new HttpError(400, "Kun MP4 og WebM understøttes.");
    const id = crypto.randomUUID();
    await mkdir(root, { recursive: true });
    await writeFile(join(root, id), data, { flag: "wx", mode: 0o600 });
    try {
      await db().query(
        "INSERT INTO shaz_videos(id,name,mime,bytes,uploaded_by) VALUES($1,$2,$3,$4,$5)",
        [
          id,
          file.name.slice(0, 150),
          mp4 ? "video/mp4" : "video/webm",
          file.size,
          s.user.id,
        ],
      );
    } catch (e) {
      await unlink(join(root, id));
      throw e;
    }
    await audit(s.user.id, "upload_video", id);
    return Response.json({ id });
  } catch (e) {
    return failure(e);
  }
}
