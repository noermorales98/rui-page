"use client";

import { useState } from "react";

const DEFAULT_VIDEO_ID = "yIoAdYP6o3w";

function trackEvent(type: string, meta?: Record<string, unknown>) {
  fetch("/api/webinar/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, meta }),
  }).catch(() => {});
}

function embedUrl(videoId: string, autoplay: boolean) {
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    controls: "0",
    modestbranding: "1",
    rel: "0",
    iv_load_policy: "3",
    fs: "0",
    disablekb: "1",
    playsinline: "1",
    // Al terminar, reinicia el mismo video en lugar de mostrar sugerencias
    playlist: videoId,
    loop: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
}

export function WebinarWarmupVideo() {
  const [started, setStarted] = useState(false);
  const videoId =
    process.env.NEXT_PUBLIC_WEBINAR_WARMUP_VIDEO_ID ?? DEFAULT_VIDEO_ID;
  const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  function handlePlayClick() {
    if (started) return;
    setStarted(true);
    trackEvent("VIDEO_PLAY", { trigger: "click" });
  }

  return (
    <section className="border-b border-[#dcd0c4]/80 bg-[#ebe2d6]/40 px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.3em] text-[#8a7560]">
          Mira esto antes del webinar
        </p>
        <h2 className="mt-3 text-center font-serif text-xl font-semibold text-[#2a231c] sm:text-2xl">
          Por qué las personas exitosas se sienten vacías
        </h2>
        <div className="relative mt-8 overflow-hidden rounded-sm border border-[#dcd0c4] bg-[#2a231c] shadow-inner">
          <div className="aspect-video w-full">
            {started ? (
              <iframe
                title="Video previo al webinar"
                className="h-full w-full"
                src={embedUrl(videoId, true)}
                allow="accelerometer; autoplay; encrypted-media; gyroscope"
              />
            ) : (
              <button
                type="button"
                onClick={handlePlayClick}
                className="group relative h-full w-full cursor-pointer border-0 bg-[#2a231c] p-0"
                aria-label="Reproducir video"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbnail}
                  alt=""
                  className="h-full w-full object-cover opacity-90"
                />
                <span className="absolute inset-0 bg-[#2a231c]/30 transition group-hover:bg-[#2a231c]/20" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#f4ede4]/80 bg-[#2a231c]/60 text-[#f4ede4] backdrop-blur-sm transition group-hover:scale-105 group-hover:bg-[#9a7b45]/90">
                    <svg
                      className="ml-1 h-7 w-7"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
