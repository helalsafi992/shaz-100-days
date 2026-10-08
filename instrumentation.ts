export async function register(){if(process.env.NEXT_RUNTIME==="nodejs"&&process.env.DATABASE_URL){const {startMailWorker}=await import("./lib/mail-worker");startMailWorker();}}
