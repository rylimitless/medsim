export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background-dark font-display text-slate-100 selection:bg-primary/30">
      {/* Navigation */}
      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-background-dark/80 backdrop-blur-md">
        <nav className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary" />
            <span className="text-lg font-semibold tracking-tight">MedSim</span>
          </div>
          <div className="hidden items-center gap-10 md:flex">
            <a
              className="text-sm font-medium text-slate-200 transition-colors hover:text-primary"
              href="#"
            >
              How It Works
            </a>
            <a
              className="text-sm font-medium text-slate-200 transition-colors hover:text-primary"
              href="#"
            >
              Features
            </a>
            <a
              className="text-sm font-medium text-slate-200 transition-colors hover:text-primary"
              href="#"
            >
              Who It&apos;s For
            </a>
          </div>
          <button className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-slate-100 transition-all hover:bg-white/5">
            Try the Simulator
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pb-16 pt-28">
        <div className="absolute right-0 top-0 -mr-40 -mt-20 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="z-10 lg:pl-2">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-4 py-1">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                Next Gen Training
              </span>
            </div>
            <h1 className="mb-6 text-6xl font-semibold italic leading-tight text-slate-200 md:text-7xl">
              <span className="font-serif">MedSim</span>
            </h1>
            <p className="mb-4 max-w-lg text-xl font-medium text-slate-300">
              World-class surgical training.{" "}
              <span className="text-white">No lab required.</span>
            </p>
            <p className="mb-8 max-w-xl text-sm leading-6 text-slate-500">
              According to the Journal of Surgical Research, surgical training
              can require expensive simulation labs often costing upwards of
              $300,000, leaving many medical students with few opportunities to
              safely practice procedures before operating on real patients.
            </p>
            <button className="inline-flex items-center gap-3 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:brightness-110">
              Launch Experience
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[28px] bg-gradient-to-tr from-black/40 via-transparent to-primary/10" />
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div
                className="aspect-square w-full rounded-2xl bg-cover bg-center"
                style={{
                  backgroundImage:
                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAxkMK0uHK1gJj2C4f78LjEPmwXOixz2IWRVKwzZCQCktwiWeiZ3hBhbZKGND7z7Pp9U8o3naJzzFet1y8QnZsXjK96ATgrKc8OmUHz9IDHUiEhel3R8e0WfZdjv2UU1unFAVqQiqVJSs6F0fiUDWKliIE1Kp_s02JJSBM7XcXIiL_HrcZMCMW0vWMkYgVtzOXuMj5DBi9KV8Cey9RB6Sm30XeRFzWLhBUzN5USQ6MDZ2c1iEy1NpfQ-THNKtr1fMVhnjKn2WpfJlU")',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Statement */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex h-3 w-3 rotate-45 rounded-sm bg-primary/80 shadow-[0_0_12px_rgba(43,108,238,0.6)]" />
          <h2 className="text-2xl font-semibold leading-relaxed text-slate-200 md:text-3xl">
            Immersive 3D anatomy and AI-powered surgical simulation,{" "}
            <span className="text-primary">
              built for the next generation of physicians.
            </span>{" "}
            <span className="text-slate-500">
              Train smarter, prepare better, perform with confidence.
            </span>
          </h2>
        </div>
      </section>

      {/* Key Features */}
      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
              <h5 className="mb-2 text-sm font-semibold">1. Study Mode</h5>
              <p className="text-xs text-slate-500">
                Enter study mode and explore a 3D brain.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <h5 className="mb-2 text-sm font-semibold">2. AI Exploration</h5>
              <p className="text-xs text-slate-500">
                Select any structure and ask the AI questions by voice.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <h5 className="mb-2 text-sm font-semibold">3. Simulate</h5>
              <p className="text-xs text-slate-500">
                Simulate complex surgical procedures.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <h5 className="mb-2 text-sm font-semibold">4. AI Feedback</h5>
              <p className="text-xs text-slate-500">
                Get instant AI feedback on your performance.
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/80">
              Capabilities
            </p>
            <h2 className="mt-4 text-4xl font-semibold text-slate-100">
              <span className="font-serif">Key Features</span>
            </h2>
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              <li>• 3D anatomical exploration</li>
              <li>• Voice-activated AI</li>
              <li>• Surgical simulation</li>
              <li>• Accessible on any browser</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-semibold text-slate-100 md:text-5xl">
              <span className="font-serif">
                Built for the Future of Medicine
              </span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500">
              From students to seasoned professionals, MedSim scales to the
              needs of the entire medical community.
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-10">
              <h4 className="mb-4 text-xl font-semibold">For Institutions</h4>
              <p className="mb-6 text-sm text-slate-500">
                Replace expensive physical labs with scalable virtual centers.
                Track student progress with enterprise-grade dashboards.
              </p>
              <a
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
                href="#"
              >
                Learn about licensing
              </a>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-10">
              <h4 className="mb-4 text-xl font-semibold">For Surgeons</h4>
              <p className="mb-6 text-sm text-slate-500">
                Practice complex or rare procedures before heading into the OR.
                Maintain peak technical proficiency anywhere.
              </p>
              <a
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
                href="#"
              >
                Explore the library
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary" />
            <span className="font-semibold">MedSim</span>
          </div>
          <div className="flex gap-8 text-xs text-slate-500">
            <a className="transition-colors hover:text-white" href="#">
              Privacy Policy
            </a>
            <a className="transition-colors hover:text-white" href="#">
              Terms of Service
            </a>
            <a className="transition-colors hover:text-white" href="#">
              Contact Support
            </a>
          </div>
          <p className="text-xs text-slate-600">
            © 2024 MedSim Technologies Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
