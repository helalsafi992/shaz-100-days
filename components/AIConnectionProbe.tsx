"use client";
import {useState} from 'react';
/** Diagnostic UI is rendered only for an authorized account in the isolated test database. */
export default function AIConnectionProbe(){
 const[busy,setBusy]=useState(false),[done,setDone]=useState(false),[result,setResult]=useState<{status:number;body:Record<string,unknown>}|null>(null);
 async function run(){if(busy||done)return;setBusy(true);try{const r=await fetch('/api/test/ai-probe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({confirm:true})});const body=await r.json();setResult({status:r.status,body});setDone(true);}catch{setResult({status:0,body:{error:'Forbindelsen blev afbrudt. Kontrollér serverloggen før et nyt forsøg.'}});setDone(true);}finally{setBusy(false);}}
 return <section className="p-card"><h1>Test af OpenAI-forbindelsen</h1><p>Der bruges kun en indbygget, fiktiv voksenprofil. Dine egne svar, skader og aktive planer læses eller ændres ikke.</p><p>Knappen foretager ét rigtigt API-kald via serverens nøgle. Nøglen vises aldrig i browseren.</p><button className="p-button" type="button" disabled={busy||done} onClick={run}>{busy?'Kontakter OpenAI…':'Kør test med fiktive data'}</button>{busy&&<p role="status">Vent på svaret uden at forlade siden.</p>}{result&&<><h2>Resultat · HTTP {result.status}</h2><pre id="ai-probe-result" style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontSize:13}}>{JSON.stringify(result,null,2)}</pre></>}<p><a href="/app">Til mit forløb</a></p></section>;
}
