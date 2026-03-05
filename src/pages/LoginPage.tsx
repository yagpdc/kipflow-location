import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock } from "react-icons/fi";
import { useAuthStore } from "../store/auth.store";
import { useThemeStore } from "../store/theme.store";
import ThemeSwitch from "../components/ThemeSwitch";
import LogoWhite from "../assets/logos/kipflow branco.svg";
import LogoDark from "../assets/logos/kipflow preto.svg";

// ── Time-based sky theme ─────────────────────────────────────────

interface SkyTheme {
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  starCount: number;
  starAlpha: number;
  cloudAlpha: number;
  cloudSpeed: number;
  isNight: boolean;
}

function getSkyTheme(tod: string): SkyTheme {
  switch (tod) {
    case "morning":
      return {
        gradientFrom: "#2a6ab0",
        gradientVia: "#4a88c8",
        gradientTo: "#6ea8d6",
        starCount: 0,
        starAlpha: 0,
        cloudAlpha: 0.45,
        cloudSpeed: 0.12,
        isNight: false,
      };
    case "night":
    default:
      return {
        gradientFrom: "#000d1a",
        gradientVia: "#001a2e",
        gradientTo: "#003050",
        starCount: 180,
        starAlpha: 0.7,
        cloudAlpha: 0.06,
        cloudSpeed: 0.06,
        isNight: true,
      };
  }
}

// ── Pre-render a realistic cloud to offscreen canvas ─────────────

function createCloudTexture(
  w: number,
  h: number,
  color: [number, number, number],
  alpha: number
): HTMLCanvasElement {
  const pad = 40;
  const off = document.createElement("canvas");
  off.width = w + pad * 2;
  off.height = h + pad * 2;
  const ctx = off.getContext("2d")!;

  const cx = off.width / 2;
  const baseY = off.height * 0.62;

  // Helper: draw a soft radial gradient circle
  const softCircle = (x: number, y: number, r: number, a: number) => {
    const grad = ctx.createRadialGradient(x, y, r * 0.15, x, y, r);
    grad.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},${a})`);
    grad.addColorStop(0.5, `rgba(${color[0]},${color[1]},${color[2]},${a * 0.7})`);
    grad.addColorStop(0.8, `rgba(${color[0]},${color[1]},${color[2]},${a * 0.25})`);
    grad.addColorStop(1, `rgba(${color[0]},${color[1]},${color[2]},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };

  // 1) Flat base — wide, short ellipse at the bottom
  const baseW = w * 0.42;
  const baseH = h * 0.18;
  for (let i = 0; i < 8; i++) {
    const bx = cx + (Math.random() - 0.5) * baseW * 1.6;
    const by = baseY + (Math.random() - 0.5) * baseH;
    softCircle(bx, by, baseH * (1.0 + Math.random() * 0.8), alpha * 0.6);
  }

  // 2) Main puffs on top — 3-5 big bumps forming the classic silhouette
  const puffCount = 3 + Math.floor(Math.random() * 3);
  const puffSpacing = (w * 0.6) / (puffCount + 1);

  for (let i = 0; i < puffCount; i++) {
    const t = (i + 1) / (puffCount + 1);
    // Arch shape: tallest in center, shorter at edges
    const heightFactor = 1 - Math.pow(t * 2 - 1, 2) * 0.5;
    const px = cx - w * 0.3 + (i + 1) * puffSpacing + (Math.random() - 0.5) * puffSpacing * 0.3;
    const puffR = h * (0.22 + Math.random() * 0.12) * heightFactor;
    const py = baseY - puffR * (0.6 + Math.random() * 0.3);

    // Main puff body
    softCircle(px, py, puffR, alpha * 0.8);
    // Inner highlight (brighter center)
    softCircle(px - puffR * 0.1, py - puffR * 0.15, puffR * 0.55, alpha * 0.4);

    // Small accent puffs around each main puff
    for (let j = 0; j < 2 + Math.floor(Math.random() * 2); j++) {
      const angle = -Math.PI * 0.3 + Math.random() * Math.PI * 0.6 - Math.PI / 2;
      const dist = puffR * (0.4 + Math.random() * 0.5);
      const ax = px + Math.cos(angle) * dist;
      const ay = py + Math.sin(angle) * dist;
      const ar = puffR * (0.35 + Math.random() * 0.3);
      softCircle(ax, ay, ar, alpha * 0.55);
    }
  }

  // 3) Fill gaps between puffs with medium blobs
  for (let i = 0; i < puffCount - 1; i++) {
    const t1 = (i + 1) / (puffCount + 1);
    const t2 = (i + 2) / (puffCount + 1);
    const midT = (t1 + t2) / 2;
    const mx = cx - w * 0.3 + midT * (w * 0.6) + puffSpacing * 0.5;
    const my = baseY - h * (0.08 + Math.random() * 0.1);
    const mr = h * (0.14 + Math.random() * 0.08);
    softCircle(mx, my, mr, alpha * 0.65);
  }

  // 4) Wispy edges — very subtle small blobs on the sides
  for (let i = 0; i < 4; i++) {
    const side = i < 2 ? -1 : 1;
    const ex = cx + side * w * (0.3 + Math.random() * 0.15);
    const ey = baseY - h * (Math.random() * 0.15);
    const er = h * (0.08 + Math.random() * 0.06);
    softCircle(ex, ey, er, alpha * 0.3);
  }

  return off;
}

