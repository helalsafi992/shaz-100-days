"use client";
import { useState, useRef, useEffect } from "react";
export type SetLog = {
  exercise: string;
  set: number;
  reps: number;
  kg: number;
  effort: number;
};
export function useWorkoutDraft(
  id: string,
  user: string,
  initial: SetLog[],
  server:
    | {
        data: { sets: SetLog[]; timerEnd: number };
        revision: number;
        updated_at: string;
      }
    | undefined,
  readonly: boolean,
) {
  const [sets, rawSet] = useState<SetLog[]>(server?.data.sets || initial),
    [end, rawEnd] = useState(server?.data.timerEnd || 0),
    [status, setStatus] = useState("Kladde gemmes løbende"),
    [conflict, setConflict] = useState(false);
  const latest = useRef({
      sets: server?.data.sets || initial,
      timerEnd: server?.data.timerEnd || 0,
    }),
    revision = useRef(server?.revision || 0),
    pending = useRef(false),
    inFlight = useRef<Promise<boolean> | null>(null),
    blocked = useRef(false),
    mounted = useRef(true),
    key = "shaz-workout:" + user + ":" + id;
  function cache(dirty: boolean) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          ...latest.current,
          revision: revision.current,
          dirty,
          updatedAt: Date.now(),
        }),
      );
    } catch {
      if (mounted.current)
        setStatus("Lokal lagring er ikke tilgængelig. Gem før du lukker.");
    }
  }
  const flush = async (): Promise<boolean> => {
    if (readonly || blocked.current) return !blocked.current;
    if (inFlight.current) {
      const ok = await inFlight.current;
      return ok && pending.current ? flush() : ok;
    }
    if (!pending.current) return true;
    const payload = JSON.parse(JSON.stringify(latest.current));
    pending.current = false;
    const task = (async () => {
      try {
        const r = await fetch("/api/platform/workout-draft", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id,
              ...payload,
              revision: revision.current,
            }),
          }),
          d = await r.json();
        if (r.status === 409) {
          blocked.current = true;
          setConflict(true);
          throw Error(
            "En anden session har ændret kladden. Vælg hvilken du vil beholde.",
          );
        }
        if (!r.ok) throw Error(d.error || "Kunne ikke synkronisere.");
        revision.current = d.revision;
        cache(pending.current);
        if (mounted.current)
          setStatus(
            pending.current ? "Gemmer næste ændring…" : "✓ Gemt på din konto",
          );
        return true;
      } catch (e) {
        pending.current = true;
        cache(true);
        if (mounted.current)
          setStatus(
            !navigator.onLine ? "Offline — gemt på denne enhed" : e instanceof Error
              ? e.message
              : "Gemmes lokalt. Prøver igen, når forbindelsen er tilbage.",
          );
        return false;
      } finally {
        inFlight.current = null;
      }
    })();
    inFlight.current = task;
    return task;
  };
  useEffect(() => {
    mounted.current = true;
    try {
      const local = JSON.parse(localStorage.getItem(key) || "null");
      if (local?.dirty && Array.isArray(local.sets)) {
        latest.current = { sets: local.sets, timerEnd: local.timerEnd || 0 };
        rawSet(local.sets);
        rawEnd(local.timerEnd || 0);
        pending.current = true;
        if (local.revision !== revision.current) {
          blocked.current = true;
          setConflict(true);
          setStatus(
            "Lokal kladde og server er forskellige. Vælg hvilken du vil beholde.",
          );
        }
      }
    } catch {}
    const online = () => {
        void flush();
      },
      timer = setInterval(() => {
        if (pending.current && !blocked.current) void flush();
      }, 4000);
    window.addEventListener("online", online);
    window.addEventListener("blur", online);
    document.addEventListener("visibilitychange", online);
    return () => {
      mounted.current = false;
      clearInterval(timer);
      window.removeEventListener("online", online);
      window.removeEventListener("blur", online);
      document.removeEventListener("visibilitychange", online);
    };
  }, [key]);
  useEffect(() => {
    if (readonly) return;
    const t = setTimeout(() => {
      void flush();
    }, 900);
    return () => clearTimeout(t);
  }, [sets, end]);
  function setSets(next: SetLog[] | ((s: SetLog[]) => SetLog[])) {
    const value = typeof next === "function" ? next(latest.current.sets) : next;
    latest.current = { ...latest.current, sets: value };
    rawSet(value);
    pending.current = true;
    cache(true);
    setStatus("Gemmer kladde…");
  }
  function setEnd(value: number) {
    latest.current = { ...latest.current, timerEnd: value };
    rawEnd(value);
    pending.current = true;
    cache(true);
    setStatus("Gemmer kladde…");
  }
  async function resolve(useLocal: boolean) {
    try {
      const r = await fetch("/api/platform/state", { cache: "no-store" }),
        s = await r.json();
      if (!r.ok) throw Error();
      const d = s.drafts.find((x: any) => x.day_id === id);
      revision.current = d?.revision || 0;
      if (!useLocal) {
        latest.current = d?.data || { sets: initial, timerEnd: 0 };
        rawSet(latest.current.sets);
        rawEnd(latest.current.timerEnd);
        pending.current = false;
        cache(false);
        setStatus("Serverens kladde er hentet.");
      } else pending.current = true;
      blocked.current = false;
      setConflict(false);
      if (useLocal) await flush();
    } catch {
      setStatus(
        "Kunne ikke hente serverens kladde. Dine lokale data er bevaret.",
      );
    }
  }
  return { sets, setSets, end, setEnd, status, conflict, resolve, flush };
}
