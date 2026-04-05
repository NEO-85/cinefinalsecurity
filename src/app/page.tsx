"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/* ─────────────── ICONS ─────────────── */
const Icons = {
  Play: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Rocket: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09zM12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2zM9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0m3 3v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  ),
  Database: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m16 6 4 14m-8-14v14m-4-12v12M4 4v16" />
    </svg>
  ),
  Clock: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Monitor: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Sparkles: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  Zap: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Palette: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21.64 3.64-1.28-1.28a1.21 1.21 0 00-1.72 0L2.36 18.64a1.21 1.21 0 000 1.72l1.28 1.28a1.2 1.2 0 001.72 0L21.64 5.36a1.2 1.2 0 000-1.72M14 7l3 3M5 6v4m14 8v4M10 2v2m-3 6H3m18-2h-4m-6-11H9" />
    </svg>
  ),
  Copy: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  Check: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4 text-green-400">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  ChevronDown: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  ExternalLink: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
};

/* ─────────────── POSTER DATA ─────────────── */
const POSTER_SETS = [
  ["/8mmpltkcG9areafsQHXaURedno3.jpg", "/dEsuQOZwdaFAVL26RjgjwGl9j7m.jpg", "/5aj8vVGFwGVbQQs26ywhg4Zxk2L.jpg", "/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg"],
  ["/bZubW4eLAk2zqk44fSWRDTFfcba.jpg", "/b33nnKl1GSFbao4l3fZDDqsMx0F.jpg", "/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg", "/6PCnxKZZIVRanWb710pNpYVkCSw.jpg"],
  ["/8mmpltkcG9areafsQHXaURedno3.jpg", "/dEsuQOZwdaFAVL26RjgjwGl9j7m.jpg", "/5aj8vVGFwGVbQQs26ywhg4Zxk2L.jpg", "/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg"],
];

const BASE_URL = ""; // relative for same-origin

/* ─────────────── FAQ DATA ─────────────── */
const FAQS = [
  { q: "What kind of content does Cinetaro API offer?", a: "Cinetaro API offers embeddable streaming links for Movies, TV Series, and Anime. Using TMDB IDs, you can easily integrate high-quality video content onto your websites or applications completely free of charge. The API supports multiple qualities including 1080p, 720p, and 480p, ensuring your users get the best viewing experience possible." },
  { q: "Are subtitles included for movies and TV shows?", a: "Yes, absolutely! We source subtitles from multiple platforms and services, ensuring a diverse selection of languages is available for almost every title in our library. The player automatically loads subtitles and users can switch between available languages seamlessly. English subtitles are available for the vast majority of content, and we continuously add support for additional languages." },
  { q: "Does the player offer multiple audio languages?", a: "We do our best to collect multiple audio sources (including Hindi, Japanese, and English) for our content to engage a non-English speaking audience. For movies and TV shows, we support English and Multi-language options. For anime, we offer SUB, DUB, and Multi-Beta audio tracks so viewers can choose their preferred experience." },
  { q: "How do I use the API?", a: "Using Cinetaro API is straightforward. You just need to get the TMDB ID for movies and shows from The Movie Database (themoviedb.org), then construct the embed URL as shown in our documentation. Simply place the URL in an iframe on your website, and the player handles everything else including stream fetching, subtitle loading, and quality selection automatically." },
  { q: "Does the player support multiple video qualities?", a: "Yes! Our player uses the Vidstack video player which provides adaptive quality streaming. It automatically selects the highest quality available for the user's connection speed and display capabilities. Most content is available in 1080p Full HD, and the player offers manual quality switching options within the player controls." },
  { q: "Is the API completely free to use?", a: "Yes, Cinetaro API is completely free to use for any project, whether personal or commercial. For high-traffic applications handling millions of requests, please reach out to us through our contact channels so we can ensure service stability and optimal performance for your users." },
  { q: "Does the player support autoplay and auto-next?", a: "Yes! The player supports autoplay functionality that begins playing content as soon as it loads. For TV series, the auto-next feature automatically detects the next episode and shows a countdown overlay with a preview thumbnail. Users can choose to play the next episode immediately or cancel and continue watching." },
  { q: "Can I customize the player's appearance?", a: "Absolutely! The player supports customization through simple query parameters. You can change the theme color using the 'color' parameter, add a custom logo with 'logo', override the title with 'title', and enable or disable autoplay with 'autoplay'. These options make it easy to match the player with your site's branding." },
];

