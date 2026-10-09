/** PubMed adapter: fixed endpoints + server-authored topics, never personal search strings. */
export const evidenceVersion="pubmed-abstracts-v1";
export const topics={hypertrophy:'resistance training hypertrophy healthy adults',strength:'resistance training strength training frequency adults',fitness:'aerobic exercise training cardiorespiratory fitness adults','fat-loss':'resistance exercise energy restriction lean mass adults',sport:'concurrent resistance endurance training adults',maintenance:'physical activity resistance training adults','hip-fai':'femoroacetabular impingement exercise rehabilitation','knee-pain':'patellofemoral pain exercise therapy','shoulder-pain':'rotator cuff shoulder pain exercise therapy','back-pain':'chronic low back pain exercise','plant-protein':'vegan vegetarian diet resistance training protein adults'} as const;
export type Topic=keyof typeof topics;
export type Evidence={pmid:string;title:string;year:string;journal:string;url:string;recordText:string;coverage:"citation-and-abstract";retrievedAt:string;reviewStatus:"unreviewed"};
export function pubmedQuery(topic:Topic){
  if(!Object.hasOwn(topics,topic)) throw Error('EVIDENCE_TOPIC_INVALID');
  return `(${topics[topic]}) AND (systematic review[pt] OR meta-analysis[pt] OR practice guideline[pt]) NOT (retracted publication[pt] OR retraction of publication[pt] OR expression of concern[pt]) NOT (animals[mh] NOT humans[mh])`;
}
export async function boundedText(r:Response,max=250000){
  if(!r.ok) throw Error(`UPSTREAM_HTTP_${r.status}`);
  if(Number(r.headers.get('content-length')||0)>max) throw Error('UPSTREAM_TOO_LARGE');
  const reader=r.body?.getReader();if(!reader)throw Error('UPSTREAM_EMPTY');
  const chunks:Uint8Array[]=[];let size=0;
  try {for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>max)throw Error('UPSTREAM_TOO_LARGE');chunks.push(value);}}
  finally {await reader.cancel().catch(()=>{});}
  return new TextDecoder().decode(Buffer.concat(chunks));
}
export async function fetchEvidence(topic:Topic,opts:{fetcher?:typeof fetch;pace?:()=>Promise<void>;key?:string;email?:string;limit?:number}={}):Promise<Evidence[]>{
  const fetcher=opts.fetcher||fetch,limit=Math.max(1,Math.min(4,opts.limit||4));
  const request=async (endpoint:string,params:Record<string,string>)=>{
    await opts.pace?.();
    const q=new URLSearchParams({...params,tool:'shaz-evidence',...(opts.key?{api_key:opts.key}:{}),...(opts.email?{email:opts.email}:{})});
    return boundedText(await fetcher('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/'+endpoint+'?'+q,{signal:AbortSignal.timeout(10000),redirect:'error',headers:{Accept:'application/json, text/plain'}}));
  };
  const search=JSON.parse(await request('esearch.fcgi',{db:'pubmed',term:pubmedQuery(topic),retmode:'json',retmax:String(limit),sort:'relevance'}));
  if(search.error || !search.esearchresult || !Array.isArray(search.esearchresult.idlist))throw Error('EVIDENCE_SEARCH_INVALID');
  const ids=(search.esearchresult.idlist as unknown[]).filter((x):x is string=>typeof x==='string'&&/^\d{1,10}$/.test(x)).slice(0,limit);
  if(!ids.length)return [];
  const summary=JSON.parse(await request('esummary.fcgi',{db:'pubmed',id:ids.join(','),retmode:'json'}));
  if(!summary.result)throw Error('EVIDENCE_SUMMARY_INVALID');
  const records:Evidence[]=[];
  for(const id of ids){
    const m=summary.result[id];if(!m || String(m.uid)!==id || !m.title)continue;
    if((m.pubtype||[]).some((p:string)=>/retract|expression of concern/i.test(p)))continue;
    const text=await request('efetch.fcgi',{db:'pubmed',id,rettype:'abstract',retmode:'text'});
    if(text.trim().length<120 || /<html|<error|captcha|rate limit/i.test(text))continue;
    records.push({pmid:id,title:String(m.title).slice(0,600),year:String(m.pubdate||'').slice(0,30),journal:String(m.fulljournalname||m.source||''),url:`https://pubmed.ncbi.nlm.nih.gov/${id}/`,recordText:text.slice(0,12000),coverage:'citation-and-abstract',retrievedAt:new Date().toISOString(),reviewStatus:'unreviewed'});
  }
  return records;
}
