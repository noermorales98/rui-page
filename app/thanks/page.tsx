import Link from "next/link";
import Image from "next/image";

export default function ThanksPage() {
  return (
    <>
      {/* TopNavBar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#fef9f1]/70 backdrop-blur-xl transition-colors duration-300 ease-in-out">
        <div className="flex justify-between items-center w-full px-8 py-6 max-w-7xl mx-auto">
          <Link href="/" className="text-2xl font-bold font-serif italic text-[#251857]">Ángeles Terrenales</Link>
          <div className="hidden md:flex gap-8 items-center">
            <Link className="font-serif text-lg font-semibold tracking-tight text-[#251857]/60 hover:text-[#251857] transition-colors duration-300 ease-in-out" href="#">Curriculum</Link>
            <Link className="font-serif text-lg font-semibold tracking-tight text-[#251857]/60 hover:text-[#251857] transition-colors duration-300 ease-in-out" href="#">Methodology</Link>
            <Link href="/sales_page" className="bg-primary text-on-primary px-8 py-2 rounded-xl font-medium active:scale-95 transition-all duration-200">Enroll</Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20">
        {/* Section 1: Confirmation */}
        <section className="max-w-4xl mx-auto px-6 text-center mb-24">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tertiary-fixed-dim text-on-tertiary-fixed-variant mb-8">
            <span className="material-symbols-outlined text-3xl">mark_email_read</span>
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-primary mb-6 leading-tight">¡Tu mapa está en camino a tu email!</h1>
          <p className="text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Hemos enviado tu guía personalizada. Por favor, revisa tu bandeja de entrada (y la carpeta de promociones) en los próximos 5 minutos.
          </p>
        </section>

        {/* Section 2 & 3: Transition & Video */}
        <section className="bg-surface-container-low py-24 relative overflow-hidden">
          {/* Background Decorative Arc */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-secondary-container/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="label-md uppercase tracking-widest font-semibold text-secondary mb-4 block">Una Oportunidad Única</span>
                <h2 className="font-serif text-4xl md:text-5xl font-semibold text-primary mb-8 leading-tight">Mientras tanto, ¿quieres acelerar tu proceso?</h2>
                <p className="text-lg text-on-surface-variant mb-10 leading-relaxed">
                  El mapa es el primer paso. Pero para navegar las profundidades de tu mente, necesitas las herramientas que solo los maestros dominan. Esta oferta es exclusiva para quienes acaban de dar el primer paso.
                </p>
                <div className="flex items-center gap-4 text-primary font-semibold">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
                  <span>Oferta disponible solo por los próximos 15 minutos</span>
                </div>
              </div>

              {/* Video Placeholder */}
              <div className="relative group">
                <div className="aspect-video bg-primary-container rounded-xl overflow-hidden editorial-shadow flex items-center justify-center relative">
                  <img alt="Video placeholder" className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" data-alt="atmospheric cinematic shot of a person meditating in a library with dust motes dancing in shafts of morning sunlight" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD6Dfjtcvc0RvX2mJkIE2OtHbgY6ErrTY_jcjFklybL-YIroDJKZeyok3pPjozk_KAOaL7SzpFLkN5X4CpLPt61iOKPYa8KRDHLo0WAvcRj73XhE86z02ugj0wXTN0RedIgr3Hkoe5E1OaidnXaBgOnIQfhF8UtSpuAypKgksrvUqJrPCrK77j20Cj00Gb08-BwWdUeCaX29Avoh9w__PK3ZOV51-hSfgLZi1OXTNod2QzTg47ZOH8u2kUv-Qw8etz9uR8YuIprCzmG" />
                  <button className="w-20 h-20 bg-surface text-primary rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 z-10 relative">
                    <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Masterclass Details */}
        <section className="py-24 max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-12">
            {/* Content */}
            <div className="lg:col-span-7">
              <h2 className="font-serif text-4xl font-bold text-primary mb-8">Masterclass: Los 4 Guardianes de tu Mente</h2>
              <p className="text-xl text-on-surface-variant mb-12">
                Aprende a identificar y transmutar los arquetipos que bloquean tu expansión espiritual y mental.
              </p>

              <ul className="space-y-6">
                <li className="flex gap-4">
                  <span className="material-symbols-outlined text-tertiary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-on-surface-variant">Identificación profunda del Crítico, el Saboteador, el Miedoso y el Complaciente.</span>
                </li>
                <li className="flex gap-4">
                  <span className="material-symbols-outlined text-tertiary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-on-surface-variant">Técnicas de respiración editorial para calmar el sistema nervioso en segundos.</span>
                </li>
                <li className="flex gap-4">
                  <span className="material-symbols-outlined text-tertiary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-on-surface-variant">Protocolos de diálogo interno para convertir sombras en aliados de sabiduría.</span>
                </li>
                <li className="flex gap-4">
                  <span className="material-symbols-outlined text-tertiary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-on-surface-variant">Acceso a la comunidad privada de &quot;El Oráculo Moderno&quot; por 30 días.</span>
                </li>
                <li className="flex gap-4">
                  <span className="material-symbols-outlined text-tertiary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-on-surface-variant">Cuaderno de trabajo digital con ejercicios de escritura contemplativa.</span>
                </li>
              </ul>
            </div>

            {/* Offer Card */}
            <div className="lg:col-span-5">
              <div className="bg-surface-container-lowest rounded-xl editorial-shadow p-8 border border-outline-variant/15 sticky top-32">
                <div className="flex items-center justify-between mb-8">
                  <div className="text-on-surface-variant line-through text-xl">$97</div>
                  <div className="bg-secondary-container text-on-secondary-container px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">Ahorra 80%</div>
                </div>

                <div className="text-6xl font-serif font-bold text-primary mb-8">$19</div>

                <button className="w-full bg-primary text-on-primary py-5 rounded-xl text-xl font-semibold hover:bg-primary-container transition-all mb-8 active:scale-95">
                  Sí, quiero la Masterclass por $19
                </button>

                <div className="flex items-center gap-4 bg-surface-container-low p-4 rounded-xl">
                  <span className="material-symbols-outlined text-secondary text-3xl">verified_user</span>
                  <div>
                    <p className="font-semibold text-primary">Garantía de 7 días</p>
                    <p className="text-sm text-on-surface-variant leading-tight">Si no sientes una expansión real en tu mente, te devolvemos el 100% de tu inversión.</p>
                  </div>
                </div>

                <div className="mt-8 flex justify-center gap-6">
                  <img alt="Payment method" className="h-8 grayscale opacity-50" data-alt="monochrome line icon of a credit card and secure lock symbol on a light cream background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVnqY4FVaQ6kDmJXBREmNVgXi_kcw3BMZgYWz4cvkHJcY-ICaotqtbe8EM9ykmt_fFSr_coA1Mx8Qkp2nS_0-kOjPVeUMnNRSun_063lt4fmcbaaLMN5YelIP2bj07GM15IL2gi36p7lGPigmkN_sk08cHgFnFowxHOJdCst4oUez7F6WUc1oi7i3eKXS_PkLHdYpHasN_6xj-Q0WTsYqF5-Ci5TNH5mzoMcKTB8IZu4YhWt8srnY3J_CedW3_9fBOxLliQeP4Gu8s" />
                  <img alt="Secure payment" className="h-8 grayscale opacity-50" data-alt="monochrome badge with text saying secure encrypted payment in a professional minimalist style" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRRNQxhbN3vSJ8RfmgyORPoDDUYQ5XBY-EBTba8Y1WjCuhrwBOcwsmA6qH2xkJd0JU48xTcuHdNajCy3ytZmvJ5AB2p8PkiD3v9SfvqGMEAwvXjJXASEc8XrDgLZhw11fynitBq4jpGOhCrcuUv_9r8ZjfvP9HPOIA3QIyI2kKjJb6XGn9uoO05erSJaItGeTYJ3x_6eks4lIo8htok4XkxjXus_DNGlS_P8dt6DXx33qLX2057qsyNer71RW9CrAZ_IIfNwLgkY8s" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#f8f3eb] w-full mt-20 border-t border-[#3B2F6E]/10 flex flex-col items-center gap-8 py-12 px-4">
        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          <a className="font-['Inter'] text-[10px] uppercase tracking-widest font-semibold text-[#251857]/50 hover:text-[#251857] transition-all underline underline-offset-4" href="#">Privacy Policy</a>
          <a className="font-['Inter'] text-[10px] uppercase tracking-widest font-semibold text-[#251857]/50 hover:text-[#251857] transition-all underline underline-offset-4" href="#">Terms of Service</a>
          <a className="font-['Inter'] text-[10px] uppercase tracking-widest font-semibold text-[#251857]/50 hover:text-[#251857] transition-all underline underline-offset-4" href="#">Disclaimer</a>
          <a className="font-['Inter'] text-[10px] uppercase tracking-widest font-semibold text-[#251857]/50 hover:text-[#251857] transition-all underline underline-offset-4" href="#">Contact</a>
        </div>
        <p className="font-['Inter'] text-[10px] uppercase tracking-widest font-semibold text-[#251857] dark:text-stone-400">© 2026 Ángeles Terrenales. All rights reserved.</p>
      </footer>
    </>
  );
}
