import { db, schema } from "./db";
import { seal, unseal, baseURL } from "./security";
type Payload = Record<string, unknown>;
export async function sendMail(
  email: string,
  kind: string,
  payload: Payload,
  key = crypto.randomUUID(),
) {
  await schema();
  await db().query(
    `INSERT INTO shaz_mail(id,email,kind,payload) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING`,
    [key, email, kind, seal(JSON.stringify(payload))],
  );
  await deliver(key);
  return key;
}
function message(kind: string, p: Payload) {
  if (kind === "request-receipt")
    return {
      subject:
        p.kind === "withdrawal"
          ? "SHAZ · Din fortrydelse er modtaget"
          : "SHAZ · Din henvendelse er modtaget",
      text: `Sagsnummer: ${p.id}\nModtaget: ${p.createdAt}\n\n${p.statement}\n\nHenvendelsen er gemt og afventer behandling. En modtaget fortrydelse er ikke i sig selv en gennemført tilbagebetaling.\nHjælp: ${baseURL()}/help`,
    };
  if (kind === "verify-email" || kind === "password-reset")
    return {
      subject:
        kind === "verify-email"
          ? "Bekræft din SHAZ-konto"
          : "Vælg en ny adgangskode til SHAZ",
      text: `Åbn linket og bekræft i browseren:\n${p.url}\n\nLinket udløber efter én time. Del det ikke. Hvis du ikke har bedt om dette, kan du ignorere mailen.`,
    };
  if (kind === "login")
    return {
      subject: "Dit sikre login til SHAZ",
      text: `Log ind på SHAZ ved at åbne dette link og bekræfte i browseren:\n${p.url}\n\nLinket er gyldigt i 15 minutter og kan bruges én gang. Del det ikke. Hvis du ikke har bedt om login, kan du ignorere denne mail.`,
    };
  if (kind === "invite")
    return {
      subject: "Invitation til administration af SHAZ",
      text: `Du er inviteret til SHAZ-administration. Bekræft din e-mail på ${baseURL()}/login og åbn derefter ${p.url}. Invitationen udløber efter 24 timer.`,
    };
  return {
    subject: "Din ordre hos SHAZ — 100 dage",
    text: `Tak for dit køb af SHAZ — 100 DAY TRANSFORMATION.\nOrdre: ${p.order}\nSamlet pris: 399,00 DKK. Engangsbetaling. Ingen abonnement.\nSælger: ${p.seller}\nCVR: ${p.cvr}\nAdresse: ${p.address}\nSupport: ${p.support}\nAdgang: 100 kalenderdage fra din valgte, aktive startdato.\nSelvstyret digital træning og kostinspiration for voksne. Ikke 1:1-coaching.\nDu beholder 14 dages fortrydelsesret fra købsdatoen. Anmod om refundering under Profil → Mit køb, eller skriv til support med ordrenummeret.\nVilkår (${p.termsVersion}): ${baseURL()}/terms\n${p.termsText || ""}\nPrivatliv: ${baseURL()}/privacy\nÅbn dit forløb: ${baseURL()}/app. Brug din konto med e-mail og adgangskode. Hvis du tidligere brugte e-maillinks, er den loginmetode fortsat tilgængelig.`,
  };
}
export async function deliver(id: string) {
  const r = await db().query(
    `UPDATE shaz_mail SET attempts=attempts+1,status='sending',attempted_at=now() WHERE id=$1 AND (status IN ('queued','failed') OR (status='sending' AND attempted_at<now()-interval '2 minutes')) AND attempts<5 RETURNING *`,
    [id],
  );
  if (!r.rowCount) return;
  const m = r.rows[0];
  try {
    const suppressed = await db().query(
      "SELECT 1 FROM shaz_mail WHERE lower(email)=lower($1) AND status IN ('bounced','complained') LIMIT 1",
      [m.email],
    );
    if (suppressed.rowCount) {
      await db().query(
        "UPDATE shaz_mail SET status='suppressed',payload=NULL,error_code='RECIPIENT_SUPPRESSED' WHERE id=$1",
        [id],
      );
      return;
    }
    if (
      ["login", "verify-email", "password-reset"].includes(m.kind) &&
      Date.now() - new Date(m.created_at).getTime() >
        (m.kind === "login" ? 14 : 59) * 60 * 1000
    ) {
      await db().query(
        "UPDATE shaz_mail SET status='expired',payload=NULL,error_code='REQUEST_NEW_LOGIN' WHERE id=$1",
        [id],
      );
      return;
    }
    const p = JSON.parse(unseal(m.payload));
    if (
      process.env.APP_ENV === "test" &&
      process.env.MAIL_TRANSPORT === "test" &&
      new URL(baseURL()).hostname === "localhost"
    ) {
      await db().query(
        "UPDATE shaz_mail SET status='test-captured',error_code=NULL WHERE id=$1",
        [id],
      );
      return;
    }
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
      throw new Error("MAIL_NOT_CONFIGURED");
    if (m.email.toLowerCase().endsWith(".example")) {
      await db().query(
        "UPDATE shaz_mail SET status='suppressed',payload=NULL,error_code='FICTIONAL_ADDRESS' WHERE id=$1",
        [id],
      );
      return;
    }
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": id,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [m.email],
        ...message(m.kind, p),
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok)
      throw new Error(
        resp.status === 429 || resp.status >= 500
          ? "DELIVERY_FAILED"
          : "PROVIDER_REJECTED",
      );
    const result = await resp.json();
    await db().query(
      "UPDATE shaz_mail SET provider_id=$2,status='sent',payload=NULL,error_code=NULL WHERE id=$1",
      [id, result.id],
    );
  } catch (e) {
    const code =
      e instanceof Error &&
      ["MAIL_NOT_CONFIGURED", "PROVIDER_REJECTED"].includes(e.message)
        ? e.message
        : "DELIVERY_FAILED";
    await db().query(
      "UPDATE shaz_mail SET status='failed',error_code=$2,next_attempt_at=now()+(POWER(2,attempts)*30)*interval '1 second',attempts=CASE WHEN $2='PROVIDER_REJECTED' THEN 5 ELSE attempts END WHERE id=$1",
      [id, code],
    );
  }
}
