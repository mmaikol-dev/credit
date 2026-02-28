import { Link, usePage } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import {
  ArrowRight, BadgeCheck, BellRing, Building2, CalendarClock,
  CheckCircle2, CreditCard, Gauge, Layers3, ShieldCheck,
  Smartphone, Sparkles, Users, Wallet, Zap, Activity,
} from "lucide-react";
import { dashboard, login, register } from "@/routes";

// ── Global styles injected once ──────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,700;12..96,800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'DM Sans', sans-serif; background: #09090b; color: #fafafa; overflow-x: hidden; }

  @keyframes orb-float { from{transform:translate(0,0) scale(1)} to{transform:translate(30px,40px) scale(1.08)} }
  @keyframes pulse-dot  { 0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.5)} 50%{box-shadow:0 0 0 6px rgba(16,185,129,0)} }
  @keyframes fade-up    { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fill-in    { from{width:0!important} }
  @keyframes btn-shine  { 0%{left:-100%} 100%{left:200%} }

  .orb { position:absolute;border-radius:50%;filter:blur(80px);opacity:.35; }
  .orb-1 { width:420px;height:420px;background:#22d3ee;top:-120px;left:-80px;animation:orb-float 8s ease-in-out infinite alternate; }
  .orb-2 { width:360px;height:360px;background:#10b981;top:40px;right:-100px;animation:orb-float 8s ease-in-out -3s infinite alternate; }
  .orb-3 { width:300px;height:300px;background:#818cf8;bottom:20%;left:30%;animation:orb-float 8s ease-in-out -5s infinite alternate; }

  .live-dot { width:8px;height:8px;border-radius:50%;background:#10b981;animation:pulse-dot 2s ease-in-out infinite;display:inline-block; }

  .progress-fill { animation: fill-in 1.4s .5s cubic-bezier(.34,1.56,.64,1) both; }

  .reveal { opacity:0;transform:translateY(28px);transition:opacity .6s ease,transform .6s ease; }
  .reveal.visible { opacity:1;transform:translateY(0); }

  .card-3d { transition:transform .4s ease,box-shadow .4s ease; }
  .card-3d:hover { transform:perspective(1000px) rotateY(-2deg) rotateX(1deg) translateY(-4px); }

  .feat-card { transition:all .3s ease;position:relative;overflow:hidden; }
  .feat-card::after { content:'';position:absolute;inset:0;border-radius:20px;opacity:0;background:radial-gradient(circle at 50% 0%,rgba(34,211,238,.08),transparent 70%);transition:opacity .3s; }
  .feat-card:hover { border-color:rgba(34,211,238,.25)!important;transform:translateY(-6px);box-shadow:0 16px 40px rgba(0,0,0,.3),0 4px 12px rgba(34,211,238,.1); }
  .feat-card:hover::after { opacity:1; }

  .act-item { transition:background .2s,border-color .2s,transform .2s; }
  .act-item:hover { background:rgba(255,255,255,.05)!important;border-color:rgba(255,255,255,.15)!important;transform:translateX(2px); }

  .stat-box { transition:background .2s,border-color .2s; }
  .stat-box:hover { background:rgba(255,255,255,.05)!important;border-color:rgba(255,255,255,.15)!important; }

  .metric-card { transition:border-color .3s,transform .3s; }
  .metric-card:hover { border-color:rgba(255,255,255,.15)!important;transform:translateY(-4px); }

  .btn-shine { position:relative;overflow:hidden; }
  .btn-shine::after { content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent);transform:skewX(-20deg); }
  .btn-shine:hover::after { animation:btn-shine .6s ease; }

  input { outline:none;transition:border-color .2s,box-shadow .2s,background .2s; }
  input:focus { border-color:rgba(34,211,238,.4)!important;box-shadow:0 0 0 3px rgba(34,211,238,.08)!important;background:rgba(255,255,255,.06)!important; }

  a.footer-link:hover { color:#fafafa!important; }
`;

// ── Hooks ────────────────────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    el.classList.add("reveal");
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) el.classList.add("visible"); }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function useCountdown(init = 3600 + 9 * 60 + 22) {
  const [s, setS] = useState(init);
  useEffect(() => { const t = setInterval(() => setS(v => Math.max(0, v - 1)), 1000); return () => clearInterval(t); }, []);
  const pad = n => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

function useMouseParallax() {
  const [p, setP] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const h = e => setP({ x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);
  return p;
}

// ── Primitives ───────────────────────────────────────────────────────────────
const S = {
  accent:  "#22d3ee",
  accent2: "#10b981",
  accent3: "#818cf8",
  muted:   "#a1a1aa",
  border:  "rgba(255,255,255,0.08)",
  borderS: "rgba(255,255,255,0.15)",
  surface: "rgba(24,24,27,0.8)",
};

function Badge({ children, variant = "cyan", style: sx = {} }) {
  const V = {
    cyan:   { bg:"rgba(34,211,238,.12)", border:"rgba(34,211,238,.25)", color:"#67e8f9" },
    green:  { bg:"rgba(16,185,129,.12)", border:"rgba(16,185,129,.25)", color:"#6ee7b7" },
    indigo: { bg:"rgba(129,140,248,.12)", border:"rgba(129,140,248,.25)", color:"#a5b4fc" },
  }[variant];
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:999, fontSize:12, fontWeight:500, letterSpacing:".3px", background:V.bg, border:`1px solid ${V.border}`, color:V.color, ...sx }}>
      {children}
    </span>
  );
}

function Btn({ children, variant = "primary", size = "md", onClick, href, style: sx = {} }) {
  const [hov, setHov] = useState(false);
  const base = { display:"inline-flex", alignItems:"center", gap:8, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight: variant === "primary" ? 700 : 500, transition:"all .2s ease", whiteSpace:"nowrap", borderRadius: size === "lg" ? 12 : 10, padding: size === "lg" ? "14px 28px" : "10px 20px", fontSize: size === "lg" ? 15 : 14 };
  const V = {
    primary:   { bg:"linear-gradient(135deg,#22d3ee,#06b6d4)", color:"#09090b", boxShadow:"0 4px 20px rgba(34,211,238,.3)", hov:{ transform:"translateY(-2px)", boxShadow:"0 8px 28px rgba(34,211,238,.4),0 0 0 4px rgba(34,211,238,.1)" } },
    ghost:     { bg:"transparent", color:S.muted, border:"none", hov:{ background:"rgba(255,255,255,.06)", color:"#fafafa" } },
    outline:   { bg:"transparent", color:"#fafafa", border:`1px solid ${S.borderS}`, hov:{ background:"rgba(255,255,255,.06)" } },
    secondary: { bg:"rgba(255,255,255,.06)", color:"#fafafa", border:`1px solid ${S.border}`, hov:{ background:"rgba(255,255,255,.1)" } },
  }[variant];
  const style = { ...base, background:V.bg, color:V.color, border:V.border, boxShadow:V.boxShadow, ...(hov ? V.hov : {}), ...sx };

  if (href) {
    return (
      <Link
        href={href}
        className={variant === "primary" ? "btn-shine" : ""}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={style}
      >
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={variant === "primary" ? "btn-shine" : ""}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={style}>
      {children}
    </button>
  );
}

function ProgressBar({ pct, colors = ["#22d3ee","#10b981"] }) {
  return (
    <div style={{ height:6, background:"rgba(255,255,255,.06)", borderRadius:999, overflow:"hidden" }}>
      <div className="progress-fill" style={{ width:`${pct}%`, height:"100%", borderRadius:999, background:`linear-gradient(90deg,${colors[0]},${colors[1]})` }} />
    </div>
  );
}

function StatBox({ label, value, valueColor = "#fafafa", sub, subColor = S.accent2 }) {
  return (
    <div className="stat-box" style={{ background:"rgba(255,255,255,.03)", border:`1px solid ${S.border}`, borderRadius:12, padding:14, cursor:"default" }}>
      <p style={{ fontSize:11, color:S.muted, textTransform:"uppercase", letterSpacing:".6px", marginBottom:6 }}>{label}</p>
      <p style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:22, fontWeight:700, lineHeight:1, color:valueColor }}>{value}</p>
      {sub && <p style={{ fontSize:11, color:subColor, marginTop:4 }}>{sub}</p>}
    </div>
  );
}

function ActivityRow({ Icon, iconBg, iconColor, name, time, val, valColor = "#fafafa" }) {
  return (
    <div className="act-item" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,.025)", border:`1px solid ${S.border}`, borderRadius:10, padding:"10px 14px", cursor:"default" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:30, height:30, borderRadius:8, display:"grid", placeItems:"center", background:iconBg, color:iconColor }}>
          <Icon size={14} />
        </div>
        <div>
          <p style={{ fontSize:13, fontWeight:500 }}>{name}</p>
          <p style={{ fontSize:11, color:S.muted }}>{time}</p>
        </div>
      </div>
      <p style={{ fontSize:13, fontWeight:700, color:valColor }}>{val}</p>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, iconBg, iconBorder, iconColor, delay = 0 }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="feat-card reveal" style={{ background:"rgba(24,24,27,.6)", border:`1px solid ${S.border}`, borderRadius:20, padding:"28px 24px", display:"flex", flexDirection:"column", gap:16, cursor:"default", transitionDelay:`${delay}ms` }}>
      <div style={{ width:48, height:48, borderRadius:12, display:"grid", placeItems:"center", background:iconBg, border:`1px solid ${iconBorder}`, color:iconColor }}>
        <Icon size={22} />
      </div>
      <p style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontWeight:700, fontSize:17, letterSpacing:"-.3px" }}>{title}</p>
      <p style={{ fontSize:14, color:S.muted, lineHeight:1.6 }}>{desc}</p>
    </div>
  );
}

function MetricCard({ num, label, sub, numColor, topColor, delay = 0 }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="metric-card reveal" style={{ background:"rgba(24,24,27,.6)", border:`1px solid ${S.border}`, borderRadius:20, padding:"32px 28px", display:"flex", flexDirection:"column", gap:8, position:"relative", overflow:"hidden", transitionDelay:`${delay}ms` }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, borderRadius:"20px 20px 0 0", background:`linear-gradient(90deg,${topColor},transparent)` }} />
      <p style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:48, fontWeight:800, letterSpacing:"-2px", lineHeight:1, color:numColor }}>{num}</p>
      <p style={{ fontSize:15, fontWeight:500 }}>{label}</p>
      <p style={{ fontSize:13, color:S.muted }}>{sub}</p>
    </div>
  );
}

function InputField({ label, type = "text", placeholder }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={{ fontSize:12, color:S.muted, textTransform:"uppercase", letterSpacing:".4px" }}>{label}</label>
      <input type={type} placeholder={placeholder} style={{ background:"rgba(255,255,255,.04)", border:`1px solid ${S.border}`, borderRadius:10, padding:"11px 16px", fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#fafafa", width:"100%" }} />
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const FEATURES = [
  { title:"Bulk Airtime Transfers", desc:"Push airtime to employees, agents, or customers in one operational flow with full audit trails.", icon:Smartphone,   iconBg:"rgba(34,211,238,.12)",  iconBorder:"rgba(34,211,238,.2)",  iconColor:S.accent,  delay:50  },
  { title:"Smart Scheduling",       desc:"Run one-time or recurring airtime campaigns by exact date and time with a 24/7 automated queue.", icon:CalendarClock, iconBg:"rgba(16,185,129,.12)",  iconBorder:"rgba(16,185,129,.2)",  iconColor:S.accent2, delay:100 },
  { title:"Wallet Billing",         desc:"Top up once and monitor usage with clean company-level spend visibility and real-time balance.", icon:Wallet,        iconBg:"rgba(129,140,248,.12)", iconBorder:"rgba(129,140,248,.2)", iconColor:S.accent3, delay:150 },
  { title:"Company Isolation",      desc:"Every company has scoped users, data, and transfer history by design. True multi-tenancy.", icon:ShieldCheck,   iconBg:"rgba(244,63,94,.12)",   iconBorder:"rgba(244,63,94,.2)",   iconColor:"#fb7185", delay:200 },
];

const TRUST = [
  { label:"Transfer Engine", value:"Realtime",    color:S.accent  },
  { label:"Scheduler",       value:"24/7 Queue",  color:S.accent2 },
  { label:"Architecture",    value:"Multi-Tenant", color:S.accent3 },
];

// ── Welcome Page ──────────────────────────────────────────────────────────────
export default function Welcome({ canRegister = true }) {
  const { auth } = usePage().props as { auth: { user: unknown | null } };
  const isLoggedIn = Boolean(auth.user);
  const mouse    = useMouseParallax();
  const countdown = useCountdown();

  // Inject global CSS
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = STYLES;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  const featHeaderRef = useReveal();
  const metricsRef    = useReveal();
  const ctaRef        = useReveal();

  return (
    <div style={{ position:"relative", minHeight:"100vh", background:"#09090b", color:"#fafafa", fontFamily:"'DM Sans',sans-serif" }}>

      {/* ── Background ── */}
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px)", backgroundSize:"48px 48px" }} />
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 60% 50% at 20% 10%,rgba(34,211,238,.18) 0%,transparent 65%),radial-gradient(ellipse 55% 45% at 80% 15%,rgba(16,185,129,.12) 0%,transparent 60%),radial-gradient(ellipse 50% 60% at 50% 95%,rgba(129,140,248,.14) 0%,transparent 55%)" }} />
        <div className="orb orb-1" style={{ transform:`translate(${mouse.x*24}px,${mouse.y*16}px)` }} />
        <div className="orb orb-2" style={{ transform:`translate(${-mouse.x*16}px,${mouse.y*14}px)` }} />
        <div className="orb orb-3" style={{ transform:`translate(${mouse.x*10}px,${-mouse.y*12}px)` }} />
      </div>

      {/* ── NAV ── */}
      <nav style={{ position:"sticky", top:0, zIndex:100, backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderBottom:`1px solid ${S.border}`, background:"rgba(9,9,11,.75)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", height:68, maxWidth:1480, margin:"0 auto", padding:"0 32px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,rgba(34,211,238,.2),rgba(16,185,129,.2))", border:"1px solid rgba(34,211,238,.3)", display:"grid", placeItems:"center", color:S.accent }}>
              <CreditCard size={20} />
            </div>
            <div>
              <p style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontWeight:800, fontSize:18, lineHeight:1, letterSpacing:"-.5px" }}>CreditSaaS</p>
              <p style={{ fontSize:11, color:S.muted, marginTop:2 }}>Company Airtime Infrastructure</p>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Btn variant="ghost" href="#features">Features</Btn>
            <Btn variant="ghost" href="#metrics">Metrics</Btn>
            <Btn variant="ghost" href="#pricing">Pricing</Btn>
            {!isLoggedIn && <Btn variant="outline" href={login()}>Log In</Btn>}
            <Btn variant="primary" href={isLoggedIn ? dashboard() : register()}>{isLoggedIn ? "Dashboard" : "Start Free →"}</Btn>
          </div>
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <div style={{ position:"relative", zIndex:1, maxWidth:1480, margin:"0 auto", padding:"0 32px" }}>

        {/* HERO */}
        <section style={{ display:"grid", gridTemplateColumns:"1.2fr 0.8fr", gap:64, alignItems:"center", padding:"96px 0 72px", animation:"fade-up .8s ease both" }}>

          {/* Left */}
          <div style={{ display:"flex", flexDirection:"column", gap:28 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div className="live-dot" />
              <Badge variant="cyan"><Sparkles size={12} /> Built for modern airtime workflows</Badge>
            </div>

            <h1 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(40px,5vw,62px)", fontWeight:800, lineHeight:1.06, letterSpacing:"-2px" }}>
              Airtime Operations<br />for Teams That<br />
              <span style={{ background:"linear-gradient(135deg,#22d3ee,#10b981)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>Move Fast</span>
            </h1>

            <p style={{ fontSize:17, lineHeight:1.7, color:S.muted, maxWidth:480 }}>
              Power payroll support, customer rewards, and recurring campaigns from one SaaS dashboard.
              Your company gets billing control, scheduled transfers, and role-based access in a single workspace.
            </p>

            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              {isLoggedIn
                ? <Btn variant="primary" size="lg" href={dashboard()}>Open Dashboard <ArrowRight size={16} /></Btn>
                : <>
                    <Btn variant="primary" size="lg" href={login()}>Start Sending Airtime <ArrowRight size={16} /></Btn>
                    {canRegister && <Btn variant="secondary" size="lg" href={register()}><Building2 size={16} /> Create Company Account</Btn>}
                  </>
              }
            </div>

            {/* Trust trail */}
            <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap", paddingTop:8 }}>
              {[
                { Icon:ShieldCheck,   label:"Multi-tenant secure" },
                { Icon:CalendarClock, label:"24/7 scheduler" },
                { Icon:Activity,      label:"Realtime engine" },
              ].map(({ Icon, label }, i) => (
                <span key={i} style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:S.muted }}>
                  {i > 0 && <span style={{ color:S.borderS }}>·</span>}
                  <Icon size={14} color={S.accent} /> {label}
                </span>
              ))}
            </div>

            {/* Trust stat pills */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
              {TRUST.map(({ label, value, color }) => (
                <div key={label} style={{ background:"rgba(255,255,255,.03)", border:`1px solid ${S.border}`, borderRadius:12, padding:"14px 16px" }}>
                  <p style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:18, fontWeight:700, color }}>{value}</p>
                  <p style={{ fontSize:11, color:S.muted, marginTop:4 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Dashboard preview */}
          <div className="card-3d" style={{ borderRadius:24, border:`1px solid rgba(255,255,255,.1)`, background:S.surface, backdropFilter:"blur(24px)", boxShadow:"0 0 0 1px rgba(255,255,255,.04) inset,0 32px 80px rgba(0,0,0,.5),0 8px 24px rgba(34,211,238,.08)", overflow:"hidden", position:"relative", animation:"fade-up .8s .2s ease both" }}>
            {/* Top glow line */}
            <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(34,211,238,.5),transparent)" }} />

            {/* Card header */}
            <div style={{ padding:"20px 24px 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", gap:6 }}>
                {["#ef4444","#eab308","#22c55e"].map(c => <div key={c} style={{ width:10, height:10, borderRadius:"50%", background:c }} />)}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:S.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:".5px" }}>
                <Gauge size={12} color={S.accent} /> Live Company Snapshot
              </div>
              <Badge variant="green" style={{ fontSize:11, padding:"3px 10px" }}>
                <div className="live-dot" style={{ width:6, height:6 }} /> Healthy
              </Badge>
            </div>

            {/* Card body */}
            <div style={{ padding:"20px 24px 24px", display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <StatBox label="Today Sent"      value="KES 126,980" sub="↑ 12% vs yesterday" />
                <StatBox label="Available Wallet" value="KES 58,500" valueColor={S.accent} sub="Sufficient for 3 days" subColor={S.muted} />
              </div>

              {[
                { label:"Batch completion", pct:78, pctColor:S.accent,  colors:[S.accent, S.accent2] },
                { label:"Wallet usage",     pct:41, pctColor:S.accent2, colors:[S.accent2,"#059669"] },
              ].map(({ label, pct, pctColor, colors }) => (
                <div key={label} style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:S.muted }}>
                    <span>{label}</span><span style={{ color:pctColor, fontWeight:600 }}>{pct}%</span>
                  </div>
                  <ProgressBar pct={pct} colors={colors} />
                </div>
              ))}

              <div style={{ height:1, background:S.border }} />

              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <ActivityRow Icon={BellRing} iconBg="rgba(34,211,238,.12)"  iconColor={S.accent}  name="Next recurring batch" time="Scheduled"    val={countdown} valColor={S.accent} />
                <ActivityRow Icon={Layers3}  iconBg="rgba(129,140,248,.12)" iconColor={S.accent3} name="Scheduled jobs today" time="Active queue" val="42" />
                <ActivityRow Icon={Users}    iconBg="rgba(16,185,129,.12)"  iconColor={S.accent2} name="Active team members"  time="Across 2 roles" val="7" />
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" style={{ padding:"80px 0 72px" }}>
          <div ref={featHeaderRef} className="reveal" style={{ textAlign:"center", maxWidth:640, margin:"0 auto 56px", display:"flex", flexDirection:"column", gap:16, alignItems:"center" }}>
            <Badge variant="indigo"><Zap size={12} /> Platform Capabilities</Badge>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(28px,4vw,42px)", fontWeight:800, letterSpacing:"-1.5px", lineHeight:1.1 }}>
              Everything Your Airtime<br />Program Needs
            </h2>
            <p style={{ fontSize:16, color:S.muted, lineHeight:1.65 }}>
              From one-time pushes to multi-tier recurring campaigns — built with enterprise isolation and wallet-level spend control.
            </p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
            {FEATURES.map(f => <FeatureCard key={f.title} {...f} />)}
          </div>
        </section>

        {/* METRICS */}
        <section id="metrics" style={{ padding:"16px 0 80px" }}>
          <div ref={metricsRef} style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
            <MetricCard num="99.9%" label="Uptime SLA"    sub="Real-time transfer engine with automatic failover"    numColor={S.accent}  topColor={S.accent}  delay={0}   />
            <MetricCard num="2.1s"  label="Avg. Delivery" sub="From scheduled trigger to recipient confirmation"    numColor={S.accent2} topColor={S.accent2} delay={100} />
            <MetricCard num="500+"  label="Companies"     sub="Running active airtime programs on CreditSaaS"       numColor={S.accent3} topColor={S.accent3} delay={200} />
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" style={{ padding:"12px 0 80px" }}>
          <div style={{ textAlign:"center", maxWidth:680, margin:"0 auto 36px", display:"flex", flexDirection:"column", gap:14, alignItems:"center" }}>
            <Badge variant="green"><Wallet size={12} /> Pricing</Badge>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(28px,4vw,40px)", fontWeight:800, letterSpacing:"-1.2px", lineHeight:1.1 }}>
              Transparent, Usage-Based Pricing
            </h2>
            <p style={{ fontSize:16, color:S.muted, lineHeight:1.65 }}>
              You pay for what you use: a small fee per airtime send plus a monthly seat fee for each user on your company account.
            </p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <div className="metric-card" style={{ background:"rgba(24,24,27,.7)", border:`1px solid ${S.border}`, borderRadius:20, padding:"28px 24px", display:"flex", flexDirection:"column", gap:10 }}>
              <p style={{ fontSize:12, textTransform:"uppercase", letterSpacing:".6px", color:S.muted }}>Per Airtime Transaction</p>
              <p style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:42, fontWeight:800, letterSpacing:"-1.5px", color:S.accent }}>KES 0.5</p>
              <p style={{ fontSize:14, color:S.muted, lineHeight:1.6 }}>
                Charged each time airtime is successfully sent to a recipient.
              </p>
            </div>

            <div className="metric-card" style={{ background:"rgba(24,24,27,.7)", border:`1px solid ${S.border}`, borderRadius:20, padding:"28px 24px", display:"flex", flexDirection:"column", gap:10 }}>
              <p style={{ fontSize:12, textTransform:"uppercase", letterSpacing:".6px", color:S.muted }}>Per User / Month</p>
              <p style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:42, fontWeight:800, letterSpacing:"-1.5px", color:S.accent2 }}>KES 300</p>
              <p style={{ fontSize:14, color:S.muted, lineHeight:1.6 }}>
                Billed monthly for each active team member in your company workspace.
              </p>
            </div>
          </div>

          <div style={{ marginTop:16, border:`1px solid ${S.border}`, borderRadius:14, padding:"14px 16px", background:"rgba(255,255,255,.02)" }}>
            <p style={{ fontSize:13, color:S.muted }}>
              Example: If you send 1,000 transactions with 5 active users in a month:
              <span style={{ color:"#fafafa", fontWeight:600 }}> (1,000 x KES 0.5) + (5 x KES 300) = KES 2,000 total platform fee.</span>
            </p>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding:"16px 0 100px" }}>
          <div ref={ctaRef} className="reveal" style={{ position:"relative", borderRadius:28, border:"1px solid rgba(34,211,238,.2)", background:"rgba(24,24,27,.7)", backdropFilter:"blur(24px)", padding:64, display:"grid", gridTemplateColumns:"1fr auto", gap:48, alignItems:"center", overflow:"hidden" }}>
            <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 70% 80% at 10% 50%,rgba(34,211,238,.08),transparent 60%),radial-gradient(ellipse 50% 60% at 90% 50%,rgba(16,185,129,.07),transparent 60%)", pointerEvents:"none" }} />
            <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(34,211,238,.4) 30%,rgba(16,185,129,.4) 70%,transparent)" }} />

            <div style={{ display:"flex", flexDirection:"column", gap:16, position:"relative" }}>
              <Badge variant="cyan" style={{ width:"fit-content" }}><BadgeCheck size={12} /> Production Ready</Badge>
              <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:36, fontWeight:800, letterSpacing:"-1.5px", lineHeight:1.1 }}>
                Launch Your Airtime<br />Program This Week
              </h2>
              <p style={{ fontSize:16, color:S.muted, maxWidth:480, lineHeight:1.6 }}>
                Onboard your company, top up billing, invite your team, and automate airtime delivery — all from a single workspace.
              </p>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:12, position:"relative", minWidth:220 }}>
              <InputField label="Work Email" type="email" placeholder="you@company.com" />
              <InputField label="Company Name" placeholder="Acme Corp" />
              <Btn variant="primary" size="lg" href={isLoggedIn ? dashboard() : register()} style={{ width:"100%", justifyContent:"center", marginTop:4 }}>
                {isLoggedIn ? "Open Dashboard →" : "Get Started Free →"}
              </Btn>
              <p style={{ fontSize:12, color:S.muted, textAlign:"center" }}>No credit card required · Setup in 5 min</p>
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop:`1px solid ${S.border}`, padding:"28px 32px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16, maxWidth:1480, margin:"0 auto", position:"relative", zIndex:1 }}>
        <p style={{ fontSize:13, color:S.muted }}>© 2026 CreditSaaS. Company Airtime Infrastructure.</p>
        <div style={{ display:"flex", gap:20 }}>
          {["Privacy","Terms","Docs","Support"].map(l => (
            <a key={l} href="#" className="footer-link" style={{ fontSize:13, color:S.muted, textDecoration:"none", transition:"color .2s" }}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
