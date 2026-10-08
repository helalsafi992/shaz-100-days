import { activePeriod } from "@/lib/platform";
import { access, admin } from "@/lib/auth";
import { HttpError, failure } from "@/lib/security";
import { db } from "@/lib/db";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    try {
      await admin(req.headers);
    } catch {
      const s = await access(req.headers);
      await activePeriod(s.user.id);
    }
    const id = z.uuid().parse((await params).id);
    const root = process.env.VIDEO_STORAGE_PATH;
    if (!root) throw new HttpError(404, "Videoen er ikke tilgængelig.");
    const r = await db().query(
      "SELECT mime,bytes FROM shaz_videos WHERE id=$1",
      [id],
    );
    if (!r.rowCount) throw new HttpError(404, "Videoen findes ikke.");
    const data = await readFile(join(root, id));
    const h = {
      "Content-Type": r.rows[0].mime,
      "Cache-Control": "private, no-store",
      "Accept-Ranges": "bytes",
    };
    const range = req.headers.get("range");
    if (range) {
      const match = /^bytes=(\d+)-(\d*)$/.exec(range);
      if (!match)
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${data.length}` },
        });
      const start = Number(match[1]),
        end = Math.min(
          data.length - 1,
          match[2] ? Number(match[2]) : data.length - 1,
        );
      if (start > end || start >= data.length)
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${data.length}` },
        });
      return new Response(data.subarray(start, end + 1), {
        status: 206,
        headers: {
          ...h,
          "Content-Range": `bytes ${start}-${end}/${data.length}`,
          "Content-Length": String(end - start + 1),
        },
      });
    }
    return new Response(data, {
      headers: { ...h, "Content-Length": String(data.length) },
    });
  } catch (e) {
    return failure(e);
  }
}
