import Link from "next/link";
import Image from "next/image";

export default function About() {
  return (
    <>
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 glass-header flex justify-between items-center px-8 py-4 max-w-full">
        <div className="text-2xl font-headline italic text-primary-container">Rui Machalele</div>
        <div className="hidden md:flex flex-wrap items-center space-x-8">
          <Link className="text-primary-container hover:text-secondary transition-colors font-body font-medium tracking-tight" href="/">Inicio</Link>
          <Link className="text-secondary border-b-2 border-secondary pb-1 font-bold font-body tracking-tight" href="/about">Sobre Rui</Link>
          <Link className="text-primary-container hover:text-secondary transition-colors font-body font-medium tracking-tight" href="/funnel">Metodología</Link>
          <Link className="text-primary-container hover:text-secondary transition-colors font-body font-medium tracking-tight" href="/landing_page">Programa</Link>
          <Link className="text-primary-container hover:text-secondary transition-colors font-body font-medium tracking-tight" href="/sales_page">Eventos</Link>
        </div>
        <button className="bg-primary-container text-on-primary px-6 py-2.5 rounded-full font-medium hover:opacity-80 transition-all duration-300 scale-95 hover:scale-100">
          Unirme al programa
        </button>
      </nav>

      <main className="pt-18 overflow-hidden">
        {/* Hero: Emotional Narrative */}
        <section className="relative px-8 md:px-24 py-20 lg:py-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 z-10">
            <span className="inline-block text-secondary font-label font-bold tracking-widest text-xs uppercase mb-6">EL ORIGEN DEL CAMINO</span>
            <h1 className="text-5xl lg:text-7xl font-headline font-bold text-primary-container leading-tight tracking-tight mb-8">
              La quietud nace en medio de la <span className="italic font-normal">tormenta</span>.
            </h1>
            <div className="max-w-xl space-y-6 text-lg text-on-surface-variant leading-relaxed font-light">
              <p>Mi historia no comienza en un retiro silencioso en las montañas, sino en el estruendo de un colapso personal que lo cambió todo. Hubo un tiempo donde el éxito era una moneda ruidosa, y mi identidad estaba fragmentada entre lo que el mundo esperaba y lo que mi alma gritaba.</p>
              <p className="italic text-primary-container font-headline text-2xl py-4 border-l-2 border-secondary-fixed-dim pl-8">&quot;Entendí que para expandir la mente, primero hay que aprender a habitar el vacío con valentía.&quot;</p>
              <p>Este es el Marco Emocional sobre el que construí mi vida: la vulnerabilidad como la herramienta de navegación más potente que poseemos.</p>
            </div>
          </div>
          <div className="lg:col-span-5 relative">
            <div className="aspect-[4/5] rounded-xl overflow-hidden editorial-shadow bg-surface-container-low">
              <img className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" data-alt="Close-up portrait of Rui Machalele with a serene expression, soft natural lighting in a foggy mountain forest setting, cinematic editorial style" src="/rui2.webp" />
            </div>
            <div className="absolute -bottom-8 -left-8 bg-surface-container-lowest p-8 rounded-xl editorial-shadow hidden md:block max-w-[280px]">
              <p className="text-xs font-label uppercase tracking-tighter text-secondary mb-2">Filosofía de Vida</p>
              <p className="font-headline italic text-primary-container">&quot;No buscamos la perfección, buscamos la integración de nuestras sombras.&quot;</p>
            </div>
          </div>
        </section>

        {/* Transformation Section */}
        <section className="bg-surface-container-low py-24 px-8 md:px-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="order-2 lg:order-1">
                <div className="relative">
                  <img className="rounded-xl w-full aspect-video lg:aspect-square object-cover editorial-shadow" data-alt="Wide shot of a person sitting on a cliff overlooking a vast ocean at sunrise, warm golden tones, atmospheric mist, minimalist composition" src="conferencia2.webp" />
                  <div className="absolute inset-0 bg-primary/20 rounded-xl mix-blend-multiply"></div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="text-4xl lg:text-5xl font-headline font-bold text-primary-container mb-8">De la Crisis a la Claridad</h2>
                <div className="space-y-6 text-on-surface-variant leading-relaxed">
                  <p>Nací en Mozambique y crecí creyendo que la vida podía ser más grande que cualquier etiqueta. Ese sueño me llevó a cruzar fronteras, estudiar fuera de África y, finalmente, a renacer en México, donde descubrí mi propósito: servir a las personas a través de la  <span className="font-bold text-primary-container">Educación Emocional y el Liderazgo</span>.</p>
                  <p>Hoy, como conferencista internacional, uso mi historia de rechazo, resiliencia y fe para acompañar a personas y organizaciones a gestionar sus emociones, superar límites y construir una vida con propósito real.</p>
                  <div className="pt-8 grid grid-cols-2 gap-8 border-t border-outline-variant/20">
                    <div>
                      <div className="text-3xl font-headline text-secondary mb-1">2018</div>
                      <div className="text-xs uppercase tracking-widest font-bold">El Gran Giro</div>
                    </div>
                    <div>
                      <div className="text-3xl font-headline text-secondary mb-1">5.000+</div>
                      <div className="text-xs uppercase tracking-widest font-bold">Vidas Impactadas</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values & Philosophy: Bento Style */}
        <section className="py-32 px-8 md:px-24">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl lg:text-6xl font-headline font-bold text-primary-container">Pilares del Oráculo</h2>
              <p className="mt-4 text-on-surface-variant font-light">Principios que rigen nuestra visión del mundo.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
              <div className="md:col-span-2 bg-primary-container rounded-xl p-12 text-on-primary flex flex-col justify-end relative overflow-hidden">
                <div className="relative z-10">
                  <span className="material-symbols-outlined text-4xl mb-6 text-secondary-fixed-dim">auto_awesome</span>
                  <h3 className="text-3xl font-headline mb-4">Sabiduría Ancestral, Lógica Moderna</h3>
                  <p className="max-w-md font-light text-on-primary-container">Combinamos la profundidad de las tradiciones milenarias con la precisión de la neurociencia contemporánea.</p>
                </div>
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'FILL' 1" }}>adjust</span>
                </div>
              </div>
              <div className="bg-surface-container-high rounded-xl p-10 flex flex-col justify-center border-l-4 border-secondary">
                <h3 className="text-2xl font-headline text-primary-container mb-4">Expansión Radical</h3>
                <p className="text-sm leading-relaxed text-on-surface-variant">No creemos en el crecimiento lineal. Buscamos saltos cuánticos en la consciencia a través de la introspección profunda.</p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-10 flex flex-col justify-between group hover:bg-surface-container-highest transition-colors duration-500">
                <span className="material-symbols-outlined text-secondary text-3xl">psychology</span>
                <div>
                  <h3 className="text-2xl font-headline text-primary-container mb-2">Ecuanimidad</h3>
                  <p className="text-sm text-on-surface-variant">Mantener el centro en el caos es nuestra mayor ventaja competitiva y espiritual.</p>
                </div>
              </div>
              <div className="md:col-span-2 bg-[#ece8e0] rounded-xl overflow-hidden relative group">
                <img className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-40" data-alt="Abstract art with flowing golden lines and deep indigo textures, representing mental connectivity and fluid thought, elegant and artistic" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSxNp5dLI9aKQi1sIx7fh4hygYILVQyMlkXTym3tClnT1qjCtUBqO399IHX6sLxQay3kBhKlOELCyC4W9cfKUaO4vCCT51Vv3rq6_xEN0t_THM_WyZoB3yCLROgd6lvNRdUzuYK70WF2hMvJq8vZehuQCXD-Ugh_pDHYbotToPOcxLpfS1esplhtlk40SWHSLl5ppm1bVsai261yl8eFh3nu0k80sxhdAhgFUuJTKF9-wg27FmzRftgqaTKf9ENZ2Az_RA0vH68mHT" />
                <div className="relative p-12 h-full flex flex-col justify-center">
                  <h3 className="text-3xl font-headline text-primary-container mb-4 italic">El Futuro es Consciente</h3>
                  <p className="max-w-lg text-on-surface-variant leading-relaxed">Nuestra visión es crear un santuario digital donde la inteligencia no sea solo capacidad de proceso, sino profundidad de sentir.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Accomplishments & Timeline */}
        <section className="bg-surface-container-highest py-32 px-8 md:px-24 hidden">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-headline font-bold text-primary-container mb-16 flex items-center gap-4">
              <span className="h-px w-12 bg-secondary"></span>
              Hitos del Recorrido
            </h2>
            <div className="space-y-16">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="text-secondary font-bold font-label text-xl shrink-0 pt-1">2023</div>
                <div>
                  <h3 className="text-2xl font-headline text-primary-container mb-2">Publicación: &quot;El Silencio Estratégico&quot;</h3>
                  <p className="text-on-surface-variant font-light leading-relaxed">Bestseller en desarrollo personal, explorando cómo la pausa es el motor de la creatividad de alto impacto.</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="text-secondary font-bold font-label text-xl shrink-0 pt-1">2021</div>
                <div>
                  <h3 className="text-2xl font-headline text-primary-container mb-2">Fundación de la Academia Oráculo</h3>
                  <p className="text-on-surface-variant font-light leading-relaxed">Un espacio de formación para líderes que buscan una gestión basada en la consciencia y la ética humanista.</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="text-secondary font-bold font-label text-xl shrink-0 pt-1">2019</div>
                <div>
                  <h3 className="text-2xl font-headline text-primary-container mb-2">TEDx Talk: La Geometría del Pensamiento</h3>
                  <p className="text-on-surface-variant font-light leading-relaxed">Presentación de la primera versión de la metodología de expansión mental ante una audiencia global.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-high text-primary-container w-full rounded-t-none">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-12 py-20 max-w-7xl mx-auto font-body leading-relaxed tracking-wide">
          <div className="md:col-span-2">
            <div className="text-3xl font-headline text-primary-container mb-4">Rui Machalele</div>
            <p className="max-w-sm text-on-surface-variant italic mb-8">&quot;Tu mente es el archivo de tu destino. Aprende a leerlo.&quot;</p>
            <div className="flex gap-4">
              <a className="w-10 h-10 rounded-full bg-surface flex items-center justify-center hover:text-secondary transition-all" href="#">
                <span className="material-symbols-outlined text-lg">share</span>
              </a>
              <a className="w-10 h-10 rounded-full bg-surface flex items-center justify-center hover:text-secondary transition-all" href="#">
                <span className="material-symbols-outlined text-lg">mail</span>
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-widest mb-6 text-secondary">Explorar</h4>
            <ul className="space-y-4">
              <li><Link className="text-primary-container/80 hover:text-secondary transition-all" href="/funnel">Metodología</Link></li>
              <li><Link className="text-primary-container/80 hover:text-secondary transition-all" href="/landing_page">Programas Activos</Link></li>
              <li><Link className="text-primary-container/80 hover:text-secondary transition-all" href="#">Podcast</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-widest mb-6 text-secondary">Legal</h4>
            <ul className="space-y-4">
              <li><a className="text-primary-container/80 hover:text-secondary transition-all" href="#">Privacidad</a></li>
              <li><a className="text-primary-container/80 hover:text-secondary transition-all" href="#">Términos</a></li>
              <li><a className="text-primary-container/80 hover:text-secondary transition-all" href="#">Cookies</a></li>
            </ul>
          </div>
        </div>
        <div className="px-12 py-8 border-t border-outline-variant/20 flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto">
          <p className="text-sm text-on-surface-variant">© 2026 Rui Machalele.</p>
          <div className="flex flex-wrap gap-8 mt-4 md:mt-0">
            <span className="text-xs font-label uppercase tracking-widest text-primary-container/40">Londres — Madrid — El Mundo</span>
          </div>
        </div>
      </footer>
    </>
  );
}
