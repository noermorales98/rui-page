import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <>
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-[#fef9f1]/70 backdrop-blur-md shadow-[0_20px_40px_rgba(59,47,110,0.08)]">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-8 h-20">
          <Link href="/" className="font-playfair text-2xl font-bold text-[#251857]">RM</Link>
          <div className="hidden md:flex items-center space-x-8 font-noto-serif text-sm tracking-wide uppercase">
            <a className="text-[#251857] opacity-80 hover:text-[#7D5700] transition-colors duration-300" href="#programa">Programa</a>
            <a className="text-[#251857] opacity-80 hover:text-[#7D5700] transition-colors duration-300" href="#metodologia">Metodología</a>
            <a className="text-[#251857] opacity-80 hover:text-[#7D5700] transition-colors duration-300" href="#testimonios">Testimonios</a>
            <a className="text-[#251857] opacity-80 hover:text-[#7D5700] transition-colors duration-300" href="#faq">FAQ</a>
          </div>
          <a className="bg-primary text-on-primary px-6 py-3 rounded-xl font-medium text-sm hover:bg-primary-container transition-all duration-300 scale-95 hover:scale-100" href="#cta">
            Quiero expandir mi mente
          </a>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-surface via-surface to-surface-container-low"></div>
          {/* Decorative Energy Field */}
          <div className="absolute top-1/4 -right-20 w-[600px] h-[600px] bg-tertiary-fixed-dim opacity-5 rounded-full blur-[120px]"></div>

          <div className="max-w-7xl mx-auto px-8 md:px-28 grid md:grid-cols-2 gap-16 items-center relative z-10">
            <div className="space-y-8">
              <h1 className="font-playfair text-5xl md:text-7xl leading-[1.1] text-primary font-bold">
                Despierta la <br /><span className="text-secondary italic">Consciencia</span> que habita en ti.
              </h1>
              <p className="text-body-lg text-on-surface-variant max-w-lg leading-relaxed text-lg">
                Un viaje de 5 semanas para disolver los bloqueos invisibles y conectar con tu verdadera esencia a través de la expansión mental y emocional.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <a className="bg-primary text-on-primary px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 group hover:shadow-[0_10px_30px_-10px_rgba(37,24,87,0.4)] transition-all" href="#cta">
                  Quiero expandir mi mente
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl relative transform rotate-2">
                <Image
                  src="/rui2.webp"
                  alt="Composición abstracta de refracciones doradas a través de cristal con atmósfera etérea"
                  fill
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-secondary-container rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
            </div>
          </div>
        </section>

        {/* El Problema */}
        <section className="py-32 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="label-md text-secondary tracking-widest uppercase mb-4 block">Identificación</span>
              <h2 className="wisdom-header text-4xl md:text-5xl text-primary font-semibold mb-6">¿Te identificas con esto?</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-10 bg-surface-container-lowest rounded-xl space-y-6">
                <span className="material-symbols-outlined text-4xl text-on-error-container" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                <h3 className="text-xl font-semibold text-primary">Sensación de Estancamiento</h3>
                <p className="text-on-surface-variant leading-relaxed">Sientes que por más que te esfuerzas, siempre chocas con el mismo muro invisible que te impide avanzar en tu propósito.</p>
              </div>

              <div className="p-10 bg-surface-container-lowest rounded-xl space-y-6">
                <span className="material-symbols-outlined text-4xl text-on-error-container" style={{ fontVariationSettings: "'FILL' 1" }}>noise_control_off</span>
                <h3 className="text-xl font-semibold text-primary">Ruido Mental Incesante</h3>
                <p className="text-on-surface-variant leading-relaxed">Tu mente no descansa. Voces de duda, crítica y miedo —tus Ángeles Caídos— sabotean cada intento de expansión.</p>
              </div>

              <div className="p-10 bg-surface-container-lowest rounded-xl space-y-6">
                <span className="material-symbols-outlined text-4xl text-on-error-container" style={{ fontVariationSettings: "'FILL' 1" }}>distance</span>
                <h3 className="text-xl font-semibold text-primary">Desconexión Esencial</h3>
                <p className="text-on-surface-variant leading-relaxed">Vives en piloto automático, cumpliendo expectativas ajenas pero sintiéndote profundamente vacío por dentro.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Sobre Rui */}
        <section className="py-32 overflow-hidden" id="sobre-rui">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex flex-col md:flex-row items-center gap-16">
              <div className="w-full md:w-1/2 relative">
                <div className="bg-primary-container w-[80%] aspect-square rounded-full absolute -top-10 -left-10 opacity-10"></div>
                <Image
                  src="/ruisquare.webp"
                  alt="Retrato profesional de Rui Machalele con expresión serena y luz cinematográfica cálida"
                  width={2048}
                  height={2048}
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="rounded-xl w-full relative z-10 shadow-xl"
                />
              </div>
              <div className="w-full md:w-1/2 space-y-8">
                <span className="label-md text-secondary tracking-widest uppercase">El Guía</span>
                <h2 className="wisdom-header text-4xl text-primary font-bold">Rui Machalele</h2>
                <div className="space-y-6 text-lg leading-relaxed text-on-surface-variant">
                  <p>No siempre fui el guía que soy hoy. Mi propio camino hacia la expansión mental comenzó en la oscuridad de una crisis personal que me obligó a mirar hacia adentro.</p>
                  <p>Entendí que la espiritualidad no es religión, sino la tecnología más avanzada del ser humano para transformar su realidad. Hoy, acompaño a buscadores a encontrar su propio mapa de navegación interna.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* El Método */}
        <section className="py-32 bg-surface-container-low" id="metodologia">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-20">
              <h2 className="wisdom-header text-4xl md:text-5xl text-primary font-semibold">Los 4 Pilares de la Expansión</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Pilar 1 */}
              <div className="bg-[#b9efcf] p-8 rounded-xl space-y-6 hover:shadow-lg transition-all border border-black/5">
                <span className="material-symbols-outlined text-tertiary-container text-4xl" data-icon="child_care">child_care</span>
                <h3 className="text-xl font-bold text-tertiary">Niño Interior</h3>
                <p className="text-tertiary-container/80 text-sm leading-relaxed">El permiso sagrado para volver a jugar, sentir y crear sin el juicio del adulto condicionado.</p>
              </div>
              {/* Pilar 2 */}
              <div className="bg-[#ffdad6] p-8 rounded-xl space-y-6 hover:shadow-lg transition-all border border-black/5">
                <span className="material-symbols-outlined text-on-error-container text-4xl" data-icon="troubleshoot">troubleshoot</span>
                <h3 className="text-xl font-bold text-on-error-container">Ángeles Caídos</h3>
                <p className="text-on-error-container/80 text-sm leading-relaxed">Identificar las sombras y los bloqueos que limitan tu crecimiento y transformarlos en poder.</p>
              </div>
              {/* Pilar 3 */}
              <div className="bg-primary-container p-8 rounded-xl space-y-6 hover:shadow-lg transition-all border border-black/5">
                <span className="material-symbols-outlined text-on-primary-container text-4xl" data-icon="groups">groups</span>
                <h3 className="text-xl font-bold text-on-primary-container">Ángeles Terrenales</h3>
                <p className="text-on-primary-container/80 text-sm leading-relaxed">Las conexiones humanas y el entorno que te sostiene en tu realidad física diaria.</p>
              </div>
              {/* Pilar 4 */}
              <div className="bg-[#a699e0] p-8 rounded-xl space-y-6 hover:shadow-lg transition-all border border-black/5">
                <span className="material-symbols-outlined text-primary text-4xl" data-icon="auto_awesome">auto_awesome</span>
                <h3 className="text-xl font-bold text-primary">Ángeles Ancestrales</h3>
                <p className="text-primary/80 text-sm leading-relaxed">La sabiduría heredada de tu linaje que fluye por tu sangre esperando ser reconocida.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Cronograma */}
        <section className="py-32" id="programa">
          <div className="max-w-7xl mx-auto px-8">
            <h2 className="wisdom-header text-4xl text-center text-primary font-bold mb-20 italic">Tu Viaje de 5 Semanas</h2>
            <div className="space-y-4 max-w-4xl mx-auto">
              {/* Semana 1 */}
              <div className="group bg-surface-container-low p-8 rounded-xl hover:bg-surface-container-high transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-secondary font-bold text-sm tracking-widest uppercase">Semana 1</span>
                    <h3 className="text-2xl font-semibold text-primary mt-1">El Encuentro</h3>
                  </div>
                  <div className="bg-white/50 px-4 py-2 rounded-lg text-sm text-primary font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg" data-icon="menu_book">menu_book</span>
                    Entregable: Cuaderno de Intención
                  </div>
                </div>
              </div>
              {/* Semana 2 */}
              <div className="group bg-surface-container-low p-8 rounded-xl hover:bg-surface-container-high transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-secondary font-bold text-sm tracking-widest uppercase">Semana 2</span>
                    <h3 className="text-2xl font-semibold text-primary mt-1">Niño Interior: El Permiso</h3>
                  </div>
                  <div className="bg-white/50 px-4 py-2 rounded-lg text-sm text-primary font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg" data-icon="edit_note">edit_note</span>
                    Entregable: Carta del adulto al niño
                  </div>
                </div>
              </div>
              {/* Semana 3 */}
              <div className="group bg-surface-container-low p-8 rounded-xl hover:bg-surface-container-high transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-secondary font-bold text-sm tracking-widest uppercase">Semana 3</span>
                    <h3 className="text-2xl font-semibold text-primary mt-1">Ángeles Caídos: El Despertar Incomodo</h3>
                  </div>
                  <div className="bg-white/50 px-4 py-2 rounded-lg text-sm text-primary font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg" data-icon="list_alt">list_alt</span>
                    Entregable: Lista de influencias
                  </div>
                </div>
              </div>
              {/* Semana 4 */}
              <div className="group bg-surface-container-low p-8 rounded-xl hover:bg-surface-container-high transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-secondary font-bold text-sm tracking-widest uppercase">Semana 4</span>
                    <h3 className="text-2xl font-semibold text-primary mt-1">Ángeles Terrenales: Orientación</h3>
                  </div>
                  <div className="bg-white/50 px-4 py-2 rounded-lg text-sm text-primary font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg" data-icon="list_alt">list_alt</span>
                    Entregable: Lista de influencias
                  </div>
                </div>
              </div>
              {/* Semana 5 */}
              <div className="group bg-surface-container-low p-8 rounded-xl hover:bg-surface-container-high transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-secondary font-bold text-sm tracking-widest uppercase">Semana 5</span>
                    <h3 className="text-2xl font-semibold text-primary mt-1">Ángeles Ancestrales: El Legado</h3>
                  </div>
                  <div className="bg-white/50 px-4 py-2 rounded-lg text-sm text-primary font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg" data-icon="list_alt">list_alt</span>
                    Entregable: Lista de influencias
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Para quién es */}
        <section className="py-32 bg-primary text-on-primary">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid md:grid-cols-2 gap-16">
              <div className="space-y-8">
                <h2 className="wisdom-header text-4xl">Este programa ES para ti si...</h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-secondary" data-icon="check_circle">check_circle</span>
                    <span className="opacity-90">Buscas una transformación real que vaya más allá de la teoría.</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-secondary" data-icon="check_circle">check_circle</span>
                    <span className="opacity-90">Sientes el llamado de algo más grande pero no sabes cómo escucharlo.</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-secondary" data-icon="check_circle">check_circle</span>
                    <span className="opacity-90">Estás dispuesto a mirar tus sombras para encontrar tu luz.</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-8">
                <h2 className="wisdom-header text-4xl">NO es para ti si...</h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-error" data-icon="cancel">cancel</span>
                    <span className="opacity-70">Buscas una solución mágica sin compromiso personal.</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-error" data-icon="cancel">cancel</span>
                    <span className="opacity-70">Confundes espiritualidad con dogmatismo religioso (esto es expansión universal).</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-error" data-icon="cancel">cancel</span>
                    <span className="opacity-70">Prefieres quedarte en tu zona de confort conocida.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonios */}
        <section className="py-32" id="testimonios">
          <div className="max-w-7xl mx-auto px-8">
            <h2 className="wisdom-header text-4xl text-center text-primary font-bold mb-20 italic">Historias de Expansión</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Testimonio 1 */}
              <div className="bg-surface-container-low p-10 rounded-xl space-y-6 flex flex-col justify-between">
                <p className="italic text-on-surface-variant leading-relaxed">&quot;Había hecho muchos cursos de &apos;mindfulness&apos;, pero con Rui fue la primera vez que realmente sentí que las piezas del rompecabezas encajaban. Mi negocio y mi vida personal cambiaron por completo.&quot;</p>
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden">
                    <Image src="/avatar.png" alt="Elena G." fill sizes="48px" className="object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-primary">Elena G.</p>
                    <p className="text-xs text-on-surface-variant">Arquitecta</p>
                  </div>
                </div>
              </div>
              {/* Testimonio 2 */}
              <div className="bg-surface-container-low p-10 rounded-xl space-y-6 flex flex-col justify-between">
                <p className="italic text-on-surface-variant leading-relaxed">&quot;El módulo de los Ángeles Caídos fue confrontador pero necesario. Entender mis bloqueos me dio la libertad que busqué por años. Gracias, Rui.&quot;</p>
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden">
                    <Image src="/avatar.png" alt="Marc V." fill sizes="48px" className="object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-primary">Marc V.</p>
                    <p className="text-xs text-on-surface-variant">Terapeuta</p>
                  </div>
                </div>
              </div>
              {/* Testimonio 3 */}
              <div className="bg-surface-container-low p-10 rounded-xl space-y-6 flex flex-col justify-between">
                <p className="italic text-on-surface-variant leading-relaxed">&quot;Lo que más valoro es que no es nada religioso. Es un proceso mental y emocional muy sólido que te aterriza mientras te expande.&quot;</p>
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden">
                    <Image src="/avatar.png" alt="Sandra L." fill sizes="48px" className="object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-primary">Sandra L.</p>
                    <p className="text-xs text-on-surface-variant">Emprendedora</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 bg-surface-container-low text-center relative overflow-hidden" id="cta">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent"></div>
          <div className="max-w-3xl mx-auto px-8 relative z-10">
            <h2 className="wisdom-header text-5xl text-primary font-bold mb-8">El momento es <span className="italic text-secondary">ahora</span></h2>
            <p className="text-xl text-on-surface-variant mb-12">Inscríbete hoy y comienza tu proceso de expansión mental con Rui Machalele. Cupos limitados para garantizar acompañamiento cercano.</p>
            <div className="bg-white p-12 rounded-2xl shadow-xl space-y-8">
              <div className="space-y-2">
                <p className="text-secondary font-bold tracking-widest uppercase">Inversión en tu Ser</p>
                <p className="text-6xl font-bold text-primary">$497 <span className="text-lg text-on-surface-variant font-normal">USD</span></p>
              </div>
              <button className="w-full bg-primary text-on-primary py-5 rounded-xl text-xl font-bold hover:bg-primary-container transition-all shadow-lg">
                Quiero expandir mi mente
              </button>
              <p className="text-sm text-on-surface-variant">Pago 100% seguro. Acceso inmediato al Módulo 0.</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-32" id="faq">
          <div className="max-w-4xl mx-auto px-8">
            <h2 className="wisdom-header text-4xl text-center text-primary font-bold mb-16">Preguntas Frecuentes</h2>
            <div className="space-y-4">
              <details className="group bg-surface-container-low rounded-xl p-6 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between cursor-pointer">
                  <h4 className="text-lg font-semibold text-primary">¿Es esto una formación religiosa?</h4>
                  <span className="material-symbols-outlined transition-transform group-open:rotate-180" data-icon="expand_more">expand_more</span>
                </summary>
                <p className="mt-4 text-on-surface-variant leading-relaxed">No. Es un programa de expansión mental y autoconocimiento. Utilizamos conceptos universales y arquetipos, pero no estamos vinculados a ninguna religión o dogma específico.</p>
              </details>
              <details className="group bg-surface-container-low rounded-xl p-6 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between cursor-pointer">
                  <h4 className="text-lg font-semibold text-primary">¿Cuánto tiempo debo dedicar al día?</h4>
                  <span className="material-symbols-outlined transition-transform group-open:rotate-180" data-icon="expand_more">expand_more</span>
                </summary>
                <p className="mt-4 text-on-surface-variant leading-relaxed">Recomendamos entre 20 a 30 minutos diarios para las prácticas y una hora a la semana para el contenido teórico y los entregables.</p>
              </details>
              <details className="group bg-surface-container-low rounded-xl p-6 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between cursor-pointer">
                  <h4 className="text-lg font-semibold text-primary">¿Qué pasa si no puedo asistir en vivo?</h4>
                  <span className="material-symbols-outlined transition-transform group-open:rotate-180" data-icon="expand_more">expand_more</span>
                </summary>
                <p className="mt-4 text-on-surface-variant leading-relaxed">Todas las sesiones quedan grabadas en tu plataforma de alumno para que las veas a tu propio ritmo cuantas veces necesites.</p>
              </details>
              <details className="group bg-surface-container-low rounded-xl p-6 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between cursor-pointer">
                  <h4 className="text-lg font-semibold text-primary">¿Tengo acceso de por vida?</h4>
                  <span className="material-symbols-outlined transition-transform group-open:rotate-180" data-icon="expand_more">expand_more</span>
                </summary>
                <p className="mt-4 text-on-surface-variant leading-relaxed">Sí, el acceso al material grabado y a las actualizaciones futuras del programa es vitalicio.</p>
              </details>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-low py-12">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <span className="font-playfair text-xl font-semibold text-[#251857]">Rui Machalele</span>
            <p className="mt-4 font-inter text-xs leading-relaxed opacity-70">Acompañando tu despertar a través de la sabiduría ancestral y la conciencia moderna.</p>
          </div>
          <div className="flex flex-col space-y-2">
            <a className="font-inter text-xs leading-relaxed opacity-70 hover:text-[#3B2F6E] transition-all" href="#">Privacidad</a>
            <a className="font-inter text-xs leading-relaxed opacity-70 hover:text-[#3B2F6E] transition-all" href="#">Términos</a>
          </div>
          <div className="font-inter text-xs leading-relaxed opacity-70">
            © 2026 Rui Machalele – Programa de Expansión Mental. Todos los derechos reservados.
          </div>
        </div>
      </footer>

      {/* Mobile Sticky CTA */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-40 hidden">
        <a className="w-full bg-secondary text-on-secondary font-bold py-4 rounded-full text-center block shadow-2xl" href="#cta">
          Inscribirme ahora
        </a>
      </div>
    </>
  );
}
