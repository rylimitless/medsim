"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import InstructionsModal from "./components/InstructionsModal";
import { ThemeToggle } from "./components/ThemeProvider";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleLaunchClick = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleFinish = () => {
    setIsModalOpen(false);
    router.push("/model");
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden selection:bg-[#bb1824]/20" style={{ background: "var(--background)", color: "var(--foreground)" }}>

      {/* ── Floating left logo mark ──────────────────────── */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-2 pointer-events-none">
        <div className="w-9 h-9 bg-[#bb1824] flex items-center justify-center red-accent-glow" style={{ borderRadius: "8px" }}>
          <span className="material-symbols-outlined text-white text-base">deployed_code</span>
        </div>
        <span className="label-mono text-[10px] tracking-[0.2em] font-bold" style={{ color: "var(--on-surface-muted)", writingMode: "vertical-rl", transform: "rotate(180deg)" }}>MEDSIM</span>
      </div>

      {/* ── Navigation ───────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b" style={{ background: "var(--nav-bg)", borderColor: "var(--outline-variant)", backdropFilter: "blur(16px)" }}>
        <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-5">
            {/* Home icon */}
            <a href="#" aria-label="Home" className="nav-link flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-xl">home</span>
            </a>
            <div className="h-5 w-px" style={{ background: "var(--outline-variant)" }} />
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#bb1824] flex items-center justify-center red-accent-glow" style={{ borderRadius: "4px" }}>
                <span className="material-symbols-outlined text-white text-xl">deployed_code</span>
              </div>
              <span className="text-xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>MedSim</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-10">
            <a href="#how-it-works" className="nav-link label-mono tracking-widest uppercase text-xs transition-colors">How It Works</a>
            <a href="#features"     className="nav-link label-mono tracking-widest uppercase text-xs transition-colors">Features</a>
            <a href="#who-is-it-for" className="nav-link label-mono tracking-widest uppercase text-xs transition-colors">Who Is It For</a>
          </div>

          <ThemeToggle />
        </nav>
      </header>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative pb-20 px-6 overflow-hidden pt-32">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] blur-[120px] rounded-full -mr-40 -mt-20 pointer-events-none" style={{ background: "rgba(187,24,36,0.07)" }} />
        <div className="absolute top-60 left-0 w-[400px] h-[400px] blur-[100px] rounded-full -ml-20 pointer-events-none" style={{ background: "rgba(45,94,162,0.08)" }} />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="z-10 lg:pl-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 border mb-6" style={{ borderRadius: "9999px", borderColor: "rgba(187,24,36,0.3)", background: "rgba(187,24,36,0.08)" }}>
              <span className="w-2 h-2 rounded-full bg-[#bb1824] animate-pulse red-accent-glow" />
              <span className="label-mono text-[#bb1824] tracking-[0.2em] uppercase text-xs">Next Gen Training</span>
            </div>

            <h1 className="font-bold mb-6 leading-none tracking-tighter" style={{ fontSize: "clamp(48px, 8vw, 80px)", color: "var(--foreground)" }}>
              MedSim
            </h1>

            <p className="text-xl md:text-2xl font-light max-w-lg leading-relaxed mb-6" style={{ color: "var(--on-surface-variant)" }}>
              World-class surgical training.{" "}
              <span style={{ color: "var(--foreground)", fontWeight: 600 }}>No lab required.</span>
            </p>

            <p className="text-sm md:text-base font-light max-w-lg leading-relaxed mb-10" style={{ color: "var(--on-surface-muted)" }}>
              According to the Journal of Surgical Research, surgical training can require expensive simulation labs often costing upwards of $300,000, leaving many medical students with few opportunities to safely practice procedures before operating on real patients.
            </p>

            <div className="flex flex-wrap gap-3">
              <button onClick={handleLaunchClick} className="btn-surgical px-8 py-3.5 font-bold hover:brightness-110 transition-all flex items-center gap-2 red-accent-glow" style={{ borderRadius: "4px" }}>
                <span className="label-mono tracking-widest uppercase text-sm">Launch Experience</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
              <a href="#how-it-works" className="btn-ghost px-8 py-3.5 font-bold flex items-center gap-2" style={{ borderRadius: "4px", textDecoration: "none" }}>
                <span className="label-mono tracking-widest uppercase text-sm">Learn More</span>
              </a>
            </div>
          </div>

          <div className="relative aspect-square">
            <div className="absolute inset-0 z-10 pointer-events-none" style={{ background: "linear-gradient(to top, var(--background) 0%, transparent 40%)" }} />
            <div className="w-full h-full overflow-hidden">
              <Image src="/hero-anatomy-blue.png" alt="3D anatomical model" fill className="object-contain object-center" priority />
            </div>
          </div>
        </div>
      </section>

      {/* ── Brand statement ───────────────────────────────── */}
      <section className="px-6 py-16" style={{ background: "var(--surface-container-low)" }}>
        <div className="max-w-5xl mx-auto text-center">
          <span className="material-symbols-outlined text-[#bb1824] mb-8 text-3xl">emergency_home</span>
          <h2 className="font-semibold leading-tight text-2xl md:text-4xl" style={{ color: "var(--foreground)" }}>
            Immersive 3D anatomy and AI-powered surgical simulation,{" "}
            <span style={{ color: "var(--primary)" }}>built for the next generation of physicians.</span>{" "}
            <span style={{ color: "var(--on-surface-muted)" }}>Train smarter, prepare better, perform with confidence.</span>
          </h2>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────── */}
      <section id="how-it-works" className="px-6 py-24" style={{ background: "var(--background)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">

            {/* Sticky left — label + image only */}
            <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
              <span className="label-mono text-[#bb1824] tracking-widest text-xs uppercase block">
                {"{ How MedSim Works }"}
              </span>
              <div className="relative w-full overflow-hidden" style={{ borderRadius: "24px", aspectRatio: "4/5" }}>
                <div className="absolute inset-0 z-10 pointer-events-none" style={{ background: "linear-gradient(to top, var(--background) 0%, transparent 40%)" }} />
                <Image src="/hero-anatomy.png" alt="Anatomical model" fill className="object-cover object-center" />
              </div>
            </aside>

            {/* Steps — slashed step numbers */}
            <section className="lg:col-span-7 pt-8">
              <div className="space-y-16">
                {[
                  {
                    n: "1",
                    title: "You open MedSim in any browser",
                    desc: "You land on the home page, hit Launch Experience and a 3D brain model loads on screen. No download, no install.",
                  },
                  {
                    n: "2",
                    title: "Your webcam becomes your hands",
                    desc: "MedSim uses your camera to track hand movements in real time. Your right hand rotates the model. Your left hand acts as a scalpel — trace incision paths directly on the 3D anatomy.",
                  },
                  {
                    n: "3",
                    title: "You speak to navigate anatomy",
                    desc: "Say \"select lingual\" and the camera zooms to that brain region and highlights it. Ask \"what is this?\" and the AI explains it out loud.",
                  },
                  {
                    n: "4",
                    title: "You get AI feedback",
                    desc: "After a procedure, the AI evaluates your performance and gives instant feedback — like having a senior surgeon watching over your shoulder.",
                  },
                ].map((step) => (
                  <div key={step.n} className="flex gap-8 items-start group">
                    {/* Degree-style step number */}
                    <div className="relative flex-shrink-0 flex items-start">
                      <span
                        className="leading-none select-none"
                        style={{ color: "#bb1824", fontSize: "22px", fontWeight: 700, marginTop: "6px", marginRight: "1px" }}
                      >°</span>
                      <span className="text-7xl font-bold leading-none select-none" style={{ color: "#bb1824" }}>
                        {step.n}
                      </span>
                    </div>
                    <div className="pt-3">
                      <h3 className="text-xl md:text-2xl font-bold mb-3 leading-tight" style={{ color: "var(--foreground)" }}>
                        {step.title}
                      </h3>
                      <p className="text-base leading-relaxed max-w-lg" style={{ color: "var(--on-surface-muted)" }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-16">
                <button onClick={handleLaunchClick} className="btn-surgical px-8 py-3.5 font-bold hover:brightness-110 transition-all inline-flex items-center gap-2 red-accent-glow" style={{ borderRadius: "4px" }}>
                  <span className="label-mono tracking-widest uppercase text-sm">Try It Now</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </section>

      {/* ── Key Features ──────────────────────────────────── */}
      <section id="features" className="px-6 py-24" style={{ background: "var(--surface-container-low)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-start">
            {/* Feature cards — clean 2×2 grid, no stagger offsets */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: "psychology",      title: "Study Mode",     desc: "Explore a full 3D brain and anatomical structures at your own pace." },
                { icon: "mic_external_on", title: "AI Exploration",  desc: "Select any structure and ask the AI questions by voice." },
                { icon: "biotech",         title: "Simulate",        desc: "Simulate complex surgical procedures in a safe virtual environment." },
                { icon: "insights",        title: "AI Feedback",     desc: "Get instant AI feedback on your performance after each session." },
              ].map((item) => (
                <div key={item.icon} className="p-6 transition-all duration-300 hover:border-[#bb1824]/40"
                  style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "8px" }}>
                  <div className="mb-4 inline-flex items-center justify-center w-10 h-10 text-[#bb1824] red-accent-glow"
                    style={{ background: "var(--surface-container-lowest)", border: "1px solid rgba(187,24,36,0.25)", borderRadius: "4px" }}>
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  </div>
                  <h5 className="font-semibold mb-2 text-sm" style={{ color: "var(--foreground)" }}>{item.title}</h5>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--on-surface-muted)" }}>{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="lg:pt-4">
              <div className="mb-4">
                <span className="label-mono text-[#bb1824] tracking-[0.2em] uppercase text-xs">{"{ Capabilities }"}</span>
              </div>
              <h2 className="font-bold mb-8 tracking-tighter leading-none" style={{ fontSize: "clamp(40px, 5vw, 60px)", color: "var(--foreground)" }}>
                Key Features
              </h2>
              <ul className="space-y-4 mb-8">
                {[
                  "3D anatomical exploration",
                  "Voice-activated AI",
                  "Surgical simulation",
                  "Accessible on any browser",
                ].map((feat) => (
                  <li key={feat} className="flex items-center gap-3" style={{ color: "var(--on-surface-variant)" }}>
                    <span className="material-symbols-outlined text-[#bb1824]">check_circle</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Who It's For ──────────────────────────────────── */}
      <section id="who-is-it-for" className="px-6 py-20" style={{ background: "var(--background)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="mb-4">
              <span className="label-mono text-[#bb1824] tracking-[0.2em] uppercase text-xs">{"{ WHO IT IS FOR }"}</span>
            </div>
            <h2 className="text-5xl font-bold mb-6 tracking-tighter leading-none" style={{ color: "var(--foreground)" }}>
              BUILT FOR THE FUTURE OF MEDICINE
            </h2>
            <p className="max-w-2xl mx-auto leading-relaxed" style={{ color: "var(--on-surface-muted)" }}>
              From students to seasoned professionals, MedSim scales to the needs of the entire medical community.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: "school",      title: "For Institutions", desc: "Replace expensive physical labs with scalable virtual training. Track student progress with enterprise-grade dashboards and real-time competency analytics." },
              { icon: "content_cut", title: "For Surgeons",     desc: "Practice complex or rare procedures before heading into the OR. Maintain peak technical proficiency anywhere with high-fidelity haptic simulation feedback." },
            ].map((card) => (
              <div key={card.title} className="relative group p-10 transition-all duration-300"
                style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "8px" }}>
                <div className="mb-8 inline-flex items-center justify-center w-14 h-14 text-[#bb1824] red-accent-glow"
                  style={{ background: "var(--surface-container-lowest)", border: "1px solid rgba(187,24,36,0.25)", borderRadius: "4px" }}>
                  <span className="material-symbols-outlined text-3xl">{card.icon}</span>
                </div>
                <h3 className="text-2xl font-semibold mb-4 tracking-tight" style={{ color: "var(--foreground)" }}>{card.title}</h3>
                <p className="leading-relaxed" style={{ color: "var(--on-surface-muted)" }}>{card.desc}</p>
                <div className="mt-8">
                  <a href="#" className="inline-flex items-center label-mono text-[#bb1824] hover:gap-2 transition-all tracking-widest text-xs">
                    LEARN MORE <span className="material-symbols-outlined ml-1 text-sm">arrow_forward</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="px-6 py-12 border-t" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-[#bb1824] flex items-center justify-center red-accent-glow" style={{ borderRadius: "4px" }}>
              <span className="material-symbols-outlined text-white text-xs">deployed_code</span>
            </div>
            <span className="font-bold" style={{ color: "var(--foreground)" }}>MedSim</span>
          </div>
          <div className="flex gap-10">
            {["Privacy Policy", "Terms of Service", "Contact Support"].map((link) => (
              <a key={link} href="#" className="footer-link label-mono text-xs tracking-wider transition-colors">{link}</a>
            ))}
          </div>
          <p className="label-mono text-xs" style={{ color: "var(--outline-variant)" }}>
            © 2026 Electrolyes.
          </p>
        </div>
      </footer>

      {/* Watermark */}
      <div className="fixed top-0 right-0 p-8 pointer-events-none select-none" style={{ opacity: 0.05, zIndex: 0 }}>
        <span className="label-mono font-bold" style={{ fontSize: "120px", lineHeight: 1, color: "var(--on-surface-muted)" }}>MEDSIM</span>
      </div>

      <InstructionsModal isOpen={isModalOpen} onClose={handleCloseModal} onFinish={handleFinish} />
    </div>
  );
}
