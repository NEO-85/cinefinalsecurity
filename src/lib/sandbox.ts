/**
 * ══════════════════════════════════════════════════════════════
 *  CINETARO API — SANDBOX DETECTION MODULE
 * ══════════════════════════════════════════════════════════════
 *
 *  Detects environments that sandbox the browser:
 *    - Headless browsers (Puppeteer, Playwright, Selenium, PhantomJS)
 *    - Browser automation (WebDriver, Nightmare, Cypress)
 *    - DevTools (timing-based + debugger trap)
 *    - Iframe sandbox restrictions
 *    - Request interception (Service Worker, proxy tools)
 *    - Browser fingerprint anomalies
 *    - Timing anomalies
 *
 * ══════════════════════════════════════════════════════════════
 */

export interface SandboxConfig {
  blockHeadless: boolean;
  blockDevTools: boolean;
  blockAutomation: boolean;
  blockSandboxedIframe: boolean;
  blockRequestInterception: boolean;
  blockTimingAnomalies: boolean;
  blockMessage: string;
  blockSubMessage: string;
}

const DEFAULT_CONFIG: SandboxConfig = {
  blockHeadless: true,
  blockDevTools: true,
  blockAutomation: true,
  blockSandboxedIframe: false,
  blockRequestInterception: true,
  blockTimingAnomalies: true,
  blockMessage: "Automated Browser Detected",
  blockSubMessage: "Please use a standard browser to continue watching.",
};

