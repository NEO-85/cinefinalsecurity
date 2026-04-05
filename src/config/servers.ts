/**
 * ══════════════════════════════════════════════════════════════
 *  CINETARO API — SERVER CONFIGURATION
 * ══════════════════════════════════════════════════════════════
 *
 *  Add your servers here. The player will try them in order
 *  and auto-switch to the next one if a server fails.
 *
 *  FIELDS:
 *    name       — Display name in the player dropdown
 *    base       — Server API base URL
 *    proxy      — (optional) URL prefix to replace base in stream URLs
 *    referer    — (optional) Send Referer header when fetching
 *    timeout    — (optional) Fetch timeout in ms (default: 8000)
 *    headers    — (optional) Extra headers to send
 *    path       — (optional) URL path pattern. Variables: {id}, {season}, {episode}
 *                 Default: /tv/{id}/{season}/{episode}  or  /movie/{id}
 *
 *  EXAMPLE:
 *    {
 *      name: "My Server",
 *      base: "https://example.com/api",
 *      proxy: "https://my-proxy.workers.dev",
 *      referer: true,
 *      timeout: 10000,
 *    }
 *
 * ══════════════════════════════════════════════════════════════
 */

export interface ServerConfig {
  /** Display name shown in the player's server menu */
  name: string;
  /** Server API base URL */
  base: string;
  /** If set, replaces the base URL in the returned stream URL (for proxying) */
  proxy?: string;
  /** Whether to send the base URL as a Referer header */
  referer?: boolean;
  /** Fetch timeout in milliseconds */
  timeout?: number;
  /** Custom URL path pattern with {id}, {season}, {episode} placeholders */
  path?: string;
}

const SERVERS: ServerConfig[] = [
  // ───────────────────────────────────────────
  //  SERVER 1 — Primary (Icefy via M3U8 Proxy)
  // ───────────────────────────────────────────
  {
    name: "StreamVista",
    base: "https://streams.icefy.top",
    proxy: "https://weathered-a1ef.yilogag600-048.workers.dev",
    referer: true,
    timeout: 8000,
  },

  // ───────────────────────────────────────────
  //  SERVER 2 — Backup (Tik-Eather)
  // ───────────────────────────────────────────
  {
    name: "CloudPlay",
    base: "https://tik-eather.yilogag600-048.workers.dev",
    timeout: 8000,
  },

  // ───────────────────────────────────────────
  //  ADD MORE SERVERS BELOW
  //  Just copy the format, give it a name & base URL
  // ───────────────────────────────────────────

  // {
  //   name: "Server 3",
  //   base: "https://your-worker.workers.dev",
  //   proxy: "https://your-proxy.workers.dev",
  //   timeout: 10000,
  // },

  // {
  //   name: "Custom Path Server",
  //   base: "https://example.com",
  //   path: "/api/v2/stream?tmdb={id}&s={season}&e={episode}",
  //   timeout: 6000,
  // },

];

export default SERVERS;
