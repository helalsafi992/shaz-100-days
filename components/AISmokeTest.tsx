"use client";
import { useState } from "react";
export default function AISmokeTest(){
  const [busy,setBusy]=useState(false),[output,setOutput]=useState<unknown>(null);
  async function run(){
    setBusy(true);setOutput(null);
    try {
      const r=await fetch("/api/ai/smoke",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});
      const v=await r.json();
      setOutput({httpStatus:r.status,...v});
    } catch {setOutput({error:"Netværksfejl."});}
    finally{setBusy(false);}
  }
  return <section style={{maxWidth:620,margin:"40px auto",padding:24,fontFamily:"system-ui"}}>
    <a href="/app">Til SHAZ</a>
    <h1>AI-forbindelse: isoleret test</h1>
    <p>Et fiktivt eksempel kontrollerer PubMed og OpenAI. Ingen kontooplysninger bliver sendt eller ændret.</p>
    <button type="button" onClick={run} disabled={busy}>{busy?"Tester…":"Kør test med fiktive data"}</button>
    {output&&<pre role="status" style={{whiteSpace:"pre-wrap"}}>{JSON.stringify(output,null,2)}</pre>}
  </section>;
}