/* ─────────────── FEATURES DATA ─────────────── */
const FEATURES = [
  { icon: "Rocket", title: "Easy to Use", desc: "Intuitive and simple. Just construct the URL and embed the player anywhere with minimal setup.", color: "#6366f1", bg: "rgba(79,70,229,0.1)" },
  { icon: "Database", title: "Huge Library", desc: "With content aggregated from multiple sources, we have one of the largest streaming libraries available.", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  { icon: "Clock", title: "Auto-Updated", desc: "Content is automatically updated with higher-quality versions when they become available from sources.", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  { icon: "Monitor", title: "Fully Responsive", desc: "The player works seamlessly across desktops, mobiles, and tablets with adaptive quality selection.", color: "#d946ef", bg: "rgba(217,70,239,0.1)" },
  { icon: "Sparkles", title: "High Quality", desc: "Links offer the highest available quality, with most content in 1080p Full HD resolution.", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  { icon: "Zap", title: "Fast Servers", desc: "Our player uses a list of the fastest streaming servers for buffer-free, smooth playback.", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  { icon: "Palette", title: "Customizable", desc: "Customize the player's appearance using simple query parameters to match your brand.", color: "#ec4899", bg: "rgba(236,72,153,0.1)" },
  { icon: "Play", title: "Autoplay & Auto-Next", desc: "Automatic playback on load and smart next-episode detection for seamless binge-watching.", color: "#14b8a6", bg: "rgba(20,184,166,0.1)" },
];

/* ─────────────── MAIN COMPONENT ─────────────── */
export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"movie" | "tv">("tv");
  const [movieId, setMovieId] = useState("");
  const [tvId, setTvId] = useState("94997");
  const [tvSeason, setTvSeason] = useState("1");
  const [tvEpisode, setTvEpisode] = useState("1");
  const [embedUrl, setEmbedUrl] = useState("");
  const [iframeKey, setIframeKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [titleInfo, setTitleInfo] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const TMDB_API_KEY = "61e2290429798c561450eb56b26de19b";

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  }, []);

  const handlePlay = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let url = "";
      if (activeTab === "movie" && movieId) {
        url = `${BASE_URL}/api/embed/movie/${movieId}`;
        fetchTitle(movieId, "movie");
        fetchPoster(movieId, "movie");
      } else if (activeTab === "tv" && tvId) {
        url = `${BASE_URL}/api/embed/tv/${tvId}/${tvSeason}?e=${tvEpisode}`;
        fetchTitle(tvId, "tv", tvSeason, tvEpisode);
        fetchPoster(tvId, "tv");
      }
      setEmbedUrl(url);
      setIframeKey((k) => k + 1);
    } catch {
      console.error("Failed to load");
    } finally {
      setLoading(false);
    }
  }, [activeTab, movieId, tvId, tvSeason, tvEpisode]);

  const fetchTitle = async (id: string, type: string, s?: string, e?: string) => {
    try {
      const endpoint = type === "movie" ? "movie" : "tv";
      const res = await fetch(`https://api.themoviedb.org/3/${endpoint}/${id}?api_key=${TMDB_API_KEY}`);
      const data = await res.json();
      const name = data.title || data.name || "Unknown";
      setTitleInfo(type === "movie" ? name : `${name} - S${String(s).padStart(2, "0")}E${String(e).padStart(2, "0")}`);
    } catch {
      setTitleInfo("Loading...");
    }
  };

  const fetchPoster = async (id: string, type: string) => {
    try {
      const endpoint = type === "movie" ? "movie" : "tv";
      const res = await fetch(`https://api.themoviedb.org/3/${endpoint}/${id}?api_key=${TMDB_API_KEY}`);
      const data = await res.json();
      const poster = data.poster_path ? `https://image.tmdb.org/t/p/w780${data.poster_path}` : (data.backdrop_path ? `https://image.tmdb.org/t/p/w780${data.backdrop_path}` : "");
      setPosterUrl(poster);
    } catch {
      setPosterUrl("");
    }
  };

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* fallback */
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const form = document.getElementById("default-form");
      if (form) form.requestSubmit();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-center">
      {/* ═══════ HEADER ═══════ */}
      <header className="fixed top-3 sm:top-4 z-50 w-full max-w-[74rem] px-3 sm:px-4">
        <div className="glass-strong rounded-xl px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FF6B6B 0%, #A855F7 50%, #3B82F6 100%)" }}>
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </div>
            <span className="text-base sm:text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Cinetaro API
            </span>
          </div>
          {/* Desktop Nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {[
              { label: "Test Player", id: "PlayerTester" },
              { label: "Features", id: "features" },
              { label: "Docs", id: "simpleDoc" },
              { label: "FAQs", id: "FAQs" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer bg-transparent border-none"
              >
                {item.label}
              </button>
            ))}
          </nav>
          {/* Mobile menu button */}
          <button
            className="sm:hidden p-2 text-gray-400 hover:text-white cursor-pointer bg-transparent border-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="mt-2 glass-strong rounded-xl p-2 flex flex-col gap-1 sm:hidden animate-fade-in-up">
            {[
              { label: "Test Player", id: "PlayerTester" },
              { label: "Features", id: "features" },
              { label: "Docs", id: "simpleDoc" },
              { label: "FAQs", id: "FAQs" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all text-left cursor-pointer bg-transparent border-none"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ═══════ HERO ═══════ */}
      <section className="relative w-full flex items-center justify-center overflow-hidden pt-28 sm:pt-32 pb-12 sm:pb-16">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 items-center text-center lg:text-left w-full max-w-[70rem] px-4">
          {/* Main content */}
          <div className="flex flex-col items-center lg:items-start gap-3 z-10">
            <h1 className="text-[clamp(2.5rem,10vw,4.5rem)] font-semibold leading-tight gradient-text">
              EMBED API
            </h1>
            <h2 className="text-[clamp(1.5rem,8vw,3rem)] font-medium min-h-[4rem] max-w-[32rem] gradient-text-light">
              Biggest and Fastest Streaming API
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-3">
              <button
                onClick={() => scrollTo("PlayerTester")}
                className="px-6 py-2 text-sm font-medium rounded-full border border-white/10 bg-white/5 backdrop-blur-xl text-white uppercase tracking-wider hover:scale-105 transition-all cursor-pointer glow-pink"
              >
                Get Started
              </button>
              <button
                onClick={() => scrollTo("simpleDoc")}
                className="text-sm text-gray-300 underline underline-offset-4 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
              >
                View Docs
              </button>
            </div>
            <div className="flex gap-3 mt-5">
              {[
                { value: "115K+", label: "Movies" },
                { value: "79K+", label: "Shows" },
                { value: "9K+", label: "Anime" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="px-4 py-3 flex flex-col items-center gap-1 glass rounded-xl hover:-translate-y-1 hover:border-white/20 transition-all"
                >
                  <span className="text-xl sm:text-2xl font-bold text-gray-200">{stat.value}</span>
                  <span className="text-xs text-gray-500">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Poster scrollers - desktop only */}
          <div className="hidden lg:grid grid-cols-3 gap-5 opacity-15 poster-mask absolute right-0 top-0 h-full w-[55%]">
            {POSTER_SETS.map((posters, i) => (
              <div key={i} className={`flex flex-col overflow-hidden gap-4 ${i === 1 ? "flex-col-reverse" : ""}`}>
                <div className="flex flex-col gap-4" style={{ animation: `marquee-vertical 40s linear infinite ${i === 1 ? "reverse" : ""}` }}>
                  {Array(4).fill(posters).flat().map((p, j) => (
                    <div key={j} className="relative h-52 w-36 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={`https://media.themoviedb.org/t/p/w220_and_h330_face${p}`} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ PLAYER TESTER ═══════ */}
      <main id="PlayerTester" className="w-full max-w-[70rem] flex flex-col items-center gap-2 px-4 pt-8 scroll-mt-24">
        {/* Tabs */}
        <div className="inline-flex p-1 gap-2 items-center bg-white/5 rounded-full">
          {(["movie", "tv"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setEmbedUrl(""); }}
              className={`px-4 h-9 text-sm rounded-full transition-all cursor-pointer border-none font-medium ${
                activeTab === tab
                  ? "text-white bg-zinc-800 shadow-lg"
                  : "text-zinc-400 bg-transparent hover:text-gray-200"
              }`}
            >
              {tab === "movie" ? "Movie" : "Series"}
            </button>
          ))}
        </div>

        {/* Forms */}
        <form
          id={activeTab === "tv" ? "default-form" : ""}
          onSubmit={handlePlay}
          className={`w-full glass rounded-xl p-5 mt-4 flex flex-col gap-3 ${activeTab === "movie" ? "hidden" : ""}`}
        >
          <div className="flex flex-wrap gap-3 items-end justify-center">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs text-zinc-400 mb-1 font-medium">TMDB ID</label>
              <input
                type="number"
                value={tvId}
                onChange={(e) => setTvId(e.target.value)}
                placeholder="e.g., 94997"
                required
                className="w-full h-10 px-3 bg-[#303030] rounded-lg border border-transparent focus:border-indigo-500 outline-none text-white text-sm transition-colors"
              />
            </div>
            <div className="min-w-[100px]">
              <label className="block text-xs text-zinc-400 mb-1 font-medium">Season No.</label>
              <input
                type="number"
                value={tvSeason}
                onChange={(e) => setTvSeason(e.target.value)}
                placeholder="1"
                required
                className="w-full h-10 px-3 bg-[#303030] rounded-lg border border-transparent focus:border-indigo-500 outline-none text-white text-sm transition-colors"
              />
            </div>
            <div className="min-w-[100px]">
              <label className="block text-xs text-zinc-400 mb-1 font-medium">Episode No.</label>
              <input
                type="number"
                value={tvEpisode}
                onChange={(e) => setTvEpisode(e.target.value)}
                placeholder="1"
                required
                className="w-full h-10 px-3 bg-[#303030] rounded-lg border border-transparent focus:border-indigo-500 outline-none text-white text-sm transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-10 px-5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-600 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer border-none"
            >
              {loading ? "..." : "Load"}
            </button>
          </div>
        </form>

        <form
          onSubmit={handlePlay}
          className={`w-full glass rounded-xl p-5 mt-4 flex flex-col gap-3 ${activeTab === "tv" ? "hidden" : ""}`}
        >
          <div className="flex flex-wrap gap-3 items-end justify-center">
            <div className="flex-[2] min-w-[200px]">
              <label className="block text-xs text-zinc-400 mb-1 font-medium">TMDB ID</label>
              <input
                type="number"
                value={movieId}
                onChange={(e) => setMovieId(e.target.value)}
                placeholder="e.g., 666243"
                required
                className="w-full h-10 px-3 bg-[#303030] rounded-lg border border-transparent focus:border-indigo-500 outline-none text-white text-sm transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-10 px-5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-600 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer border-none"
            >
              {loading ? "..." : "Load"}
            </button>
          </div>
        </form>

        {/* Player Output */}
        <div ref={playerRef} className="w-full mt-5">
          {embedUrl ? (
            <div className="animate-fade-in-up">
              {/* Player wrapper */}
              <div className="relative bg-black rounded-xl overflow-hidden border border-white/10" style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
                <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                  {/* Poster background */}
                  {posterUrl && (
                    <img
                      src={posterUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm"
                    />
                  )}
                  {/* Loading overlay */}
                  {loading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-sm">
                      <div className="flex gap-2">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-3 h-3 rounded-full bg-pink-500"
                            style={{
                              animation: "pulse-dot 1.4s infinite ease-in-out both",
                              animationDelay: `${-0.32 + i * 0.16}s`,
                            }}
                          />
                        ))}
                      </div>
                      <div className="text-white text-sm font-medium bg-black/60 px-4 py-2 rounded-lg backdrop-blur-md">
                        {titleInfo || "Fetching servers..."}
                      </div>
                      <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-full rounded-full" style={{ background: "linear-gradient(135deg, #e91e63 0%, #9c27b0 100%)", animation: "progress-indeterminate 1.5s infinite" }} />
                      </div>
                    </div>
                  )}
                  <iframe
                    key={iframeKey}
                    src={embedUrl}
                    className="absolute inset-0 w-full h-full border-none"
                    allowFullScreen
                    allow="autoplay; encrypted-media"
                    onLoad={() => setLoading(false)}
                  />
                </div>
              </div>
              {/* URL box */}
              <div className="glass rounded-lg p-3 mt-3 flex items-center gap-3 flex-wrap justify-between">
                <code className="flex-1 text-pink-400 text-xs font-mono break-all pr-3">{embedUrl}</code>
                <button
                  onClick={() => copyToClipboard(embedUrl, "embed")}
                  className="px-4 py-2 rounded-lg text-white font-bold text-xs border-none cursor-pointer whitespace-nowrap transition-transform hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #e91e63 0%, #9c27b0 100%)" }}
                >
                  {copied === "embed" ? "COPIED!" : "COPY URL"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full rounded-xl border border-white/10 bg-white/5" style={{ aspectRatio: "16/9" }}>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
                  <Icons.Play />
                </div>
                <p className="text-gray-500 text-sm">Select content and press Load to start streaming</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ═══════ FEATURES ═══════ */}
      <section id="features" className="w-full max-w-[70rem] px-4 mt-16 scroll-mt-24">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold uppercase tracking-wider whitespace-nowrap">Features</h2>
          <div className="flex-grow h-px" style={{ background: "linear-gradient(to right, rgba(255,255,255,0.2), transparent)" }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {FEATURES.map((feature, i) => {
            const IconComponent = Icons[feature.icon as keyof typeof Icons];
            return (
              <div
                key={i}
                className="p-5 flex flex-col gap-3 glass rounded-xl hover:-translate-y-1 hover:border-white/20 transition-all cursor-default"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="p-2 w-fit rounded-lg flex items-center justify-center" style={{ backgroundColor: feature.bg }}>
                  <IconComponent style={{ color: feature.color } as React.SVGAttributes<SVGSVGElement>} />
                </div>
                <p className="font-semibold text-lg text-white">{feature.title}</p>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════ API DOCUMENTATION ═══════ */}
      <section id="simpleDoc" className="w-full max-w-[70rem] px-4 mt-16 scroll-mt-24">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold uppercase tracking-wider whitespace-nowrap">API Documentation</h2>
          <div className="flex-grow h-px" style={{ background: "linear-gradient(to right, rgba(255,255,255,0.2), transparent)" }} />
        </div>

        {/* Endpoints */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Movie endpoint */}
          <div className="glass rounded-xl p-5 flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold">Embed Movies</h3>
              <p className="text-sm text-zinc-400 mt-1">
                Use TMDB ID from{" "}
                <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="text-green-400 hover:underline inline-flex items-center gap-1">
                  The Movie Database <Icons.ExternalLink />
                </a>{" "}
                API.
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-gray-300">
              <pre className="font-mono whitespace-nowrap overflow-x-auto no-scrollbar">{"/api/embed/movie/[ID]"}</pre>
              <button onClick={() => copyToClipboard(`${BASE_URL}/api/embed/movie/[ID]`, "movie")} className="cursor-pointer bg-transparent border-none text-gray-400 hover:text-white p-1 rounded transition-colors shrink-0">
                {copied === "movie" ? <Icons.Check /> : <Icons.Copy />}
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              Returns an HTML page with the Vidstack player embeddable in an iframe.
            </p>
          </div>

          {/* TV endpoint */}
          <div className="glass rounded-xl p-5 flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold">Embed TV Series</h3>
              <p className="text-sm text-zinc-400 mt-1">TMDB ID and season number. Episode defaults to 1 (pass ?e=2 for episode 2).</p>
            </div>
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-gray-300">
              <pre className="font-mono whitespace-nowrap overflow-x-auto no-scrollbar">{"/api/embed/tv/[ID]/[season]"}</pre>
              <button onClick={() => copyToClipboard(`${BASE_URL}/api/embed/tv/[ID]/[season]`, "tv")} className="cursor-pointer bg-transparent border-none text-gray-400 hover:text-white p-1 rounded transition-colors shrink-0">
                {copied === "tv" ? <Icons.Check /> : <Icons.Copy />}
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              Supports autoplay, auto-next episode detection, and resume playback.
            </p>
          </div>

          {/* Auto Server Switching */}
          <div className="glass rounded-xl p-5 flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold">Multi-Server Switching</h3>
              <p className="text-sm text-zinc-400 mt-1">A server icon sits directly in the player control bar (next to captions &amp; fullscreen). Click it to switch servers, or the player auto-switches on error.</p>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-black/30 border border-white/10 flex-wrap">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="6" cy="18" r="1" fill="currentColor"/></svg>
                <span className="text-sm font-mono text-gray-300">Server Menu</span>
              </div>
              <span className="text-xs text-zinc-500">in player bar</span>
            </div>
            <p className="text-xs text-zinc-500">
              Add unlimited servers in <code className="text-pink-400">src/config/servers.ts</code>. All fetching is server-side — stream URLs are never exposed.
            </p>
          </div>
        </div>

        {/* Player Customization */}
        <div className="mt-10 flex items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold uppercase tracking-wider whitespace-nowrap">Player Customization</h2>
          <div className="flex-grow h-px" style={{ background: "linear-gradient(to right, rgba(255,255,255,0.2), transparent)" }} />
        </div>

        <div className="glass rounded-xl p-5 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { param: "color=[HEX_CODE]", desc: "Changes the player UI theme color (e.g., color=e91e63 for pink, color=E6B800 for gold)" },
              { param: "autoplay=[true/false]", desc: "Attempts to autoplay the video when the player loads. Note: browsers may block autoplay." },
              { param: "logo=[URL]", desc: "Displays a custom logo image in the top-left corner of the player overlay." },
              { param: "title=[STRING]", desc: "Overrides the default title displayed in the player. Useful for custom naming." },
            ].map((item, i) => (
              <div key={i} className="mb-3">
                <strong className="text-pink-400 font-mono text-sm">{item.param}</strong>
                <p className="text-zinc-400 text-sm mt-1 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-gray-300">
            <pre className="font-mono whitespace-nowrap overflow-x-auto no-scrollbar">{'/api/embed/tv/94997/1?color=e91e63&logo=[URL]'}</pre>
            <button onClick={() => copyToClipboard(`${BASE_URL}/api/embed/tv/94997/1?color=e91e63&logo=[URL]`, "custom")} className="cursor-pointer bg-transparent border-none text-gray-400 hover:text-white p-1 rounded transition-colors shrink-0">
              {copied === "custom" ? <Icons.Check /> : <Icons.Copy />}
            </button>
          </div>
        </div>

        {/* Integration Examples */}
        <div className="mt-10 flex items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold uppercase tracking-wider whitespace-nowrap">Integration Examples</h2>
          <div className="flex-grow h-px" style={{ background: "linear-gradient(to right, rgba(255,255,255,0.2), transparent)" }} />
        </div>

        <div className="glass rounded-xl p-5 sm:p-6 space-y-6">
          <div>
            <h3 className="text-base font-semibold text-white mb-2">Basic HTML Embed</h3>
            <p className="text-sm text-zinc-400 mb-3 leading-relaxed">
              The simplest way to embed the player is using an HTML iframe. Just place the following code on your webpage and replace the TMDB ID with your content identifier. The player handles everything including stream fetching, quality selection, and subtitle loading.
            </p>
            <div className="rounded-lg bg-black/50 border border-white/10 p-4 overflow-x-auto">
              <pre className="text-sm text-gray-300 font-mono leading-relaxed">
{`<iframe
  src="https://your-domain.com/api/embed/tv/94997/1"
  width="100%"
  style="aspect-ratio: 16/9;"
  frameborder="0"
  allowfullscreen
  allow="autoplay; encrypted-media">
</iframe>`}
              </pre>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold text-white mb-2">PostMessage Event Handling</h3>
            <p className="text-sm text-zinc-400 mb-3 leading-relaxed">
              The player broadcasts events to the parent window using the postMessage API. You can listen for these events to implement custom behaviors like auto-navigation, analytics tracking, or error recovery.
            </p>
            <div className="rounded-lg bg-black/50 border border-white/10 p-4 overflow-x-auto">
              <pre className="text-sm text-gray-300 font-mono leading-relaxed">
{`window.addEventListener('message', (event) => {
  const data = typeof event.data === 'string'
    ? JSON.parse(event.data) : event.data;

  switch (data.event) {
    case 'player_ready':
      console.log('Player loaded successfully');
      break;
    case 'time':
      // { time: seconds, duration: seconds }
      console.log(\`Playing: \${data.time}/\${data.duration}\`);
      break;
    case 'complete':
      console.log('Video finished');
      break;
    case 'player_error':
      // { reason: 'stream_error' | 'all_servers_failed' }
      console.error('Error:', data.reason);
      break;
    case 'VIDEO_ENDED':
      // { tmdbId, season, episode }
      console.log('Auto-next →', data.season, data.episode);
      break;
  }
});`}
              </pre>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold text-white mb-2">React Component Example</h3>
            <p className="text-sm text-zinc-400 mb-3 leading-relaxed">
              Here is a complete React component that wraps the embed player. It accepts TMDB ID, season, and episode as props, making it easy to drop into any React application. The component also handles loading states and errors gracefully.
            </p>
            <div className="rounded-lg bg-black/50 border border-white/10 p-4 overflow-x-auto">
              <pre className="text-sm text-gray-300 font-mono leading-relaxed">
{`function StreamPlayer({ tmdbId, type, season, episode, color }) {
  const [loading, setLoading] = useState(true);

  const url = type === 'series'
    ? \`/api/embed/tv/\${tmdbId}/\${season || 1}\${episode ? '?e=' + episode : ''}\${color ? (episode ? '&' : '?') + 'color=' + color : ''}\`
    : \`/api/embed/movie/\${tmdbId}\${color ? '?color=' + color : ''}\`;

  return (
    <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)'
        }}>
          <p>Loading player...</p>
        </div>
      )}
      <iframe
        src={url}
        style={{ position: 'absolute', inset: 0,
          width: '100%', height: '100%', border: 'none' }}
        allowFullScreen
        allow="autoplay; encrypted-media"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}`}
              </pre>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold text-white mb-2">Event Handling (PostMessage API)</h3>
            <p className="text-sm text-zinc-400 mb-3 leading-relaxed">
              The player broadcasts events to the parent window using the postMessage API. You can listen for these events to implement custom behaviors like auto-navigation, analytics tracking, or error recovery. Below are the available events and their data payloads.
            </p>
            <div className="rounded-lg bg-black/50 border border-white/10 p-4 overflow-x-auto">
              <pre className="text-sm text-gray-300 font-mono leading-relaxed">
{`window.addEventListener('message', (event) => {
  const data = typeof event.data === 'string'
    ? JSON.parse(event.data) : event.data;

  switch (data.event) {
    case 'player_ready':
      // Player has loaded and is ready
      console.log('Player is ready');
      break;

    case 'time':
      // Time update: { time: seconds, duration: seconds }
      console.log(\`Time: \${data.time}/\${data.duration}\`);
      break;

    case 'complete':
      // Video finished playing
      console.log('Video completed');
      break;

    case 'player_error':
      // Error occurred: { reason: string }
      console.error('Player error:', data.reason);
      break;

    case 'VIDEO_ENDED':
      // Auto-next: { tmdbId, season, episode }
      console.log(\`Next: S\${data.season}E\${data.episode}\`);
      break;
  }
});`}
              </pre>
            </div>
          </div>
        </div>

        {/* Events Reference Table */}
        <div className="mt-10 flex items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold uppercase tracking-wider whitespace-nowrap">Event Reference</h2>
          <div className="flex-grow h-px" style={{ background: "linear-gradient(to right, rgba(255,255,255,0.2), transparent)" }} />
        </div>

        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase text-zinc-400 border-b border-white/10">
                <tr>
                  <th className="px-5 py-3 font-semibold">Event</th>
                  <th className="px-5 py-3 font-semibold">Payload</th>
                  <th className="px-5 py-3 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                {[
                  { event: "player_ready", payload: "{}", desc: "Fired when the player has fully loaded and is ready to play content." },
                  { event: "time", payload: "{ time, duration }", desc: "Emitted continuously during playback with current time and total duration in seconds." },
                  { event: "complete", payload: "{}", desc: "Fired when the video reaches the end and playback is complete." },
                  { event: "player_error", payload: "{ reason }", desc: "Sent on error. Reason: 'stream_error' (auto-switched) or 'all_servers_failed'." },
                  { event: "VIDEO_ENDED", payload: "{ tmdbId, season, episode }", desc: "Broadcast when auto-next triggers with the next episode's details." },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3"><code className="text-pink-400 font-mono text-xs">{row.event}</code></td>
                    <td className="px-5 py-3"><code className="text-gray-400 font-mono text-xs">{row.payload}</code></td>
                    <td className="px-5 py-3 text-zinc-400">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Deployment Guide */}
        <div className="mt-10 flex items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold uppercase tracking-wider whitespace-nowrap">Deployment</h2>
          <div className="flex-grow h-px" style={{ background: "linear-gradient(to right, rgba(255,255,255,0.2), transparent)" }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="glass rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg">▲</div>
              <h3 className="text-lg font-semibold">Vercel Deployment</h3>
            </div>
            <div className="rounded-lg bg-black/50 border border-white/10 p-4 overflow-x-auto">
              <pre className="text-sm text-gray-300 font-mono leading-relaxed">
{`# Clone the repository
git clone your-repo-url
cd cinetaro-api

# Install dependencies
npm install

# Deploy to Vercel
npx vercel

# Or connect your GitHub repo
# to Vercel dashboard for auto-deploy`}
              </pre>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Vercel supports Edge Functions natively, which is used by the API routes for optimal performance. Simply connect your GitHub repository to Vercel and it will auto-deploy on every push. No additional configuration required.
            </p>
          </div>

          <div className="glass rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg">🖥</div>
              <h3 className="text-lg font-semibold">VPS Deployment</h3>
            </div>
            <div className="rounded-lg bg-black/50 border border-white/10 p-4 overflow-x-auto">
              <pre className="text-sm text-gray-300 font-mono leading-relaxed">
{`# Install dependencies
npm install

# Build for production
npm run build

# Start the server
npm run start

# Server runs on port 3000
# Use nginx or caddy as reverse proxy`}
              </pre>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              For VPS deployment, build the project and run the standalone server. The output includes a standalone build that bundles all dependencies. Use Nginx or Caddy as a reverse proxy with SSL termination for production use.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════ FAQs ═══════ */}
      <section id="FAQs" className="w-full max-w-[70rem] px-4 mt-16 mb-8 scroll-mt-24">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold uppercase tracking-wider whitespace-nowrap">Frequently Asked Questions</h2>
          <div className="flex-grow h-px" style={{ background: "linear-gradient(to right, rgba(255,255,255,0.2), transparent)" }} />
        </div>
        <div className="flex flex-col gap-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden transition-all"
              style={{
                border: `1px solid ${openFaq === i ? "rgba(233,30,99,0.5)" : "rgba(255,255,255,0.1)"}`,
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full px-5 py-4 text-left text-base font-semibold cursor-pointer flex items-center justify-between bg-transparent border-none text-white hover:bg-white/5 transition-colors"
              >
                <span>{faq.q}</span>
                <span
                  className="text-2xl text-gray-500 transition-transform ml-4 shrink-0"
                  style={{ transform: openFaq === i ? "rotate(45deg)" : "none" }}
                >
                  +
                </span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed animate-fade-in-up">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="w-full max-w-[70rem] px-4 py-8 text-center">
        <hr className="bg-gray-700 border-none h-px mb-6" />
        <p className="text-sm text-gray-400 leading-relaxed">
          Cinetaro operates as a content aggregator and does not host any media files on our servers. All content is sourced from
          third-party providers and embedded services. For any copyright concerns or DMCA takedown requests, please contact the
          respective content providers directly. Cinetaro does not store any files on our server; we only link to media
          which is hosted on third-party services.
        </p>
      </footer>
    </div>
  );
}