// ── Animated sky canvas ──────────────────────────────────────────

interface Star {
  x: number;
  y: number;
  radius: number;
  phase: number;
  speed: number;
  isOrange: boolean;
}

interface CloudObj {
  x: number;
  y: number;
  speed: number;
  texture: HTMLCanvasElement;
  texW: number;
  texH: number;
}

function SkyCanvas({ theme }: { theme: SkyTheme }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);
  const cloudsRef = useRef<CloudObj[]>([]);
  const initedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!initedRef.current) {
        initSky(window.innerWidth, window.innerHeight);
        initedRef.current = true;
      }
    };

    const initSky = (w: number, h: number) => {
      // Stars
      const stars: Star[] = [];
      for (let i = 0; i < theme.starCount; i++) {
        // Most stars tiny (distant), few are bigger (closer)
        const sizeTier = Math.random();
        const radius = sizeTier < 0.65
          ? 0.2 + Math.random() * 0.35   // 65% — tiny distant
          : sizeTier < 0.9
            ? 0.5 + Math.random() * 0.5  // 25% — medium
            : 0.9 + Math.random() * 0.6; // 10% — bright close
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h * 0.85,
          radius,
          phase: Math.random() * Math.PI * 2,
          speed: 0.008 + Math.random() * 0.018,
          isOrange: Math.random() < 0.15,
        });
      }
      starsRef.current = stars;

      // Pre-render cloud textures — mix of sizes spread across the sky
      const color: [number, number, number] = theme.isNight
        ? [160, 180, 210]
        : [255, 255, 255];
      const clouds: CloudObj[] = [];

      // Define cloud size tiers
      const tiers = [
        { count: 3, minW: 350, maxW: 550, minH: 130, maxH: 180, alphaScale: 1.0 },   // large
        { count: 4, minW: 200, maxW: 350, minH: 80, maxH: 130, alphaScale: 0.85 },   // medium
        { count: 5, minW: 100, maxW: 200, minH: 45, maxH: 75, alphaScale: 0.6 },     // small wisps
      ];

      // Distribute across horizontal lanes and vertical zones (top/mid/bottom)
      const totalClouds = tiers.reduce((s, t) => s + t.count, 0);
      const isMobile = w < 768;

      // On mobile, skip the middle zone (where the card sits) — only top & bottom
      const zones = isMobile
        ? [
            { minY: 0, maxY: h * 0.18 },       // top
            { minY: h * 0.78, maxY: h * 0.95 }, // bottom
          ]
        : [
            { minY: 0, maxY: h * 0.20 },        // top
            { minY: h * 0.20, maxY: h * 0.65 }, // middle
            { minY: h * 0.65, maxY: h * 0.95 }, // bottom
          ];

      // Assign clouds to zones round-robin so each zone gets coverage
      let cloudIndex = 0;
      for (const tier of tiers) {
        for (let i = 0; i < tier.count; i++) {
          const cw = tier.minW + Math.random() * (tier.maxW - tier.minW);
          const ch = tier.minH + Math.random() * (tier.maxH - tier.minH);
          const texture = createCloudTexture(
            cw,
            ch,
            color,
            theme.cloudAlpha * tier.alphaScale
          );

          // Spread across full screen width — start positions cover entire range
          const slotWidth = w / totalClouds;
          const baseX = cloudIndex * slotWidth;

          // Assign to zone round-robin (top → mid → bottom → top → ...)
          const zone = zones[cloudIndex % zones.length];
          const yRange = zone.maxY - zone.minY;

          clouds.push({
            x: baseX + (Math.random() - 0.5) * slotWidth * 0.6,
            y: zone.minY + Math.random() * yRange,
            speed: theme.cloudSpeed * (0.3 + Math.random() * 0.9),
            texture,
            texW: texture.width,
            texH: texture.height,
          });
          cloudIndex++;
        }
      }
      cloudsRef.current = clouds;
    };

    let time = 0;
    const draw = () => {
      time++;
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Sky gradient background
      const grad = ctx.createLinearGradient(0, 0, w * 0.3, h);
      grad.addColorStop(0, theme.gradientFrom);
      grad.addColorStop(0.5, theme.gradientVia);
      grad.addColorStop(1, theme.gradientTo);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Stars (night only) — smooth ✦ sparkle
      if (theme.isNight) {
        for (const star of starsRef.current) {
          // Smooth sine base, but pow() makes bright peaks short & punchy
          const t1 = Math.sin(time * star.speed * 0.4 + star.phase) * 0.5 + 0.5;
          const t2 = Math.sin(time * star.speed * 0.17 + star.phase * 1.7) * 0.5 + 0.5;
          const raw = t1 * 0.7 + t2 * 0.3;
          const twinkle = Math.pow(raw, 7); // stays dim, very brief bright flash
          const alpha = theme.starAlpha * (0.15 + twinkle * 0.6);

          const rgb = star.isOrange ? [249, 155, 72] : [220, 230, 255];
          const spikeLen = star.radius * (2.5 + twinkle * 1.0);
          const waist = star.radius * 0.15; // thin waist for ✦ shape

          // Soft radial glow
          const glowR = star.radius * 2.5;
          const glow = ctx.createRadialGradient(
            star.x, star.y, 0,
            star.x, star.y, glowR
          );
          glow.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha * 0.15})`);
          glow.addColorStop(0.5, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha * 0.03})`);
          glow.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(star.x, star.y, glowR, 0, Math.PI * 2);
          ctx.fill();

          // ✦ Four-point diamond star — smooth continuous path
          ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
          ctx.beginPath();
          ctx.moveTo(star.x, star.y - spikeLen);        // top tip
          ctx.quadraticCurveTo(star.x + waist, star.y - waist, star.x + spikeLen, star.y); // → right tip
          ctx.quadraticCurveTo(star.x + waist, star.y + waist, star.x, star.y + spikeLen); // → bottom tip
          ctx.quadraticCurveTo(star.x - waist, star.y + waist, star.x - spikeLen, star.y); // → left tip
          ctx.quadraticCurveTo(star.x - waist, star.y - waist, star.x, star.y - spikeLen); // → back to top
          ctx.fill();

          // Bright core
          const coreR = Math.max(star.radius * 0.35, 0.5);
          ctx.beginPath();
          ctx.arc(star.x, star.y, coreR, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${Math.min(alpha * 1.2, 1)})`;
          ctx.fill();
        }
      }

      // Clouds (pre-rendered textures)
      for (const cloud of cloudsRef.current) {
        cloud.x += cloud.speed;
        if (cloud.x > w + cloud.texW / 2 + 50) {
          cloud.x = -cloud.texW - 50;
        }
        ctx.drawImage(
          cloud.texture,
          cloud.x - cloud.texW / 2,
          cloud.y - cloud.texH / 2
        );
      }

      animRef.current = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    animRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

// ── Login Page ───────────────────────────────────────────────────

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const { isDark } = useThemeStore();
  const tod = isDark ? "night" : "morning";
  const theme = useMemo(() => getSkyTheme(tod), [tod]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Preencha todos os campos");
      return;
    }
    login(email, password);
    navigate("/");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <SkyCanvas key={tod} theme={theme} />

      {/* Theme switch */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeSwitch />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
          {/* Borda laranja top */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

          <div
            className={`backdrop-blur-xl px-8 pt-10 pb-8 ${
              theme.isNight ? "bg-[#1a1a1a]/90" : "bg-white/90"
            }`}
          >
            {/* Logo + título */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-4">
                <img
                  src={theme.isNight ? LogoWhite : LogoDark}
                  alt="KipFlow Logo"
                  className="h-10"
                />
              </div>
              <h2
                className={`text-xl font-bold mb-1 ${
                  theme.isNight ? "text-white" : "text-gray-900"
                }`}
              >
                Bem-vindo de volta
              </h2>
              <p
                className={`text-sm ${
                  theme.isNight ? "text-white/40" : "text-gray-500"
                }`}
              >
                Entre para acessar sua conta
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  className={`text-sm font-medium mb-1.5 block ${
                    theme.isNight ? "text-white/60" : "text-gray-700"
                  }`}
                >
                  Email
                </label>
                <div className="relative">
                  <FiMail
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                      theme.isNight ? "text-white/30" : "text-gray-400"
                    }`}
                    size={18}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="seu@email.com"
                    className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all ${
                      theme.isNight
                        ? "text-white placeholder-white/25 bg-white/[0.06] border border-white/[0.08]"
                        : "text-gray-900 placeholder-gray-400 bg-gray-50 border border-gray-200"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`text-sm font-medium mb-1.5 block ${
                    theme.isNight ? "text-white/60" : "text-gray-700"
                  }`}
                >
                  Senha
                </label>
                <div className="relative">
                  <FiLock
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                      theme.isNight ? "text-white/30" : "text-gray-400"
                    }`}
                    size={18}
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="••••••••"
                    className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all ${
                      theme.isNight
                        ? "text-white placeholder-white/25 bg-white/[0.06] border border-white/[0.08]"
                        : "text-gray-900 placeholder-gray-400 bg-gray-50 border border-gray-200"
                    }`}
                  />
                </div>
                <div className="text-right mt-2">
                  <span className="text-xs text-primary/70 hover:text-primary cursor-pointer transition-colors">
                    Esqueceu a senha?
                  </span>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 p-2.5 rounded-lg">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all text-sm flex items-center justify-center gap-2"
              >
                Entrar <span className="text-base">→</span>
              </button>
            </form>

            <div className="flex items-center gap-3 mt-6 mb-4">
              <div
                className={`flex-1 h-px ${
                  theme.isNight ? "bg-white/[0.08]" : "bg-gray-200"
                }`}
              />
              <span
                className={`text-xs uppercase tracking-wider ${
                  theme.isNight ? "text-white/25" : "text-gray-400"
                }`}
              >
                ou
              </span>
              <div
                className={`flex-1 h-px ${
                  theme.isNight ? "bg-white/[0.08]" : "bg-gray-200"
                }`}
              />
            </div>

            <p
              className={`text-center text-sm ${
                theme.isNight ? "text-white/40" : "text-gray-500"
              }`}
            >
              Não tem uma conta?{" "}
              <span className="text-primary font-medium cursor-pointer hover:text-primary/80 transition-colors">
                Criar conta gratuita
              </span>
            </p>

            <p
              className={`text-[11px] text-center mt-6 ${
                theme.isNight ? "text-white/20" : "text-gray-400"
              }`}
            >
              Demo — Use qualquer e-mail e senha para entrar
            </p>
          </div>

          {/* Borda laranja bottom */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
        </div>
      </div>
    </div>
  );
}
