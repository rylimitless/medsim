"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import InstructionsModal from "./components/InstructionsModal";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleLaunchClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleFinish = () => {
    setIsModalOpen(false);
    router.push("/model");
  };
  return (
    <div
      className="relative min-h-screen overflow-x-hidden font-display text-slate-900 dark:text-slate-100 selection:bg-primary/30"
      style={{ backgroundColor: "#1a1d23" }}
    >
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-background-dark/80 backdrop-blur-md">
        <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl">
                deployed_code
              </span>
            </div>
            <span className="text-xl font-bold tracking-tight">MedSim</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a
              className="text-sm font-medium hover:text-primary transition-colors"
              href="#"
            >
              How It Works
            </a>
            <a
              className="text-sm font-medium hover:text-primary transition-colors"
              href="#"
            >
              Features
            </a>
            <a
              className="text-sm font-medium hover:text-primary transition-colors"
              href="#"
            >
              Who is It For
            </a>
          </div>
          {/*<Link
            href="/model"
            className="px-6 py-2 rounded-full border border-[#4682b4] text-white btn-blue hover:brightness-110 transition-all text-sm font-bold"
          >
            Launch Experience
          </Link>*/}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pb-20 px-6 overflow-hidden pt-32">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full -mr-40 -mt-20"></div>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="z-10 lg:pl-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Next Gen Training
              </span>
            </div>
            <h1 className="text-7xl md:text-8xl font-serif font-bold mb-6 heading-green italic leading-tight">
              MedSim
            </h1>
            <p className="font-display text-xl md:text-2xl text-slate-400 font-light max-w-lg leading-relaxed mb-6">
              World-class surgical training.{" "}
              <span className="text-white">No lab required.</span>
            </p>
            <p className="font-display text-sm md:text-base text-slate-500 font-light max-w-lg leading-relaxed mb-10">
              According to the Journal of Surgical Research, surgical training
              can require expensive simulation labs often costing upwards of
              $300,000, leaving many medical students with few opportunities to
              safely practice procedures before operating on real patients.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleLaunchClick}
                className="bg-[#4682b4] text-white px-8 py-4 rounded-full font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 border border-[#4682b4]"
              >
                <span>Launch Experience</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
          <div className="relative aspect-square">
            <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent z-10 lg:pl-12"></div>
            <div className="w-full h-full rounded-3xl overflow-hidden glass-card glow-border">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage:
                    'url("https://cdn-ikphhfh.nitrocdn.com/ZLMLGDaEaySMbrIZeaewzBWupKGZvuun/assets/images/optimized/rev-86a6276/www.3dorganon.com/wp-content/uploads/2025/12/AI_Digestive_stage_5.4.webp")',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="px-6 bg-slate-950/50 py-16">
        <div className="max-w-5xl mx-auto text-center">
          <span className="material-symbols-outlined text-primary mb-8 text-3xl">
            emergency_home
          </span>
          <h2 className="font-serif font-bold leading-tight text-slate-100 text-2xl md:text-4xl">
            Immersive 3D anatomy and AI-powered surgical simulation,{" "}
            <span className="heading-green">
              built for the next generation of physicians.
            </span>{" "}
            <span className="text-slate-500">
              Train smarter, prepare better, perform with confidence.
            </span>
          </h2>
        </div>
      </section>

      {/* Key Features */}
      <section className="px-6 bg-slate-900/20 py-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="grid grid-cols-2 gap-6">
              <div className="glass-card p-8 rounded-2xl">
                <span className="material-symbols-outlined text-primary mb-4">
                  psychology
                </span>
                <h5 className="font-bold mb-2">1. Study Mode</h5>
                <p className="text-xs text-slate-500">
                  Enter study mode and explore a 3D brain.
                </p>
              </div>
              <div className="glass-card p-8 rounded-2xl mt-8">
                <span className="material-symbols-outlined text-primary mb-4">
                  mic_external_on
                </span>
                <h5 className="font-bold mb-2">2. AI Exploration</h5>
                <p className="text-xs text-slate-500">
                  Select any structure and ask the AI questions by voice.
                </p>
              </div>
              <div className="glass-card p-8 rounded-2xl -mt-8">
                <span className="material-symbols-outlined text-primary mb-4">
                  surgery
                </span>
                <h5 className="font-bold mb-2">3. Simulate</h5>
                <p className="text-xs text-slate-500">
                  Simulate complex surgical procedures.
                </p>
              </div>
              <div className="glass-card p-8 rounded-2xl">
                <span className="material-symbols-outlined text-primary mb-4">
                  insights
                </span>
                <h5 className="font-bold mb-2">4. AI Feedback</h5>
                <p className="text-xs text-slate-500">
                  Get instant AI feedback on your performance.
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-primary mb-4">
                Capabilities
              </h3>
              <h2 className="font-serif font-bold mb-8 heading-green text-6xl">
                Key Features
              </h2>
              <ul>
                <li className="flex items-center gap-3 text-slate-200">
                  <span className="material-symbols-outlined text-primary">
                    check_circle
                  </span>
                  <span>3D anatomical exploration</span>
                </li>
                <li className="flex items-center gap-3 text-slate-200">
                  <span className="material-symbols-outlined text-primary">
                    check_circle
                  </span>
                  <span>Voice-activated AI</span>
                </li>
                <li className="flex items-center gap-3 text-slate-200">
                  <span className="material-symbols-outlined text-primary">
                    check_circle
                  </span>
                  <span>Surgical simulation</span>
                </li>
                <li className="flex items-center gap-3 text-slate-200">
                  <span className="material-symbols-outlined text-primary">
                    check_circle
                  </span>
                  <span>Accessible on any browser</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-serif font-bold heading-green mb-6">
              Built for the Future of Medicine
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              From students to seasoned professionals, MedSim scales to the
              needs of the entire medical community.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="relative overflow-hidden rounded-3xl glass-card p-12 group hover:bg-white/5 transition-all">
              <div className="absolute top-0 right-0 p-8">
                <span className="material-symbols-outlined text-primary/30 text-8xl group-hover:text-primary transition-colors">
                  school
                </span>
              </div>
              <h4 className="text-3xl font-bold mb-6 heading-green">
                For Institutions
              </h4>
              <p className="text-slate-400 text-lg mb-8 max-w-sm">
                Replace expensive physical labs with scalable virtual centers.
                Track student progress with enterprise-grade dashboards.
              </p>
              <a
                className="inline-flex items-center gap-2 text-primary font-bold"
                href="#"
              >
                Learn about licensing{" "}
                <span className="material-symbols-outlined">chevron_right</span>
              </a>
            </div>
            <div className="relative overflow-hidden rounded-3xl glass-card p-12 group hover:bg-white/5 transition-all">
              <div className="absolute top-0 right-0 p-8">
                <span className="material-symbols-outlined text-primary/30 text-8xl group-hover:text-primary transition-colors">
                  medical_services
                </span>
              </div>
              <h4 className="text-3xl font-bold mb-6 heading-green">
                For Surgeons
              </h4>
              <p className="text-slate-400 text-lg mb-8 max-w-sm">
                Practice complex or rare procedures before heading into the OR.
                Maintain peak technical proficiency anywhere.
              </p>
              <a
                className="inline-flex items-center gap-2 text-primary font-bold"
                href="#"
              >
                Explore the library{" "}
                <span className="material-symbols-outlined">chevron_right</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xs">
                deployed_code
              </span>
            </div>
            <span className="font-bold">MedSim</span>
          </div>
          <div className="flex gap-10 text-slate-500 text-sm">
            <a className="hover:text-white transition-colors" href="#">
              Privacy Policy
            </a>
            <a className="hover:text-white transition-colors" href="#">
              Terms of Service
            </a>
            <a className="hover:text-white transition-colors" href="#">
              Contact Support
            </a>
          </div>
          <p className="text-slate-600 text-xs">
            © 2024 MedSim Technologies Inc. All rights reserved.
          </p>
        </div>
      </footer>

      <InstructionsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onFinish={handleFinish}
      />
    </div>
  );
}
