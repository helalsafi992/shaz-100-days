import HelpRequest from "@/components/HelpRequest";
export default function Withdraw() {
  return (
    <main className="portal p-main">
      <header className="p-top">
        <a className="logo" href="/">
          SHAZ
        </a>
        <a href="/help">Hjælp</a>
      </header>
      <h1>Fortryd aftale.</h1>
      <HelpRequest withdrawal />
    </main>
  );
}
