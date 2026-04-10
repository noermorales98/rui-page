import Link from "next/link";
import Image from "next/image";

export default function Funnel() {
  return (
    <>
      {/* Top Navigation (Logo Only) */}
      <nav className="glass-header sticky top-0 z-50 w-full px-8 py-6">
        <div className="max-w-7xl mx-auto flex justify-center items-center">
          <Link href="/" className="text-2xl font-bold font-headline italic text-primary">Ángeles Terrenales</Link>
        </div>
      </nav>

      {/* Hero / Squeeze Section */}
      <main className="relative overflow-hidden pt-12 pb-24 px-4 sm:px-8">
        {/* Abstract Decorative Elements */}
        <div className="absolute top-0 left-[-10%] w-[500px] h-[500px] bg-tertiary-fixed-dim/5 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute bottom-0 right-[-5%] w-[400px] h-[400px] bg-secondary-container/10 rounded-full blur-[80px] -z-10"></div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Left Content: Copy */}
          <div className="lg:col-span-7 space-y-8 lg:pr-12">
            <div className="inline-block px-4 py-1.5 bg-surface-container-high rounded-full">
              <span className="text-[10px] uppercase tracking-widest font-semibold font-label text-primary-container">Diagnóstico Gratuito</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-headline font-bold text-primary-container leading-[1.1] tracking-tight">
              Descubre qué pilar de tu conciencia está bloqueando tu verdadera expansión
            </h1>
            <p className="text-xl text-on-surface-variant leading-relaxed max-w-2xl font-body">
              Realiza este diagnóstico gratuito de 3 minutos y recibe tu hoja de ruta personalizada para entender tus 4 guardianes mentales.
            </p>

            {/* Benefits Bento-lite */}
            <div className="space-y-6 pt-4">
              <div className="flex items-start gap-4 group">
                <div className="mt-1 w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-[16px] text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>colors_spark</span>
                </div>
                <p className="text-lg font-medium text-primary">Identifica el origen de tu estancamiento actual.</p>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="mt-1 w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-[16px] text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>visibility</span>
                </div>
                <p className="text-lg font-medium text-primary">Diferencia entre bloqueos externos e internos.</p>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="mt-1 w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-[16px] text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>navigation</span>
                </div>
                <p className="text-lg font-medium text-primary">Pasos inmediatos para tu primera semana de despertar.</p>
              </div>
            </div>
          </div>

          {/* Right Content: Form & Visual */}
          <div className="lg:col-span-5 relative">
            {/* Image/Visual Placeholder */}
            <div className="absolute -top-12 -right-12 w-32 h-32 opacity-20 pointer-events-none">
              <img alt="Decorative" className="w-full h-full object-contain" data-alt="Abstract translucent sphere with crystalline refractions and soft golden light beams passing through it" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHfBCnTSz88I82I0ip7r3YskoiARa21kGomA4amS54zVySGbknq86z97rpBmYD6N1qjNf6oJLKc56gWrUhtSWxrJ95VsVTNDkefGNl1kMw3mE5vlhzz1sVz0olIn8MRdI9lQ9DaTF4a2GdiBzrUTMQFoa3liS1wX63nDys5MuGVh-LEgO_gCCU-25bEUQhyQDZ-hG60cUqulubyMJcUlkiZfszlH1dI7DBgpZKb1Y3-1TwZSyz5Iyn2ToA2RcSpXLctFPbnd6gcA7S" />
            </div>

            {/* Opt-in Card */}
            <div className="bg-surface-container-lowest p-8 lg:p-10 rounded-[2rem] editorial-shadow border border-outline-variant/15 relative z-10">
              <h3 className="text-2xl font-headline font-semibold text-primary mb-2 text-center">Acceso Inmediato</h3>
              <p className="text-sm text-on-surface-variant text-center mb-8">Únete a más de 5,000 buscadores en su camino de expansión.</p>

              <form action="/thanks" className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-semibold font-label text-outline ml-1" htmlFor="name">Tu Nombre</label>
                  <input className="w-full bg-transparent border-0 border-b border-outline-variant/40 focus:ring-0 focus:border-secondary text-primary py-3 px-1 transition-all duration-300 placeholder:text-outline/40 outline-none" id="name" name="name" placeholder="Escribe tu nombre..." type="text" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-semibold font-label text-outline ml-1" htmlFor="email">Tu Email Principal</label>
                  <input className="w-full bg-transparent border-0 border-b border-outline-variant/40 focus:ring-0 focus:border-secondary text-primary py-3 px-1 transition-all duration-300 placeholder:text-outline/40 outline-none" id="email" name="email" placeholder="hola@tuuniverso.com" type="email" />
                </div>
                <button className="w-full py-5 bg-secondary-container hover:bg-[#FDC664] text-on-secondary-container font-semibold rounded-xl text-lg transition-all duration-300 active:scale-95 shadow-sm hover:shadow-md flex items-center justify-center gap-3 mt-4" type="submit">
                  Obtener mi Mapa de Expansión
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </form>

              <p className="mt-6 text-[10px] text-outline text-center leading-relaxed">
                Respetamos tu privacidad. Recibirás el mapa y contenido exclusivo editorial. Puedes darte de baja en cualquier momento.
              </p>
            </div>

            {/* Floating Accent Decoration */}
            <div className="mt-12 overflow-hidden rounded-2xl aspect-[16/9] lg:aspect-square editorial-shadow">
              <img className="w-full h-full object-cover grayscale-[0.3] sepia-[0.1]" data-alt="Atmospheric abstract art showing layered silhouettes of faces in ethereal light with golden geometric arcs and grain texture" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyaB72PgEeMl4EnUf_6PxWJSHD2gk0ro3Ha78xvhTdBlB7I5rb-45CbOnImHT2Rl9pLpY9kUFXi4ZMibwXTFfnkpuI82SuZ9utZbX4OYJTjDZ8JyKdoq3qTZSLSszSIBPLXskZEID1yv-gYzpzuZ1c2qO-IeQjNK79XWZR7Q-0pEfmNnnproDAaQcKiRtDGeKT3eNMT1Rp5dPuNAVA1Qlqgn9IPaltIRLee968bc5z2IUuNarWHLSdK8NEkFB0CQ9jdEwYV8qzHwKl" />
            </div>
          </div>
        </div>
      </main>

      {/* Social Proof / Trust Section (Minimal) */}
      <section className="py-12 bg-surface-container-low border-t border-primary/5 hidden">
        <div className="max-w-4xl mx-auto text-center px-4">
          <span className="text-[10px] uppercase tracking-widest font-semibold font-label text-outline/60 block mb-6">Presentado en publicaciones de consciencia</span>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale contrast-125">
            <span className="font-headline italic text-xl">Lumina Magazine</span>
            <span className="font-headline italic text-xl">Aura Daily</span>
            <span className="font-headline italic text-xl">The Soul Collective</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col items-center gap-8 py-12 w-full px-4 border-t border-[#3B2F6E]/10 bg-surface-container-low">
        <div className="flex gap-8">
          <a className="text-[10px] uppercase tracking-widest font-semibold font-label text-primary/50 hover:text-primary transition-all underline underline-offset-4" href="#">Privacy Policy</a>
          <a className="text-[10px] uppercase tracking-widest font-semibold font-label text-primary/50 hover:text-primary transition-all underline underline-offset-4" href="#">Terms of Service</a>
          <a className="text-[10px] uppercase tracking-widest font-semibold font-label text-primary/50 hover:text-primary transition-all underline underline-offset-4" href="#">Contact</a>
        </div>
        <p className="text-[10px] uppercase tracking-widest font-semibold font-label text-primary">© 2026 Ángeles Terrenales. All rights reserved.</p>
      </footer>
    </>
  );
}
