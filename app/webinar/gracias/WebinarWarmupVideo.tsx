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

export function WebinarWarmupVideo() {
  const [videoPlayed, setVideoPlayed] = useState(false);
  const videoId =
    process.env.NEXT_PUBLIC_WEBINAR_WARMUP_VIDEO_ID ?? DEFAULT_VIDEO_ID;

  function handleVideoClick() {
    if (videoPlayed) return;
    setVideoPlayed(true);
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
        <div className="relative mt-8 overflow-hidden rounded-sm border border-[#dcd0c4] bg-[#2a231c]/5 shadow-inner">
          <div className="aspect-video w-full">
            <div
              className="relative h-full w-full"
              onClick={handleVideoClick}
            >
              {!videoPlayed && (
                <div
                  className="absolute inset-0 z-10 cursor-pointer"
                  aria-hidden
                />
              )}
              <iframe
                title="Video previo al webinar"
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
