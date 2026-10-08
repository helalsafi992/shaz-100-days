import { salesOpen } from "@/lib/payments";
export default function Gate({ message }: { message: string }) {
  return (
    <main className="portal auth-page">
      <a className="logo" href="/">
        SHAZ
      </a>
      <section className="p-card auth-card">
        <span className="p-eyebrow">DIN KONTO</span>
        <h1>Vi hjælper dig videre.</h1>
        <p>{message}</p>
        <div className="p-actions">
          <a className="p-button" href="/login">
            Log ind
          </a>
          {salesOpen() ? (
            <a className="p-secondary" href="/checkout">
              Køb forløbet – 399 kr.
            </a>
          ) : (
            <span className="p-note">Salg er ikke åbnet.</span>
          )}
          <a className="p-secondary" href="/app/profile">
            Mit køb & hjælp
          </a>
        </div>
        <a href="/">Til forsiden</a>
      </section>
    </main>
  );
}
