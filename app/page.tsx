import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <>
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-[#fef9f1]/70 backdrop-blur-md flex justify-between items-center px-8 py-4 max-w-full">
        <div className="text-2xl font-serif italic text-[#3b2f6e]">Rui Machalele</div>
        <div className="hidden md:flex flex-wrap items-center space-x-8 font-serif font-medium tracking-tight">
          <Link className="text-[#7d5700] border-b-2 border-[#7d5700] pb-1 font-bold" href="/">Inicio</Link>
          <Link className="text-[#3b2f6e] hover:text-[#7d5700] transition-colors" href="/about">Sobre Rui</Link>
          <Link className="text-[#3b2f6e] hover:text-[#7d5700] transition-colors" href="/funnel">Metodología</Link>
          <Link className="text-[#3b2f6e] hover:text-[#7d5700] transition-colors" href="/landing_page">Programa</Link>
          <Link className="text-[#3b2f6e] hover:text-[#7d5700] transition-colors" href="/sales_page">Eventos</Link>
        </div>
        <Link href="/landing_page" className="bg-primary-container text-on-primary px-6 py-2.5 rounded-full font-medium text-sm hover:opacity-80 transition-all duration-300">
          Unirme al programa
        </Link>
      </nav>
      <main className="">
        {/* Hero Section */}
        <section className="relative min-h-[921px] flex items-center px-8 md:px-16 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center w-full max-w-7xl mx-auto">
            <div className="md:col-span-7 z-10">
              <span className="inline-block text-secondary font-medium tracking-[0.2em] uppercase text-xs mb-6">El Oráculo Moderno</span>
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-primary-container leading-[1.1] mb-8">
                La expansión de tu mente <br /> <span className="italic font-normal">comienza en el silencio.</span>
              </h1>
              <p className="text-lg md:text-xl text-on-surface-variant max-w-xl mb-10 leading-relaxed">
                Trasciende los límites de la percepción convencional. Facilitamos el camino hacia una conciencia expandida a través de la integración de sabiduría ancestral y psicología profunda.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/landing_page" className="bg-primary-container text-on-primary px-8 py-4 rounded-full font-semibold flex items-center gap-3 hover:scale-95 duration-200 shadow-xl shadow-primary/10">
                  Quiero expandir mi mente
                  <span className="material-symbols-outlined" data-icon="north_east">north_east</span>
                </Link>
              </div>
            </div>
            <div className="md:col-span-5 relative">
              <div className="aspect-[4/5] rounded-[2rem] overflow-hidden bg-surface-container-high relative group">
                <img alt="Abstract Transformation Image" className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 transition-all duration-700" data-alt="abstract architectural geometry with light and shadow interplay on minimalist concrete surfaces creating a sense of transcendence and space" src="/rui.webp" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent"></div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl"></div>
              </div>
              {/* Decorative element */}
              <div className="absolute -top-6 -left-6 border border-outline-variant/30 w-32 h-32 rounded-full flex items-center justify-center p-4">
                <div className="w-full h-full border border-secondary/40 rounded-full animate-spin-slow"></div>
              </div>
            </div>
          </div>
        </section>
        {/* Mission Section */}
        <section className="py-24 bg-surface-container-low px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-secondary font-serif italic text-2xl mb-8">Mi misión</h2>
            <p className="text-3xl md:text-4xl font-serif text-primary-container leading-snug">
              &quot;Acompañar a las almas buscadoras a reclamar su <span className="italic">autoridad interna</span>, sanando los vínculos con lo invisible para manifestar una realidad plenamente consciente.&quot;
            </p>
            <div className="mt-12 w-24 h-[1px] bg-outline-variant/30 mx-auto"></div>
          </div>
        </section>
        {/* Methodology Preview */}
        <section className="py-32 px-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-20 text-center md:text-left">
              <h2 className="text-4xl font-serif font-bold text-primary-container mb-4">Los 4 Pilares del Despertar</h2>
              <p className="text-on-surface-variant max-w-2xl">Un recorrido cartográfico por las dimensiones del ser.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Pillar 1 */}
              <div className="group p-8 bg-surface-container-lowest rounded-2xl hover:bg-primary-container transition-all duration-500 hover:-translate-y-2">
                <span className="material-symbols-outlined text-4xl text-secondary mb-6 group-hover:text-white" data-icon="child_care">child_care</span>
                <h3 className="text-xl font-serif font-bold text-primary-container mb-4 group-hover:text-white">Niño interior</h3>
                <p className="text-sm text-on-surface-variant group-hover:text-white/80 leading-relaxed">
                  Sanando la raíz de nuestra percepción para liberar la creatividad pura y el asombro.
                </p>
              </div>
              {/* Pillar 2 */}
              <div className="group p-8 bg-surface-container-low rounded-2xl hover:bg-primary-container transition-all duration-500 hover:-translate-y-2">
                <span className="material-symbols-outlined text-4xl text-secondary mb-6 group-hover:text-white" data-icon="auto_awesome">auto_awesome</span>
                <h3 className="text-xl font-serif font-bold text-primary-container mb-4 group-hover:text-white">Ángeles caídos</h3>
                <p className="text-sm text-on-surface-variant group-hover:text-white/80 leading-relaxed">
                  Integrando nuestras sombras y los aspectos negados de nuestra propia divinidad.
                </p>
              </div>
              {/* Pillar 3 */}
              <div className="group p-8 bg-surface-container-lowest rounded-2xl hover:bg-primary-container transition-all duration-500 hover:-translate-y-2">
                <span className="material-symbols-outlined text-4xl text-secondary mb-6 group-hover:text-white" data-icon="public">public</span>
                <h3 className="text-xl font-serif font-bold text-primary-container mb-4 group-hover:text-white">Ángeles terrenales</h3>
                <p className="text-sm text-on-surface-variant group-hover:text-white/80 leading-relaxed">
                  Maestría en las relaciones humanas y la manifestación en el plano material.
                </p>
              </div>
              {/* Pillar 4 */}
              <div className="group p-8 bg-surface-container-low rounded-2xl hover:bg-primary-container transition-all duration-500 hover:-translate-y-2">
                <span className="material-symbols-outlined text-4xl text-secondary mb-6 group-hover:text-white" data-icon="history_edu">history_edu</span>
                <h3 className="text-xl font-serif font-bold text-primary-container mb-4 group-hover:text-white">Ángeles ancestrales</h3>
                <p className="text-sm text-on-surface-variant group-hover:text-white/80 leading-relaxed">
                  Honrando el linaje y liberando las memorias que ya no sirven a nuestra evolución.
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* Social Proof */}
        <section className="py-16 bg-surface-container-high overflow-hidden hidden">
          <div className="max-w-7xl mx-auto px-8">
            <p className="text-center text-xs uppercase tracking-widest text-on-surface-variant/60 mb-12">Presencia en Medios y Conferencias</p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-60 grayscale">
              <div className="h-8 w-32 bg-on-surface/20 rounded-full flex items-center justify-center font-bold italic font-serif">Mastermind</div>
              <div className="h-8 w-32 bg-on-surface/20 rounded-full flex items-center justify-center font-bold tracking-tighter">GLOBAL SUMMIT</div>
              <div className="h-8 w-32 bg-on-surface/20 rounded-full flex items-center justify-center font-serif text-xl italic">Espacios</div>
              <div className="h-8 w-32 bg-on-surface/20 rounded-full flex items-center justify-center font-bold">INSIGHTS</div>
            </div>
          </div>
        </section>
        {/* Content Preview (Bento-ish Grid) */}
        <section className="py-32 px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-16">
              <div>
                <h2 className="text-4xl font-serif font-bold text-primary-container mb-4">Últimos contenidos</h2>
                <p className="text-on-surface-variant">Fragmentos de sabiduría para el día a día.</p>
              </div>
              {/* <a className="text-secondary font-medium hover:underline underline-offset-8 transition-all" href="#">Ver todo el archivo</a> */}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Featured Article */}
              <a href="https://youtu.be/cq_aE4kIwAM" target="_blank" className="md:col-span-2 group relative h-96 rounded-3xl overflow-hidden bg-primary">
                <img alt="Blog background" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" data-alt="misty forest at dawn with golden sunlight filtering through old trees creating a mystical and contemplative atmosphere" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqiSWBO51FHvE7Mtnd6RkMYyOkREV732EIdz98_Cip6qMFjFyFqcD8NMfSG_wpwFrUs-VcUTwtJrm4iDUUrvfzQQwdOcibIFMTJIvIds58lrgtLLQrCBUlVOAsgqJK4BKKcRIo8qMzs2teZywA6glMItHxkLNmMfpBdbebvt0F992z6EMQC9-rppAZRAOr0wDLZeHIya2I4YxDaInDsFprWT5FGlxFyDyLQOH3w1rJmsCy-lcXCOgM1VY1swQA-xVKNUK3ckRJF3zu" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/20 to-transparent p-12 flex flex-col justify-end">
                  <span className="text-secondary-fixed text-xs font-bold uppercase tracking-widest mb-4">Mi historia de vida</span>
                  <h3 className="text-3xl font-serif font-bold text-white mb-4">El africano que supo ganarle al mundo</h3>
                  <p className="text-white/80 max-w-md line-clamp-2">Rui Machalele, un africano que al seguir su sueño de estudiar fuera de su continente se enfrento a muchos retos que lo hicieron crecer como persona.</p>
                </div>
              </a>
              {/* Small Card 1 */}
              <div className="bg-surface-container-high rounded-3xl p-8 flex flex-col justify-between hover:bg-surface-container-highest transition-colors group">
                <div>
                  <span className="material-symbols-outlined text-secondary text-3xl mb-6" data-icon="mic">mic</span>
                  <h3 className="text-xl font-serif font-bold text-primary-container mb-4">Inteligencia Emocional en las Empresas</h3>
                </div>
                <div>
                  <p className="text-on-surface-variant text-sm mb-6">La inteligencia emocional es la capacidad de comprender y gestionar las emociones propias y ajenas. En el ámbito empresarial, esta habilidad es fundamental para el éxito, ya que permite a los líderes y empleados comunicarse de manera efectiva, resolver conflictos y construir relaciones sólidas.</p>
                  <a href="https://youtu.be/tp0b9gZ2yFk" target="_blank" className="text-primary font-bold text-xs uppercase tracking-wider flex items-center gap-2 group-hover:gap-4 transition-all">
                    Ver ahora <span className="material-symbols-outlined text-sm" data-icon="play_circle">play_circle</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Testimonials */}
        <section className="py-32 bg-primary text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-secondary/5 blur-[120px]"></div>
          <div className="max-w-7xl mx-auto px-8 relative z-10">
            <div className="flex flex-col md:flex-row gap-16 items-center">
              <div className="md:w-1/3">
                <h2 className="text-5xl font-serif font-bold mb-6">Voces de transformación</h2>
                <p className="text-white/60">Experiencias reales de quienes han cruzado el umbral hacia una nueva forma de ver y estar en el mundo.</p>
                <div className="mt-12 flex gap-4">
                  <button className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined" data-icon="west">west</span>
                  </button>
                  <button className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined" data-icon="east">east</span>
                  </button>
                </div>
              </div>
              <div className="md:w-2/3">
                <div className="bg-white/5 backdrop-blur-xl p-12 rounded-[2.5rem] border border-white/10">
                  <span className="material-symbols-outlined text-secondary text-5xl mb-8" data-icon="format_quote">format_quote</span>
                  <p className="text-2xl font-serif italic mb-10 leading-relaxed">
                    &quot;Trabajar con Rui no fue solo una terapia o un curso; fue una reestructuración completa de cómo entendía mi propósito. Los 4 pilares me dieron un mapa donde antes solo había confusión.&quot;
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-surface-container-high overflow-hidden">
                      <img alt="Elena" className="w-full h-full object-cover" data-alt="portrait of a professional woman with a calm and confident expression in soft natural lighting" src="avatar.png" />
                    </div>
                    <div>
                      <p className="font-bold">Elena Rivas</p>
                      <p className="text-xs text-white/40 uppercase tracking-widest">Fundadora de Gaia Collective</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Final CTA */}
        <section className="py-32 px-8">
          <div className="max-w-5xl mx-auto rounded-[3rem] bg-secondary-container p-12 md:p-24 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-on-secondary-container mb-8">¿Estás listo para el <br /> siguiente plano?</h2>
              <p className="text-on-secondary-container/80 text-xl max-w-2xl mx-auto mb-12">
                Las inscripciones para la próxima cohorte del Programa de Expansión Mental están abiertas. Un viaje de 6 meses hacia tu verdadera esencia.
              </p>
              <Link href="/landing_page" className="bg-primary-container text-on-primary px-10 py-5 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-2xl inline-block">
                Comenzar mi viaje ahora
              </Link>
              <p className="mt-8 text-on-secondary-container/60 text-sm font-medium">Plazas limitadas por ciclo para asegurar atención personalizada.</p>
            </div>
          </div>
        </section>
      </main>
      {/* Footer */}
      <footer className="bg-[#ece8e0] text-[#3b2f6e] w-full rounded-t-none">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-12 py-20 max-w-7xl mx-auto font-sans leading-relaxed tracking-wide">
          <div className="md:col-span-2">
            <div className="text-3xl font-serif text-[#3b2f6e] mb-4">Rui Machalele</div>
            <p className="max-w-sm text-[#3b2f6e]/80 mb-8">Facilitador de procesos de expansión de consciencia e integración humana. El puente entre lo ancestral y lo moderno.</p>
            <div className="flex gap-4">
              <a className="w-10 h-10 rounded-full border border-primary/20 flex items-center justify-center hover:bg-primary hover:text-white transition-all" href="#"><span className="material-symbols-outlined text-sm" data-icon="share">share</span></a>
              <a className="w-10 h-10 rounded-full border border-primary/20 flex items-center justify-center hover:bg-primary hover:text-white transition-all" href="#"><span className="material-symbols-outlined text-sm" data-icon="mail">mail</span></a>
            </div>
          </div>
          <div>
            <h4 className="font-serif font-bold text-lg mb-6">Navegación</h4>
            <ul className="space-y-4">
              <li><Link className="text-[#3b2f6e]/80 hover:text-[#7d5700] transition-all" href="/funnel">Metodología</Link></li>
              <li><Link className="text-[#3b2f6e]/80 hover:text-[#7d5700] transition-all" href="/landing_page">Programas</Link></li>
              <li><Link className="text-[#3b2f6e]/80 hover:text-[#7d5700] transition-all" href="/sales_page">Eventos Próximos</Link></li>
              <li><Link className="text-[#3b2f6e]/80 hover:text-[#7d5700] transition-all" href="/">Blog de Sabiduría</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif font-bold text-lg mb-6">Legal</h4>
            <ul className="space-y-4">
              <li><a className="text-[#3b2f6e]/80 hover:text-[#7d5700] transition-all" href="#">Privacidad</a></li>
              <li><a className="text-[#3b2f6e]/80 hover:text-[#7d5700] transition-all" href="#">Términos</a></li>
              <li><a className="text-[#3b2f6e]/80 hover:text-[#7d5700] transition-all" href="#">Cookies</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-12 py-8 border-t border-primary/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[#3b2f6e]/60">© 2026 Rui Machalele.</p>
          <p className="text-xs italic">Diseñado para la expansión.</p>
        </div>
      </footer>
    </>
  );
}
