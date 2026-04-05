import {
  CLIENT_PASS_B64,
  CLIENT_SALT_B64,
} from "@/lib/crypto";
import SERVERS from "@/config/servers";
import { generateSandboxDetection } from "@/lib/sandbox";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/* ── Server fetch helpers ── */

async function fetchWithTimeout(url: string, opts: RequestInit = {}, timeout = 8000): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeout);
  try { const res = await fetch(url, { ...opts, signal: ctrl.signal }); clearTimeout(id); return res; }
  catch { clearTimeout(id); throw new Error("timeout"); }
}

function buildApiUrl(cfg: { base: string; path?: string }, tmdbId: string, type: string, season?: string | null, episode?: string | null): string {
  if (cfg.path) return cfg.path.replace("{id}", tmdbId).replace("{season}", season || "1").replace("{episode}", episode || "1");
  if (type === "series" && season && episode) return `${cfg.base}/tv/${tmdbId}/${season}/${episode}`;
  return `${cfg.base}/movie/${tmdbId}`;
}

async function tryServer(cfg: { base: string; proxy?: string; referer?: boolean; timeout?: number; path?: string }, tmdbId: string, type: string, season?: string | null, episode?: string | null): Promise<string | null> {
  const apiUrl = buildApiUrl(cfg, tmdbId, type, season, episode);
  const headers: Record<string, string> = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" };
  if (cfg.referer) headers["Referer"] = cfg.base;
  try {
    const res = await fetchWithTimeout(apiUrl, { headers }, cfg.timeout || 8000);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.stream && typeof data.stream === "string") {
      let stream = data.stream;
      if (cfg.proxy) stream = stream.replace(cfg.base, cfg.proxy);
      return stream;
    }
    return null;
  } catch { return null; }
}

export async function resolveStreams(tmdbId: string, type: string, season?: string | null, episode?: string | null): Promise<{ name: string; url: string }[]> {
  const results = await Promise.allSettled(SERVERS.map((cfg) => tryServer(cfg, tmdbId, type, season, episode)));
  const servers: { name: string; url: string }[] = [];
  results.forEach((r, i) => { if (r.status === "fulfilled" && r.value) servers.push({ name: SERVERS[i].name, url: r.value }); });
  return servers;
}

/* ── Player HTML generator (instant shell, fully proxied) ── */

