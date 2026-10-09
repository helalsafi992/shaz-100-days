/** Only canonical internal app destinations. No external redirect or login loop. */
export function safeReturnPath(value:string|null|undefined):string {
 if(!value||value.length>600||!/^\/(?:app|onboarding)(?:[/?#]|$)/.test(value))return '/app';
 if(/[\\\u0000-\u0020]/.test(value)||/%0[0-9a-f]|%1[0-9a-f]|%2f|%5c|%3a/i.test(value))return '/app';
 try{const url=new URL(value,'https://shaz.invalid');return url.origin==='https://shaz.invalid'?url.pathname+url.search+url.hash:'/app';}catch{return '/app';}
}
