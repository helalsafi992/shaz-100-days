import { z } from "zod";
import { access } from "@/lib/auth";
import { sameOrigin, failure, body, rate, HttpError } from "@/lib/security";
import { mealDays, nutritionChange, editMeal } from "@/lib/planning-store";
import { profile } from "@/lib/platform";
import { localDate } from "@/lib/profile";
import { cardioRows, cardioSettings, editCardio } from "@/lib/cardio-store";
import { estimate } from "@/lib/nutrition";
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (x) =>
      !Number.isNaN(Date.parse(x)) &&
      new Date(x + "T12:00:00Z").toISOString().slice(0, 10) === x,
  );
export async function GET(req: Request) {
  try {
    const s = await access(req.headers);
    const start = date.parse(
      new URL(req.url).searchParams.get("start") || localDate(),
    );
    const p = await profile(s.user.id);
    return Response.json(
      {
        profile: p,
        energy: estimate(p.data),
        days: await mealDays(s.user.id, start),
        cardio: await cardioRows(s.user.id),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    sameOrigin(req);
    const s = await access(req.headers);
    await rate("plan:" + s.user.id, 180, 5);
    const input = await body(req),
      path = (await params).path.join("/");
    if (path === "nutrition-preview" || path === "nutrition-confirm")
      return Response.json(
        await nutritionChange(
          s.user.id,
          z
            .object({
              settings: z.record(z.string(), z.unknown()),
              expectedVersion: z.number().int().optional(),
              reviewAggressive: z.boolean().optional(),
            })
            .parse(input),
          path === "nutrition-confirm",
        ),
      );
    if (path === "cardio-preview" || path === "cardio-confirm")
      return Response.json(
        await cardioSettings(
          s.user.id,
          z
            .object({
              cardio: z.unknown(),
              expectedVersion: z.number().int().optional(),
            })
            .parse(input),
          path === "cardio-confirm",
        ),
      );
    if (path === "cardio") {
      await editCardio(
        s.user.id,
        z
          .object({
            id: z.string().uuid(),
            action: z.enum(["swap", "move", "remove", "skip", "log"]),
            option: z.string().max(80).optional(),
            date: date.optional(),
            minutes: z.number().min(1).max(300).optional(),
            distance: z.number().min(0).max(200).optional(),
            effort: z.number().min(1).max(10).optional(),
          })
          .refine(
            (v) =>
              v.action !== "log" ||
              (v.minutes !== undefined && v.effort !== undefined),
          )
          .parse(input),
      );
      return Response.json({ ok: true });
    }
    if (path === "meal") {
      await editMeal(
        s.user.id,
        z
          .object({
            date,
            slot: z.string().max(80),
            action: z.enum([
              "choose",
              "portion",
              "remove",
              "undo",
              "eaten",
              "skipped",
              "reopen",
            ]),
            recipe: z.string().max(100).optional(),
            servings: z.number().min(0.1).max(3).optional(),
            expectedVersion: z.number().int().min(1),
          })
          .parse(input),
      );
      return Response.json({ ok: true });
    }
    throw new HttpError(404, "Handlingen findes ikke.");
  } catch (e) {
    return failure(e);
  }
}
