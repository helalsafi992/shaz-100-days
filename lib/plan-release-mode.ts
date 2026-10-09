import {isolatedTest} from './test-environment';

/** Direct delivery is limited to the existing isolated demo and explicit local tests. */
export function directPlanPreview():boolean {
  if(process.env.STRIPE_MODE==='live'||process.env.PLAN_DELIVERY_MODE==='coach-review')return false;
  if(isolatedTest())return true;
  return process.env.PLAN_DELIVERY_MODE==='direct-preview' &&
    process.env.APP_ENV==='test' && !process.env.RAILWAY_PROJECT_ID &&
    /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(process.env.APP_URL||'');
}
