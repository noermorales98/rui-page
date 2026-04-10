import Link from "next/link";
import Image from "next/image";

export default function SalesPage() {
  return (
    <>
      {/* TopNavBar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#fef9f1]/70 backdrop-blur-xl transition-all duration-300">
        <div className="flex justify-between items-center w-full px-8 py-6 max-w-7xl mx-auto">
          <Link className="text-2xl font-bold font-['Playfair_Display'] italic text-[#251857]" href="/">Ángeles Terrenales</Link>
          <div className="hidden md:flex gap-12 items-center">
            <a className="font-['Playfair_Display'] text-lg font-semibold tracking-tight text-[#251857]/60 hover:text-[#251857] transition-colors" href="#curriculum">Curriculum</a>
            <a className="font-['Playfair_Display'] text-lg font-semibold tracking-tight text-[#251857]/60 hover:text-[#251857] transition-colors" href="#metodologia">Methodology</a>
            <a className="px-8 py-3 bg-primary text-on-primary rounded-xl font-semibold hover:bg-primary-container transition-all scale-95 active:scale-90" href="#enroll">Enroll</a>
          </div>
          <button className="md:hidden text-primary">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </nav>

      <main className="pt-18">
        {/* Hero Section */}
        <section className="relative min-h-[921px] flex items-center px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
            <div className="order-2 md:order-1">
              <span className="inline-block px-4 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold tracking-widest uppercase mb-6">PROGRAMA DE EXPANSIÓN MENTAL</span>
              <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary leading-tight mb-8">
                Trasciende los <br /><span className="italic font-light">límites de tu psique.</span>
              </h1>
              <p className="text-xl text-on-surface-variant max-w-lg mb-12 leading-relaxed">
                Un viaje de 5 semanas diseñado por Rui Machalele para desmantelar estructuras invisibles y habitar una nueva realidad de claridad y propósito.
              </p>
              <div className="flex flex-col sm:flex-row gap-6">
                <a className="inline-flex items-center justify-center px-10 py-5 bg-secondary text-on-secondary rounded-xl text-lg font-bold editorial-shadow hover:bg-on-secondary-container transition-all" href="#enroll">
                  Inscribirme al Programa
                </a>
                <a className="inline-flex items-center justify-center px-10 py-5 text-primary font-bold hover:bg-surface-container-low rounded-xl transition-all" href="#metodologia">
                  Ver Metodología
                </a>
              </div>
            </div>
            <div className="order-1 md:order-2 relative">
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-tertiary-fixed-dim/20 rounded-full blur-3xl"></div>
              <div className="relative z-10 rounded-3xl overflow-hidden editorial-shadow transform rotate-2">
                <img alt="Expansion portrait" className="w-full aspect-[4/5] object-cover" data-alt="abstract artistic portrait of a person with eyes closed, soft golden light hitting face, ethereal atmosphere with subtle double exposure of stars" src="rui2.webp" />
              </div>
              <div className="absolute -bottom-8 -left-8 p-8 bg-surface-container-lowest editorial-shadow rounded-2xl max-w-xs transform -rotate-2">
                <p className="font-headline text-lg italic text-primary">&quot;La expansión no es una meta, es la eliminación de lo que nos contrae.&quot;</p>
                <p className="text-xs font-bold mt-4 tracking-tighter">— Rui Machalele</p>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Agitation */}
        <section className="py-32 bg-surface-container-low px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-headline text-4xl md:text-5xl font-semibold text-primary mb-12 italic">El peso de lo invisible</h2>
            <div className="grid gap-8 md:grid-cols-2 text-left">
              <div className="p-8 bg-surface rounded-xl">
                <span className="material-symbols-outlined text-4xl text-primary mb-6">psychology</span>
                <h3 className="font-headline text-2xl font-bold text-primary mb-4">Inercia Cognitiva</h3>
                <p className="text-on-surface-variant leading-relaxed">Sientes que, aunque trabajas duro, tus resultados están limitados por un techo de cristal invisible que tú mismo has construido.</p>
              </div>
              <div className="p-8 bg-surface rounded-xl">
                <span className="material-symbols-outlined text-4xl text-primary mb-6">visibility_off</span>
                <h3 className="font-headline text-2xl font-bold text-primary mb-4">Puntos Ciegos</h3>
                <p className="text-on-surface-variant leading-relaxed">Tomas decisiones basadas en miedos ancestrales y patrones familiares que ya no te pertenecen ni te sirven.</p>
              </div>
            </div>
            <p className="mt-16 text-xl font-headline text-primary/80 italic leading-loose">
              ¿Y si pudieras ver los hilos que mueven tus pensamientos y empezar a tejer tu propia red?
            </p>
          </div>
        </section>

        {/* Solution: The 4 Pillars */}
        <section className="py-32 px-8" id="metodologia">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-20 items-center">
              <div className="flex-1">
                <h2 className="font-headline text-5xl font-bold text-primary mb-8 leading-tight">El Método <br />de los 4 Pilares</h2>
                <p className="text-lg text-on-surface-variant mb-12">No es solo teoría; es una reestructuración profunda de tu arquitectura interna. Combinamos neurociencia moderna con sabiduría editorial para transformar tu narrativa personal.</p>

                <div className="space-y-8">
                  <div className="flex gap-6 items-start">
                    <span className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0 text-on-secondary-container font-bold">1</span>
                    <div>
                      <h4 className="font-bold text-primary text-xl mb-2">Desmantelamiento</h4>
                      <p className="text-on-surface-variant">Identificar y remover las creencias parásitas que drenan tu energía creativa.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 items-start">
                    <span className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0 text-on-secondary-container font-bold">2</span>
                    <div>
                      <h4 className="font-bold text-primary text-xl mb-2">Arquitectura Mental</h4>
                      <p className="text-on-surface-variant">Diseñar nuevos canales de pensamiento alineados con tu versión más expansiva.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="bg-tertiary-fixed-dim/30 rounded-3xl p-8 aspect-square flex flex-col justify-end">
                  <span className="material-symbols-outlined text-3xl mb-4 text-tertiary-container">eco</span>
                  <span className="font-headline font-bold text-lg text-tertiary-container">Pilar de <br />Crecimiento</span>
                </div>
                <div className="bg-on-error-container/10 rounded-3xl p-8 aspect-square flex flex-col justify-end mt-12">
                  <span className="material-symbols-outlined text-3xl mb-4 text-on-error-container">fireplace</span>
                  <span className="font-headline font-bold text-lg text-on-error-container">Pilar de <br />Soberanía</span>
                </div>
                <div className="bg-on-primary-container/20 rounded-3xl p-8 aspect-square flex flex-col justify-end -mt-12">
                  <span className="material-symbols-outlined text-3xl mb-4 text-primary">auto_awesome</span>
                  <span className="font-headline font-bold text-lg text-primary">Pilar de <br />Ancestralidad</span>
                </div>
                <div className="bg-secondary-container/30 rounded-3xl p-8 aspect-square flex flex-col justify-end">
                  <span className="material-symbols-outlined text-3xl mb-4 text-secondary">flare</span>
                  <span className="font-headline font-bold text-lg text-secondary">Pilar de <br />Claridad</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Program Curriculum */}
        <section className="py-32 bg-surface-container px-8" id="curriculum">
          <div className="max-w-7xl mx-auto">
            <header className="text-center mb-20">
              <h2 className="font-headline text-5xl font-bold text-primary mb-4">Cronograma de Expansión</h2>
              <p className="text-on-surface-variant uppercase tracking-widest font-bold text-xs">5 Semanas de Evolución Consciente</p>
            </header>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Week 1 - Sage */}
              <div className="bg-tertiary-fixed-dim p-10 rounded-xl editorial-shadow group hover:bg-tertiary-fixed transition-colors duration-500">
                <span className="text-xs font-bold uppercase tracking-widest text-on-tertiary-fixed-variant mb-6 block">Semana 01: El Retorno</span>
                <h3 className="font-headline text-3xl font-bold text-tertiary mb-6">El Niño Interior</h3>
                <p className="text-on-tertiary-fixed-variant mb-8 leading-relaxed">Reconexión con la curiosidad pura y el juego como herramientas de expansión radical.</p>
                <div className="pt-8 border-t border-tertiary/10 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-sm">menu_book</span>
                    <span className="text-sm font-semibold">Notebook: El Mapa del Deseo</span>
                  </div>
                </div>
              </div>

              {/* Week 2 - Terracotta */}
              <div className="bg-[#C4704F]/20 p-10 rounded-xl editorial-shadow border border-[#C4704F]/10">
                <span className="text-xs font-bold uppercase tracking-widest text-[#C4704F] mb-6 block">Semana 02: La Sombra</span>
                <h3 className="font-headline text-3xl font-bold text-[#C4704F] mb-6">Ángeles Caídos</h3>
                <p className="text-[#C4704F]/80 mb-8 leading-relaxed">Integración de las partes rechazadas de nosotros mismos para recuperar el poder total.</p>
                <div className="pt-8 border-t border-[#C4704F]/20 space-y-4">
                  <div className="flex items-center gap-3 text-[#C4704F]">
                    <span className="material-symbols-outlined text-sm">mail</span>
                    <span className="text-sm font-semibold">Carta: El Perdón Visceral</span>
                  </div>
                </div>
              </div>

              {/* Week 3 - Slate Blue */}
              <div className="bg-[#5B7FA6]/20 p-10 rounded-xl editorial-shadow border border-[#5B7FA6]/10">
                <span className="text-xs font-bold uppercase tracking-widest text-[#5B7FA6] mb-6 block">Semana 03: El Legado</span>
                <h3 className="font-headline text-3xl font-bold text-[#5B7FA6] mb-6">Linaje y Tierra</h3>
                <p className="text-[#5B7FA6]/80 mb-8 leading-relaxed">Sanación de patrones transgeneracionales y enraizamiento en el presente absoluto.</p>
                <div className="pt-8 border-t border-[#5B7FA6]/20 space-y-4">
                  <div className="flex items-center gap-3 text-[#5B7FA6]">
                    <span className="material-symbols-outlined text-sm">list_alt</span>
                    <span className="text-sm font-semibold">Lists: Inventario de Lealtades</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mt-8">
              <div className="p-10 bg-primary text-on-primary rounded-xl editorial-shadow flex flex-col justify-center">
                <span className="text-xs font-bold uppercase tracking-widest text-on-primary-container mb-6 block">Semana 04: La Estructura</span>
                <h3 className="font-headline text-3xl font-bold mb-6 italic">Arquitectura de la Voluntad</h3>
                <p className="text-on-primary-container leading-relaxed">Construcción de hábitos de pensamiento de alto rendimiento sin sacrificar el alma.</p>
              </div>

              <div className="p-10 bg-secondary-container text-on-secondary-container rounded-xl editorial-shadow flex flex-col justify-center">
                <span className="text-xs font-bold uppercase tracking-widest text-on-secondary-fixed-variant mb-6 block">Semana 05: El Salto</span>
                <h3 className="font-headline text-3xl font-bold mb-6 italic">La Nueva Realidad</h3>
                <p className="text-on-secondary-fixed-variant leading-relaxed">Ejecución del plan de expansión y manifestación de la visión editorial de tu vida.</p>
              </div>
            </div>
          </div>
        </section>

        {/* About Rui */}
        <section className="py-32 px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-20 items-center">
            <div className="w-full md:w-1/2 relative">
              <div className="absolute inset-0 bg-primary/5 rounded-full scale-110 -rotate-6"></div>
              <img alt="Rui Machalele Portrait" className="relative z-10 w-full aspect-square object-cover rounded-2xl editorial-shadow" data-alt="sophisticated middle aged man with glasses, looking thoughtfully into the distance, soft studio lighting, high contrast black and white editorial style" src="ruisquare.webp" />
            </div>

            <div className="w-full md:w-1/2">
              <span className="text-secondary font-bold uppercase tracking-widest text-xs mb-4 block">El Mentor detrás de la Visión</span>
              <h2 className="font-headline text-5xl font-bold text-primary mb-8">Rui Machalele</h2>
              <div className="space-y-6 text-lg text-on-surface-variant leading-relaxed">
                <p>Tras años navegando por los pasillos corporativos de la alta dirección, descubrí que el verdadero éxito no se mide en balances, sino en la profundidad de nuestra paz interior y la amplitud de nuestra conciencia.</p>
                <p className="italic text-primary font-serif">&quot;Mi misión es ayudarte a recordar que no eres un espectador de tu vida, sino el editor jefe de tu propia existencia.&quot;</p>
                <p>He guiado a cientos de líderes, artistas y buscadores a encontrar el silencio necesario para escuchar su propia verdad. Este programa es la culminación de ese viaje.</p>
              </div>
              <div className="mt-12 flex gap-8">
                <div>
                  <p className="text-4xl font-headline font-bold text-primary">1500+</p>
                  <p className="text-xs uppercase font-bold tracking-widest text-secondary">Alumnos Guiados</p>
                </div>
                <div>
                  <p className="text-4xl font-headline font-bold text-primary">12+</p>
                  <p className="text-xs uppercase font-bold tracking-widest text-secondary">Años de Investigación</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bonus Section */}
        <section className="py-24 px-8">
          <div className="max-w-5xl mx-auto bg-surface-container-high rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
              <span className="material-symbols-outlined text-secondary text-6xl opacity-20">verified</span>
            </div>
            <span className="inline-block px-4 py-1 bg-secondary text-on-secondary rounded-full text-xs font-bold tracking-widest uppercase mb-8">REGALO EXCLUSIVO</span>
            <h2 className="font-headline text-4xl font-bold text-primary mb-6">Sesión de Integración Post-Programa</h2>
            <p className="text-xl text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
              Al finalizar las 5 semanas, tendremos un encuentro grupal en vivo para aterrizar los conceptos, resolver bloqueos finales y asegurar que tu expansión sea permanente.
            </p>
            <div className="flex justify-center items-center gap-4 text-primary font-bold">
              <span className="material-symbols-outlined">schedule</span>
              <span>Valorado en 250USD — Incluido gratis</span>
            </div>
          </div>
        </section>

        {/* Pricing & Final CTA */}
        <section className="py-32 px-8 bg-primary text-on-primary" id="enroll">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-headline text-5xl font-bold mb-8">El momento de la expansión es ahora.</h2>
            <p className="text-on-primary-container text-xl mb-16 max-w-2xl mx-auto">Únete a la próxima cohorte y comienza el proceso de desmantelar lo que ya no te sirve.</p>

            <div className="bg-surface p-12 rounded-[2rem] text-on-background editorial-shadow">
              <div className="mb-10">
                <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-4">INVERSIÓN EN TI MISMO</p>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-2xl text-on-surface-variant line-through opacity-50">997USD</span>
                  <span className="text-7xl font-headline font-bold text-primary">497USD</span>
                </div>
                <p className="text-sm mt-4 opacity-70">O 3 cuotas de 180USD</p>
              </div>

              <ul className="text-left space-y-4 mb-12 max-w-sm mx-auto">
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>5 Semanas de Formación Online</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Acceso de por vida a la plataforma</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Materiales descargables y Guías de Trabajo</span>
                </li>
              </ul>

              <Link href="/thanks" className="w-full inline-block py-6 bg-secondary text-on-secondary rounded-xl text-xl font-bold hover:bg-on-secondary-container transition-all mb-6">
                Inscribirme al Programa
              </Link>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary/60 italic">Últimos 12 lugares disponibles para esta edición</p>
            </div>

            {/* Guarantee */}
            <div className="mt-20 flex flex-col md:flex-row items-center justify-center gap-8 p-10 rounded-2xl border border-on-primary-container/20">
              <span className="material-symbols-outlined text-7xl text-secondary-container">verified_user</span>
              <div className="text-left max-w-lg">
                <h4 className="font-headline text-2xl font-bold mb-2">Expansion Guarantee - 15 days</h4>
                <p className="text-on-primary-container leading-relaxed">Si en las primeras dos semanas sientes que este viaje no es para ti, te devolvemos el 100% de tu inversión. Sin preguntas, solo respeto por tu proceso.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-32 px-8 bg-surface">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-headline text-4xl font-bold text-primary mb-16 text-center">Preguntas Frecuentes</h2>

            <div className="space-y-4">
              {/* FAQ 1 */}
              <details className="group bg-surface-container-low rounded-xl p-6 cursor-pointer">
                <summary className="flex items-center justify-between font-bold text-primary text-lg list-none">
                  ¿Necesito experiencia previa en meditación?
                  <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                </summary>
                <div className="mt-4 text-on-surface-variant leading-relaxed">
                  No es necesario. El programa está diseñado para llevarte desde la base hasta estados avanzados de conciencia, proporcionando todas las herramientas necesarias.
                </div>
              </details>

              {/* FAQ 2 */}
              <details className="group bg-surface-container-low rounded-xl p-6 cursor-pointer">
                <summary className="flex items-center justify-between font-bold text-primary text-lg list-none">
                  ¿Cuánto tiempo debo dedicar al día?
                  <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                </summary>
                <div className="mt-4 text-on-surface-variant leading-relaxed">
                  Recomendamos entre 20 y 30 minutos diarios para las prácticas y una hora semanal para el contenido del módulo. La constancia es más importante que la duración.
                </div>
              </details>

              {/* FAQ 3 */}
              <details className="group bg-surface-container-low rounded-xl p-6 cursor-pointer">
                <summary className="flex items-center justify-between font-bold text-primary text-lg list-none">
                  ¿Tendré acceso directo a Rui?
                  <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                </summary>
                <div className="mt-4 text-on-surface-variant leading-relaxed">
                  Rui modera la comunidad del programa y lidera la sesión de integración final. En la plataforma, un equipo de mentores capacitados también está disponible para resolver dudas técnicas y profundas.
                </div>
              </details>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#f8f3eb] dark:bg-stone-950 flex flex-col items-center gap-8 py-12 w-full px-4 border-t border-[#3B2F6E]/10">
        <div className="flex flex-wrap justify-center gap-8">
          <a className="font-['Inter'] text-[10px] uppercase tracking-widest font-semibold text-[#251857]/50 hover:text-[#251857] underline underline-offset-4 transition-all" href="#">Privacy Policy</a>
          <a className="font-['Inter'] text-[10px] uppercase tracking-widest font-semibold text-[#251857]/50 hover:text-[#251857] underline underline-offset-4 transition-all" href="#">Terms of Service</a>
          <a className="font-['Inter'] text-[10px] uppercase tracking-widest font-semibold text-[#251857]/50 hover:text-[#251857] underline underline-offset-4 transition-all" href="#">Disclaimer</a>
          <a className="font-['Inter'] text-[10px] uppercase tracking-widest font-semibold text-[#251857]/50 hover:text-[#251857] underline underline-offset-4 transition-all" href="#">Contact</a>
        </div>
        <p className="font-['Inter'] text-[10px] uppercase tracking-widest font-semibold text-[#251857]">© 2026 Ángeles Terrenales. All rights reserved.</p>
      </footer>
    </>
  );
}