export function generateSandboxDetection(config: Partial<SandboxConfig> = {}): string {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const parts: string[] = [];

  // ── Detection: Headless browser ──
  if (cfg.blockHeadless) {
    parts.push(`
function detectHeadless(){
  if(navigator.webdriver)violations.push('headless_webdriver');
  if(window._phantom||window.__nightmare||window.callPhantom)violations.push('headless_phantom');
  if(navigator.userAgent.indexOf('HeadlessChrome')!==-1)violations.push('headless_ua');
  if(navigator.userAgent.indexOf('Headless')!==-1)violations.push('headless_ua');
  if(window.cdc_adoQpoasnfa76pfcZLmcfl_Array)violations.push('headless_cdp');
  try{if(document.$cdc_asdjflasutopfhvcZLmcfl_)violations.push('headless_selenium')}catch(e){}
  if(navigator.plugins&&navigator.plugins.length===0)violations.push('headless_no_plugins');
  if(!navigator.languages||navigator.languages.length===0)violations.push('headless_no_languages');
  if(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=1)violations.push('headless_low_cores');
  if(window.screen&&(window.screen.width===0||window.screen.height===0))violations.push('headless_no_screen');
  if(window.screen&&window.screen.colorDepth===0)violations.push('headless_no_colordepth');
  try{if(!navigator.userAgent.match(/Firefox|Safari/i)&&!window.chrome)violations.push('headless_no_chrome')}catch(e){}
}`);
  }

  // ── Detection: DevTools ──
  if (cfg.blockDevTools) {
    parts.push(`
function detectDevTools(){
  var t1=performance.now();
  var obj={};for(var i=0;i<10000;i++)obj['k'+i]='v'+i;
  JSON.stringify(obj);
  var t2=performance.now();
  if(t2-t1>100)violations.push('devtools_timing');

  function debuggerTrap(){
    var before=Date.now();
    (function(){}).constructor('debugger')();
    if(Date.now()-before>100)violations.push('devtools_debugger');
  }
  setInterval(debuggerTrap,3000);
  debuggerTrap();

  var thr=160;
  if(window.outerWidth-window.innerWidth>thr||window.outerHeight-window.innerHeight>thr)violations.push('devtools_size');
}`);
  }

  // ── Detection: Automation tools ──
  if (cfg.blockAutomation) {
    parts.push(`
function detectAutomation(){
  if(window.__nightmare)violations.push('automation_nightmare');
  if(window.__CY)violations.push('automation_cypress');
  if(window.__playwright||window._playwright)violations.push('automation_playwright');
  try{
    if(document.querySelector('[id="__selenium_unwrapped"]')||document.querySelector('[class="selenium-ide"]'))violations.push('automation_selenium_ide');
  }catch(e){}
  try{
    var ts=Function.prototype.toString;
    if(ts.call(navigator.userAgent).indexOf('[native code]')===-1)violations.push('automation_overridden_native');
  }catch(e){}
}`);
  }

  // ── Detection: Sandboxed iframe ──
  if (cfg.blockSandboxedIframe) {
    parts.push(`
function detectSandbox(){
  if(window.self!==window.top){
    try{void window.parent.location.href}catch(e){violations.push('sandbox_cross_origin')}
    try{
      if(window.frameElement&&window.frameElement.hasAttribute('sandbox')){
        var sv=window.frameElement.getAttribute('sandbox')||'';
        if(sv.indexOf('allow-same-origin')===-1)violations.push('sandbox_no_same_origin');
      }
    }catch(e){violations.push('sandbox_cross_origin_frame')}
  }
}`);
  }

  // ── Detection: Request interception ──
  if (cfg.blockRequestInterception) {
    parts.push(`
function detectRequestInterception(){
  try{
    if('serviceWorker' in navigator){
      navigator.serviceWorker.getRegistrations().then(function(regs){
        regs.forEach(function(reg){if(reg.scope&&reg.scope.indexOf(location.origin)!==-1)violations.push('interception_serviceworker')});
      }).catch(function(){});
    }
  }catch(e){}
  try{if(window.fetch.toString().indexOf('[native code]')===-1)violations.push('interception_fetch_override')}catch(e){}
  try{if(XMLHttpRequest.prototype.open.toString().indexOf('[native code]')===-1)violations.push('interception_xhr_override')}catch(e){}
  try{if(WebSocket.toString().indexOf('[native code]')===-1)violations.push('interception_ws_override')}catch(e){}
}`);
  }

  // ── Detection: Timing anomalies ──
  if (cfg.blockTimingAnomalies) {
    parts.push(`
function detectTimingAnomalies(){
  try{
    var t1=performance.now();var end=t1+5;
    while(performance.now()<end){}
    var elapsed=performance.now()-t1;
    if(elapsed===0)violations.push('timing_zero');
    if(elapsed>200)violations.push('timing_manipulated');
  }catch(e){}
}`);
  }

  // ── Detection: UA anomalies ──
  parts.push(`
function detectUAAnomalies(){
  var ua=navigator.userAgent;
  if(/bot|crawler|spider|scrapy|curl|wget|python|java\\/|httpclient|node-fetch|axios|got\\//i.test(ua))violations.push('ua_bot');
  if(ua.length<30)violations.push('ua_short');
}`);

  // ── Block overlay function ──
  const blockMsg = cfg.blockMessage.replace(/'/g, "\\'");
  const blockSub = cfg.blockSubMessage.replace(/'/g, "\\'");
  parts.push(`
function showBlocked(){
  document.documentElement.style.display='none';
  var ov=document.createElement('div');
  ov.setAttribute('id','sandbox-block-overlay');
  ov.style.cssText='position:fixed!important;inset:0!important;z-index:999999!important;display:flex!important;align-items:center!important;justify-content:center!important;flex-direction:column!important;background:rgba(0,0,0,0.97)!important;font-family:system-ui,-apple-system,sans-serif!important;';
  ov.innerHTML='<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ff4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:24px;opacity:0.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><div style="color:#ff4444;font-size:20px;font-weight:700;margin-bottom:12px;letter-spacing:-0.3px">${blockMsg}</div><div style="color:#888;font-size:14px;text-align:center;max-width:380px;line-height:1.6">${blockSub}</div><div style="margin-top:32px"><button onclick="location.reload()" style="padding:10px 28px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:#fff;font-size:14px;font-weight:500;cursor:pointer;transition:all .2s">Retry</button></div><div style="margin-top:40px;color:#444;font-size:11px;text-align:center;max-width:340px;line-height:1.5">Code: <span style="color:#555;font-family:monospace">SHIELD-<span id="sb-code">000</span></span></div>';
  document.body.appendChild(ov);
  var codeEl=ov.querySelector('#sb-code');
  if(codeEl&&violations.length>0){codeEl.textContent=violations.slice(0,3).map(function(v){return v.toUpperCase().replace(/_/g,'-')}).join('|').substring(0,40)}
  window.stop();
  try{window.parent.postMessage({event:'sandbox_blocked',violations:violations},'*')}catch(e){}
}`);

  // ── Build conditional call list ──
  const callList: string[] = [];
  if (cfg.blockHeadless)            callList.push('detectHeadless()');
  if (cfg.blockDevTools)            callList.push('detectDevTools()');
  if (cfg.blockAutomation)          callList.push('detectAutomation()');
  if (cfg.blockSandboxedIframe)     callList.push('detectSandbox()');
  if (cfg.blockRequestInterception) callList.push('detectRequestInterception()');
  if (cfg.blockTimingAnomalies)     callList.push('detectTimingAnomalies()');
  callList.push('detectUAAnomalies()');

  const detectionFns = parts.slice(0, -1).join("\n");
  const blockFn = parts[parts.length - 1];

  return `(function SandboxShield(){
  var violations=[];
  ${detectionFns}
  ${blockFn}

  try{
    ${callList.join(';')}
  }catch(e){}

  setTimeout(function(){
    var CRITICAL=[
      'headless_webdriver','headless_ua','headless_cdp','headless_selenium','headless_phantom',
      'automation_nightmare','automation_cypress','automation_playwright',
      'ua_bot',
      'interception_fetch_override','interception_xhr_override','interception_serviceworker'
    ];
    var WARNINGS=[
      'headless_no_plugins','headless_no_languages','headless_low_cores',
      'headless_no_screen','headless_no_colordepth','headless_no_chrome',
      'devtools_debugger','devtools_size','devtools_timing',
      'timing_manipulated','timing_zero',
      'sandbox_cross_origin','sandbox_no_same_origin','sandbox_cross_origin_frame',
      'ua_short',
      'automation_overridden_native','automation_selenium_ide',
      'interception_ws_override'
    ];
    var hasCritical=violations.some(function(v){return CRITICAL.indexOf(v)!==-1});
    var warningCount=violations.filter(function(v){return WARNINGS.indexOf(v)!==-1}).length;
    if(hasCritical||warningCount>=3){showBlocked()}
  },800);
})();`;
}

/**
 * Server-side fingerprint validation
 */
export interface ClientFingerprint {
  ua: string;
  lang: string;
  langs: string[];
  platform: string;
  cores: number;
  screenW: number;
  screenH: number;
  colorDepth: number;
  timezone: string;
  plugins: number;
  touchPoints: number;
  WebGL: string;
}

export function validateFingerprint(fp: ClientFingerprint): { pass: boolean; score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 100;

  if (!fp.ua || fp.ua.length < 30)                                        { reasons.push("short_ua");      score -= 30; }
  if (/bot|crawler|spider|scrapy|curl|wget|python/i.test(fp.ua))          { reasons.push("bot_ua");        score -= 50; }
  if (fp.ua.includes("Headless"))                                          { reasons.push("headless_ua");   score -= 50; }
  if (fp.cores <= 1)                                                       { reasons.push("low_cores");     score -= 15; }
  if (fp.screenW === 0 || fp.screenH === 0)                               { reasons.push("no_screen");     score -= 20; }
  if (fp.colorDepth === 0)                                                 { reasons.push("no_colordepth"); score -= 15; }
  if (!fp.langs || fp.langs.length === 0)                                  { reasons.push("no_languages");  score -= 15; }
  if (fp.plugins === 0 && !fp.ua.includes("Firefox"))                     { reasons.push("no_plugins");    score -= 10; }
  if (fp.WebGL && /swiftshader|llvmpipe|software/i.test(fp.WebGL))        { reasons.push("sw_renderer");   score -= 30; }

  return { pass: score >= 50, score, reasons };
}
