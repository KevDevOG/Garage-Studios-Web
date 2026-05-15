"use client";
import { ChevronRight } from "lucide-react";

interface SpotifyWork {
  title: string;
  artist: string;
  type: "Grabación" | "Mezcla" | "Masterización" | "Producción" | "Videoclip";
  spotifyUrl: string; // Embed URL format: https://open.spotify.com/embed/track/...
}

const PRODUCTIONS: SpotifyWork[] = [
  {
    title: "ZIG - ZAG",
    artist: "LEJII",
    type: "Producción",
    spotifyUrl: "https://open.spotify.com/embed/track/3nZfANXtzMDkxowYAyKxzu?utm_source=generator&theme=0",
  },
  {
    title: "Tu pelo",
    artist: "LEJII",
    type: "Producción",
    spotifyUrl: "https://open.spotify.com/embed/track/3rD3ueejc2auQ5zW5998cd?utm_source=generator&theme=0",
  },
  {
    title: "PIN - PUK",
    artist: "LEJII",
    type: "Producción",
    spotifyUrl: "https://open.spotify.com/embed/track/0yI5ojPw3rNIC93eMgBIN5?utm_source=generator&theme=0",
  },
  {
    title: "Horas de mentir",
    artist: "SOBA",
    type: "Producción",
    spotifyUrl: "https://open.spotify.com/embed/track/1345D2MgFbnTWvps6bVPgC?utm_source=generator&theme=0",
  },
  {
    title: "Te luces",
    artist: "SOBA",
    type: "Producción",
    spotifyUrl: "https://open.spotify.com/embed/track/3Dd6dAD3FSHfmWlwzeDqfX?utm_source=generator&theme=0",
  },
  {
    title: "En ella",
    artist: "SOBA",
    type: "Producción",
    spotifyUrl: "https://open.spotify.com/embed/track/0QqeDaLi6goe3McEQIQ7zG?utm_source=generator&theme=0",
  },
  {
    title: "Picante",
    artist: "TAYL3R",
    type: "Producción",
    spotifyUrl: "https://open.spotify.com/embed/track/29DpBBSuJ9oATK4m1sOnOM?utm_source=generator&theme=0",
  },
  {
    title: "Tussi remix",
    artist: "TAYL3R, KHA LOWY, MANTYZ",
    type: "Producción",
    spotifyUrl: "https://open.spotify.com/embed/track/5GG2aYWluwM5LI0FAV4Fgo?utm_source=generator&theme=0",
  },
  {
    title: "Pim piao",
    artist: "TAYL3R",
    type: "Producción",
    spotifyUrl: "https://open.spotify.com/embed/track/5gwz06AFzjkCT95s6OYVfk?utm_source=generator&theme=0",
  }
  ,
  {
    title: "Rápido y lento",
    artist: "ALVARODLC, LA JJ",
    type: "Producción",
    spotifyUrl: "https://open.spotify.com/embed/track/3rTaBfP6MKlCSXRyxs8eCv?utm_source=generator&theme=0",
  }
  ,
  {
    title: "Mujercita",
    artist: "ALVARODLC",
    type: "Producción",
    spotifyUrl: "https://open.spotify.com/embed/track/6a64NL9EKfi3tvRItryYk7?utm_source=generator&theme=0",
  }
  ,
  {
    title: "TUS FOTOS - Garage studios Remix",
    artist: "ALVARODLC, LA JJ, GARAGE STUDIOS",
    type: "Producción",
    spotifyUrl: "https://open.spotify.com/embed/track/4W9Is6tGlUnHhnTF8O54A4?utm_source=generator&theme=0",
  }
];

export default function SpotifyProductions() {
  // Group productions by artist
  const groupedProductions = PRODUCTIONS.reduce((acc, work) => {
    // We'll use the first artist for grouping if there are multiple
    const primaryArtist = work.artist.split(',')[0].trim();
    if (!acc[primaryArtist]) {
      acc[primaryArtist] = [];
    }
    acc[primaryArtist].push(work);
    return acc;
  }, {} as Record<string, SpotifyWork[]>);

  return (
    <section className="border-t border-card-border bg-black/20">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="mb-16 text-center animate-fade-in">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter sm:text-4xl">
            Escucha nuestras <span className="text-accent">producciones</span>
          </h2>
          <div className="mx-auto mt-4 h-1 w-20 bg-accent"></div>
          <p className="mt-6 text-lg font-medium text-muted">
            Una muestra del sonido que se trabaja en Garage Studios.
          </p>
        </div>

        <div className="space-y-20">
          {Object.entries(groupedProductions).map(([artist, works]) => (
            <div key={artist} className="animate-slide-up">
              <div className="mb-8 flex items-center gap-4">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                  {artist}
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-accent/50 to-transparent"></div>
              </div>

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {works.map((work, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col overflow-hidden rounded-2xl border border-card-border bg-card-bg transition-all hover:-translate-y-2 hover:border-accent/30 hover:shadow-[0_0_40px_rgba(0,0,0,0.8)] group"
                  >
                    <div className="p-6">
                      <div className="mb-4 inline-block rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent">
                        {work.type}
                      </div>
                      <h4 className="text-xl font-black uppercase italic tracking-tight text-white">{work.title}</h4>
                      <p className="text-sm font-medium text-muted">{work.artist}</p>
                    </div>

                    <div className="relative h-[152px] w-full px-4 pb-6">
                      <iframe
                        src={work.spotifyUrl}
                        width="100%"
                        height="152"
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className="rounded-xl shadow-lg"
                      ></iframe>
                    </div>

                    <div className="mt-auto border-t border-card-border p-4 text-center">
                      <a
                        href={work.spotifyUrl.replace('/embed', '')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-black uppercase tracking-widest text-gray-400 transition-colors hover:text-accent"
                      >
                        Escuchar en Spotify <ChevronRight className="inline-block w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-xs text-muted italic">
            ¿Quieres que tu música suene así? Contacta con nosotros para tu próximo proyecto.
          </p>
        </div>
      </div>
    </section>
  );
}