export function generatePlayerPage(
  tmdbId: string,
  type: string,
  season?: string | null,
  episode?: string | null,
  color = "#E6B800",
  logo = "",
  title = "",
  autoplay = true
): string {
  const safeAutoplay = autoplay ? "true" : "false";
  const safeLogo = logo.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;");
  const safeTitle = title.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;");
  const safeColor = color.replace(/'/g, "");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Player</title>
  <script type="module" src="https://cdn.vidstack.io/player"></script>
  <link rel="stylesheet" href="https://cdn.vidstack.io/player/theme.css" />
  <link rel="stylesheet" href="https://cdn.vidstack.io/player/video.css" />
  <style>
    :root{--media-brand:${safeColor};--media-focus-ring-color:${safeColor};--media-accent:${safeColor}}
    *{box-sizing:border-box;margin:0;padding:0}
    body,html{margin:0;padding:0;width:100%;height:100%;background:#000;overflow:hidden}
    media-player{width:100%;height:100%;display:block}

    .sv-box{position:absolute;top:12px;left:12px;z-index:50}
    .sv-btn{
      width:40px;height:40px;display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
      border:1px solid rgba(255,255,255,0.1);border-radius:10px;
      color:rgba(255,255,255,0.85);cursor:pointer;padding:0;transition:all .2s;
    }
    .sv-btn:hover{background:rgba(0,0,0,0.7);border-color:rgba(255,255,255,0.25);color:#fff}
    .sv-btn svg{width:20px;height:20px;pointer-events:none}

    .sv-menu{
      position:absolute;top:calc(100% + 8px);left:0;min-width:200px;
      background:rgba(15,15,20,0.95);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
      border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:5px;
      opacity:0;visibility:hidden;transform:translateY(-4px);
      transition:all .2s cubic-bezier(.16,1,.3,1);box-shadow:0 12px 40px rgba(0,0,0,0.6);
    }
    .sv-menu.open{opacity:1;visibility:visible;transform:translateY(0)}
    .sv-menu-title{padding:8px 10px 6px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#666;font-weight:600}
    .sv-item{
      display:flex;align-items:center;width:100%;padding:9px 10px;border-radius:8px;
      border:none;background:transparent;color:#ccc;font-size:13px;
      cursor:pointer;transition:all .15s;font-family:inherit;text-align:left;
    }
    .sv-item:hover{background:rgba(255,255,255,0.08);color:#fff}
    .sv-item.active{background:${safeColor}18;color:${safeColor}}
    .sv-item-dot{width:6px;height:6px;border-radius:50%;margin-right:10px;flex-shrink:0;background:#444;transition:all .2s}
    .sv-item.active .sv-item-dot{background:${safeColor};box-shadow:0 0 6px ${safeColor}88}
    .sv-item-name{flex:1;font-weight:500}
    .sv-item-badge{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding:2px 7px;border-radius:4px;background:${safeColor}22;color:${safeColor}}

    .custom-logo{position:absolute;top:14px;left:60px;z-index:50;max-height:36px;opacity:.85;pointer-events:none}

    .init-overlay{
      position:absolute;inset:0;z-index:100;
      display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;
      background:rgba(0,0,0,0.9);backdrop-filter:blur(10px);
      transition:opacity .4s;
    }
    .init-overlay.hide{opacity:0;pointer-events:none}
    .init-spinner{display:flex;gap:8px}
    .init-spinner div{width:10px;height:10px;border-radius:50%;background:${safeColor};animation:sdot 1.4s infinite ease-in-out both}
    .init-spinner div:nth-child(1){animation-delay:-0.32s}
    .init-spinner div:nth-child(2){animation-delay:-0.16s}
    @keyframes sdot{0%,80%,100%{transform:scale(0);opacity:.4}40%{transform:scale(1);opacity:1}}
    .init-text{color:#fff;font-size:14px;font-weight:500}
    .init-sub{color:#888;font-size:12px}

    .switch-overlay{
      position:absolute;inset:0;z-index:150;display:none;
      flex-direction:column;align-items:center;justify-content:center;gap:14px;
      background:rgba(0,0,0,0.82);backdrop-filter:blur(10px);pointer-events:none;
    }
    .switch-overlay.show{display:flex}
    .switch-text{color:#fff;font-size:14px;font-weight:500}

    .error-overlay{
      position:absolute;inset:0;z-index:200;display:none;
      flex-direction:column;align-items:center;justify-content:center;gap:12px;
      background:rgba(0,0,0,0.9);
    }
    .error-overlay.show{display:flex}
    .error-icon{color:#ff4444;font-size:32px}
    .error-title{color:#ff4444;font-size:16px;font-weight:600}
    .error-desc{color:#999;font-size:13px;text-align:center;max-width:300px}

    @media(max-width:480px){
      .sv-menu{min-width:170px}
      .sv-item{padding:8px;font-size:12px}
    }
  </style>
</head>
<body>
  <media-player id="player" title="${safeTitle || "Player"}" src="" crossorigin playsinline storage="player-storage">
    <media-provider></media-provider>
    <media-video-layout></media-video-layout>
  </media-player>

  <!-- Server menu (populated after decrypt) -->
  <div class="sv-box" id="svBox" style="display:none">
    <button class="sv-btn" id="svBtn" title="Servers">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="3" width="20" height="5" rx="1"/>
        <rect x="2" y="10" width="20" height="5" rx="1"/>
        <rect x="2" y="17" width="20" height="5" rx="1"/>
        <circle cx="18" cy="5.5" r="1" fill="currentColor"/>
        <circle cx="18" cy="12.5" r="1" fill="currentColor"/>
        <circle cx="18" cy="19.5" r="1" fill="currentColor"/>
      </svg>
    </button>
    <div class="sv-menu" id="svMenu">
      <div class="sv-menu-title">Servers</div>
      <div id="svItems"></div>
    </div>
  </div>

  ${safeLogo ? `<img class="custom-logo" src="${safeLogo}" alt="Logo" />` : ""}

  <!-- Initial loading overlay -->
  <div class="init-overlay" id="initOverlay">
    <div class="init-spinner"><div></div><div></div><div></div></div>
    <div class="init-text" id="initText">Loading player...</div>
    <div class="init-sub" id="initSub">Preparing secure stream</div>
  </div>

  <!-- Server switch overlay -->
  <div class="switch-overlay" id="switchOverlay">
    <div class="init-spinner"><div></div><div></div><div></div></div>
    <div class="switch-text" id="switchText">Switching server...</div>
  </div>

  <!-- Error overlay -->
  <div class="error-overlay" id="errorOverlay">
    <div class="error-icon">&#9888;</div>
    <div class="error-title">Stream Not Available</div>
    <div class="error-desc" id="errorDesc">No working server found. Please try again later.</div>
  </div>

  <script>${generateSandboxDetection({
    blockAdBlock: true,
    blockHeadless: true,
    blockDevTools: true,
    blockAutomation: true,
    blockSandboxedIframe: false,
    blockPrivacyBrowsers: true,
    blockRequestInterception: true,
    blockTimingAnomalies: true,
    blockMessage: 'Ad Blocker Detected',
    blockSubMessage: 'Please disable your ad blocker, VPN, or privacy extension and reload the page to continue watching.',
  })}</script>

  <script type="module">
    /* ── Config ── */
    const TMDB_ID='${tmdbId}',MEDIA_TYPE='${type}',SEASON=parseInt('${season}')||0,EPISODE=parseInt('${episode}')||0;
    const API_KEY='61e2290429798c561450eb56b26de19b',AUTOPLAY=${safeAutoplay};
    const storageKey='vids-pos-'+TMDB_ID+'-'+MEDIA_TYPE+'-'+SEASON+'-'+EPISODE;
    let player,SESSION_TOKEN='',SERVER_LIST=[],TOTAL_SERVERS=0,currentSvIdx=0,menuOpen=false,nextEpInfo=null,nextEpBroadcasted=false;

    /* ── AES-256-GCM Client Decryption ── */
    async function deriveKey(){
      const enc=new TextEncoder();
      const pp=atob('${CLIENT_PASS_B64}'),sl=atob('${CLIENT_SALT_B64}');
      const km=await crypto.subtle.importKey('raw',enc.encode(pp),'PBKDF2',false,['deriveKey']);
      return crypto.subtle.deriveKey({name:'PBKDF2',salt:enc.encode(sl),iterations:100000,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['decrypt']);
    }
    async function decrypt(buf){
      const key=await deriveKey(),data=new Uint8Array(buf),iv=data.slice(0,12),ct=data.slice(12);
      const dec=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,ct);
      return JSON.parse(new TextDecoder().decode(dec));
    }

    /* ── Server menu ── */
    function buildServerMenu(servers){
      SERVER_LIST=servers;TOTAL_SERVERS=servers.length;
      const box=document.getElementById('svBox');box.style.display='';
      const items=document.getElementById('svItems');
      items.innerHTML=servers.map((s,i)=>
        '<button class="sv-item'+(i===currentSvIdx?' active':'')+'" data-idx="'+i+'"><span class="sv-item-dot"></span><span class="sv-item-name">'+s.name+'</span>'+(i===0?'<span class="sv-item-badge">Default</span>':'')+'</button>'
      ).join('');
      items.querySelectorAll('.sv-item').forEach(b=>{
        b.addEventListener('click',()=>switchServer(parseInt(b.dataset.idx)));
      });
      document.getElementById('svBtn').addEventListener('click',(e)=>{e.stopPropagation();menuOpen=!menuOpen;document.getElementById('svMenu').classList.toggle('open',menuOpen)});
    }
    document.addEventListener('click',function(e){if(menuOpen&&!document.querySelector('.sv-box').contains(e.target)){menuOpen=false;document.getElementById('svMenu').classList.remove('open')}});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&menuOpen){menuOpen=false;document.getElementById('svMenu').classList.remove('open')}});

    function switchServer(idx){
      if(idx===currentSvIdx)return;
      if(idx<0||idx>=SERVER_LIST.length)return;
      currentSvIdx=idx;
      document.querySelectorAll('.sv-item').forEach((b,i)=>b.classList.toggle('active',i===idx));
      menuOpen=false;document.getElementById('svMenu').classList.remove('open');
      document.getElementById('switchText').textContent='Switching to '+SERVER_LIST[idx].name+'...';
      document.getElementById('switchOverlay').classList.add('show');
      player.src='/file2/'+encodeURIComponent(SESSION_TOKEN)+'?_sv='+idx;
    }

    /* ── TMDB helpers ── */
    async function fetchJ(u){try{const r=await fetch(u);if(!r.ok)return null;return await r.json()}catch(e){return null}}
    async function fetchSubs(){
      try{const u=MEDIA_TYPE==='series'&&SEASON&&EPISODE?'https://sub.wyzie.ru/search?id='+TMDB_ID+'&season='+SEASON+'&episode='+EPISODE+'&key=wyzie-53f263aa7f417f95f806e4bd5434eff7':'https://sub.wyzie.ru/search?id='+TMDB_ID+'&key=wyzie-53f263aa7f417f95f806e4bd5434eff7';const r=await fetch(u);if(!r.ok)return[];const d=await r.json();return Array.isArray(d)?d:[]}catch(e){return[]}
    }
    async function checkNextEpisode(){
      if(MEDIA_TYPE!=='series'||!SEASON||!EPISODE)return null;
      let s=SEASON,e=EPISODE+1;
      try{let r=await fetch('https://api.themoviedb.org/3/tv/'+TMDB_ID+'/season/'+s+'/episode/'+e+'?api_key='+API_KEY);if(r.ok){const d=await r.json();return{season:s,episode:e,name:d.name||'Episode '+e}};s++;e=1;r=await fetch('https://api.themoviedb.org/3/tv/'+TMDB_ID+'/season/'+s+'/episode/'+e+'?api_key='+API_KEY);if(r.ok){const d=await r.json();return{season:s,episode:e,name:d.name||'Episode '+e}}}catch(x){}return null;
    }

    /* ── WebGL renderer fingerprint ── */
    function getWebGLRenderer(){
      try{const c=document.createElement('canvas');const gl=c.getContext('webgl')||c.getContext('experimental-webgl');if(!gl)return'';const ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):''}catch(e){return''}
    }

    /* ── Server-side fingerprint verification ── */
    async function verifyFingerprint(){
      try{
        const fp={
          ua:navigator.userAgent,lang:navigator.language,
          langs:navigator.languages?Array.from(navigator.languages):[],
          platform:navigator.platform,
          cores:navigator.hardwareConcurrency||0,
          screenW:screen.width,screenH:screen.height,
          colorDepth:screen.colorDepth,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,
          plugins:navigator.plugins?navigator.plugins.length:0,
          touchPoints:navigator.maxTouchPoints||0,
          WebGL:getWebGLRenderer()
        };
        const res=await fetch('/api/detect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(fp)});
        if(!res.ok)return false;
        const data=await res.json();
        return data.pass===true;
      }catch(e){return true} // If /api/detect fails, allow through (fail-open)
    }

    /* ── Challenge-response proof of work ── */
    async function solveChallenge(){
      try{
        const cRes=await fetch('/api/verify');
        if(!cRes.ok)return true;
        const{challenge,nonce,difficulty}=await cRes.json();
        const prefix='0'.repeat(difficulty||3);
        for(let i=0;i<500000;i++){
          const input=challenge+':'+nonce+':'+i;
          const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(input));
          const hex=Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
          if(hex.startsWith(prefix)){
            const vRes=await fetch('/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({challenge,nonce,proof:i})});
            const vData=await vRes.json();
            return vData.pass===true;
          }
        }
        return false;
      }catch(e){return true}
    }

    /* ══════════════════════════════════════════════════════════
       MAIN INIT — PLAYER LOADS INSTANTLY, STREAMS ARE PROXIED
       ══════════════════════════════════════════════════════════ */
    async function init(){
      window.parent.postMessage({event:'player_ready'},'*');

      /* Step 0: Server-side fingerprint + challenge verification */
      document.getElementById('initText').textContent='Verifying browser...';
      document.getElementById('initSub').textContent='Running security checks';
      const[fpOk,chOk]=await Promise.all([verifyFingerprint(),solveChallenge()]);
      if(!fpOk||!chOk){
        document.getElementById('initOverlay').classList.add('hide');
        document.documentElement.style.display='none';
        const ov=document.createElement('div');
        ov.style.cssText='position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;flex-direction:column;background:rgba(0,0,0,0.97);font-family:system-ui,-apple-system,sans-serif';
        ov.innerHTML='<svg width=\"64\" height=\"64\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ff4444\" stroke-width=\"1.5\"><path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z\"/><line x1=\"12\" y1=\"8\" x2=\"12\" y2=\"12\"/><line x1=\"12\" y1=\"16\" x2=\"12.01\" y2=\"16\"/></svg><div style=\"color:#ff4444;font-size:20px;font-weight:700;margin:24px 0 12px\">Security Check Failed</div><div style=\"color:#888;font-size:14px;text-align:center;max-width:380px;line-height:1.6\">Your browser failed the security verification. Please disable any automation tools, ad blockers, or privacy extensions and try again.</div><button onclick=\"location.reload()\" style=\"margin-top:32px;padding:10px 28px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:#fff;font-size:14px;font-weight:500;cursor:pointer\">Retry</button>';
        document.body.appendChild(ov);
        window.parent.postMessage({event:'sandbox_blocked',reason:'server_verify_failed'},'*');
        return;
      }

      /* Step 1: Fetch server list + encrypted session token in parallel */
      const streamParams=new URLSearchParams({type:MEDIA_TYPE});
      if(SEASON)streamParams.set('s',String(SEASON));
      if(EPISODE)streamParams.set('e',String(EPISODE));

      let servers,streamData;
      try{
        document.getElementById('initText').textContent='Fetching stream...';
        const[srvRes,stmRes]=await Promise.all([
          fetch('/api/servers'),
          fetch('/api/embed/stream/'+TMDB_ID+'?'+streamParams.toString())
        ]);
        servers=await srvRes.json();
        if(!stmRes.ok)throw new Error('fetch_failed');
        streamData=await decrypt(await stmRes.arrayBuffer());
      }catch(err){
        document.getElementById('initOverlay').classList.add('hide');
        document.getElementById('errorDesc').textContent='Failed to connect to stream server.';
        document.getElementById('errorOverlay').classList.add('show');
        window.parent.postMessage({event:'player_error',reason:'decrypt_failed'},'*');
        return;
      }

      /* Step 2: Check for errors */
      if(streamData.error){
        document.getElementById('initOverlay').classList.add('hide');
        document.getElementById('errorOverlay').classList.add('show');
        window.parent.postMessage({event:'player_error',reason:streamData.reason||'unknown'},'*');
        return;
      }

      /* Step 3: Build server menu from /api/servers */
      SESSION_TOKEN=streamData.token;
      buildServerMenu(Array.isArray(servers)?servers:[]);

      /* Step 4: Fetch metadata + subs in parallel */
      document.getElementById('initText').textContent='Loading content...';
      document.getElementById('initSub').textContent='Connecting to '+SERVER_LIST[currentSvIdx]?.name||'server';
      const[meta,subs,nep]=await Promise.all([
        fetchJ('https://api.themoviedb.org/3/'+(MEDIA_TYPE==='series'?'tv':'movie')+'/'+TMDB_ID+'?api_key='+API_KEY),
        fetchSubs(),
        checkNextEpisode()
      ]);
      nextEpInfo=nep;

      /* Step 5: Set title */
      let t='${safeTitle||""}';
      if(!t&&meta){const n=meta.name||meta.title||'Player';t=MEDIA_TYPE==='series'&&SEASON&&EPISODE?n+' - S'+String(SEASON).padStart(2,'0')+'E'+String(EPISODE).padStart(2,'0'):n}
      document.title=t;player.title=t;

      /* Step 6: Add subtitles */
      if(subs&&Array.isArray(subs)){
        const g={};
        subs.forEach(s=>{const l=s.language||'unknown';if(!g[l])g[l]=[];g[l].push(s)});
        Object.keys(g).forEach(l=>{g[l].forEach((s,i)=>{const tr=document.createElement('track');tr.src=s.url;tr.label=g[l].length>1?s.display+' ('+(i+1)+')'+(s.isHearingImpaired?' [CC]':''):s.display+(s.isHearingImpaired?' [CC]':'');tr.srclang=s.language;tr.kind='subtitles';if(s.language==='en'&&i===0)tr.default=true;player.querySelector('media-provider').appendChild(tr)})});
      }

      /* Step 7: Restore resume position */
      const st=localStorage.getItem(storageKey);
      if(st)player.currentTime=parseFloat(st);

      /* Step 8: SET PLAYER SRC TO PROXY — CLIENT NEVER SEES EXTERNAL URL */
      document.getElementById('initText').textContent='Starting playback...';
      document.getElementById('initSub').textContent='Stream proxied via secure tunnel';
      player.src='/file2/'+encodeURIComponent(SESSION_TOKEN);
    }

    /* ── Player events ── */
    function setupEvents(){
      player.addEventListener('can-play',function(){
        document.getElementById('initOverlay').classList.add('hide');
        document.getElementById('switchOverlay').classList.remove('show');
        if(AUTOPLAY&&!player._started){player._started=true;player.play().catch(()=>{})}
      },{once:false});
      player.addEventListener('error',function(){
        document.getElementById('initOverlay').classList.add('hide');
        // Auto-failover to next server
        if(currentSvIdx<TOTAL_SERVERS-1){
          const n=currentSvIdx+1;
          switchServer(n);
        }else{
          document.getElementById('switchOverlay').classList.remove('show');
          document.getElementById('errorOverlay').classList.add('show');
          window.parent.postMessage({event:'player_error',reason:'stream_error'},'*');
        }
      });
      player.addEventListener('time-update',function(){
        const t=player.currentTime,d=player.duration;
        if(d>0&&t>10&&t<d-30)localStorage.setItem(storageKey,t);
        if(d>0)window.parent.postMessage({event:'time',time:t,duration:d},'*');
        if(nextEpInfo&&d>0&&!nextEpBroadcasted){
          const l=d-t;
          if(l<=30&&l>0){
            nextEpBroadcasted=true;
            window.parent.postMessage({event:'next_episode',tmdbId:TMDB_ID,season:nextEpInfo.season,episode:nextEpInfo.episode,name:nextEpInfo.name,secondsLeft:Math.round(l)},'*');
          }
        }
      });
      player.addEventListener('ended',function(){
        localStorage.removeItem(storageKey);
        window.parent.postMessage({event:'complete'},'*');
        if(nextEpInfo){
          window.parent.postMessage({event:'VIDEO_ENDED',tmdbId:TMDB_ID,season:nextEpInfo.season,episode:nextEpInfo.episode,name:nextEpInfo.name},'*');
        }
      });
    }

    /* ── Boot ── */
    player=document.getElementById('player');
    setupEvents();
    if(customElements.get('media-player'))init();
    else customElements.whenDefined('media-player').then(init);
  </script>
</body>
</html>`;
}

export function getErrorHtml(id: string, detail: string): string {
  return `<!DOCTYPE html><html><head><title>Error</title><style>body{font-family:sans-serif;padding:2em;text-align:center;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0} .error-box{background:#1a1a1a;border:1px solid #333;display:inline-block;padding:2em 3em;border-radius:12px;text-align:center;max-width:500px} h4{color:#ff4444;margin-top:0} p{margin:1em 0} .switch-msg{color:#ffaa00;font-weight:bold;margin-top:1.5em;font-size:1.1em}</style></head><body><div class="error-box"><h4>Video Not Found</h4><p>${detail}</p><p class="switch-msg">Please try another title or check the ID</p></div><script>window.parent.postMessage({event:'player_error',reason:'api_error'},'*');<\\/script></body></html>`;
}

export function getInfoHtml(): string {
  return `<!DOCTYPE html><html><head><title>Info</title></head><body style="background:#000;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0"><div style="text-align:center"><h1 style="font-size:2em;margin-bottom:.5em">Cinetaro Embed API</h1><p style="margin:1em 0;color:#999">Movie: /embed/movie/ID</p><p style="margin:1em 0;color:#999">TV: /embed/tv/ID/season</p></div></body></html>`;
}
