"use client";
import { ExternalLink, Music2 } from "lucide-react";

interface SpotifyArtist {
  name: string;
  subtitle: string;
  embedUrl: string;
  spotifyUrl: string;
}

// Playlist oficial real de Garage Studios
const OFFICIAL_PLAYLIST = {
  title: "Garage Studios",
  subtitle: "PLAYLIST OFICIAL",
  embedUrl: "https://open.spotify.com/embed/playlist/5gB03TgjLxXAeJLnPxfUTt?theme=0",
  spotifyUrl: "https://open.spotify.com/playlist/5gB03TgjLxXAeJLnPxfUTt",
};

const SPOTIFY_ARTISTS: SpotifyArtist[] = [
  {
    name: "Soba",
    subtitle: "Top tracks / Garage Studios",
    embedUrl: "https://open.spotify.com/embed/artist/4Ty0CXvHd3xj2Aul7SZGOX?theme=0",
    spotifyUrl: "https://open.spotify.com/intl-es/artist/4Ty0CXvHd3xj2Aul7SZGOX",
  },
  {
    name: "Lejii",
    subtitle: "Top tracks / Garage Studios",
    embedUrl: "https://open.spotify.com/embed/artist/69EhaiOgupBVTheEn3hiZy?theme=0",
    spotifyUrl: "https://open.spotify.com/intl-es/artist/69EhaiOgupBVTheEn3hiZy",
  },
  {
    name: "AlvaroDLC",
    subtitle: "Top tracks / Garage Studios",
    embedUrl: "https://open.spotify.com/embed/artist/7bhcIAOroiXKvLlfbMZVTz?theme=0",
    spotifyUrl: "https://open.spotify.com/intl-es/artist/7bhcIAOroiXKvLlfbMZVTz",
  },
  {
    name: "Tayl3r",
    subtitle: "Top tracks / Garage Studios",
    embedUrl: "https://open.spotify.com/embed/artist/2NyttLXvkkLjhP4fRkiJi5?theme=0",
    spotifyUrl: "https://open.spotify.com/intl-es/artist/2NyttLXvkkLjhP4fRkiJi5",
  },
  {
    name: "JoZeyy",
    subtitle: "Top tracks / Garage Studios",
    embedUrl: "https://open.spotify.com/embed/artist/0YkoClBB97wTJQcZF8cvCY?theme=0",
    spotifyUrl: "https://open.spotify.com/intl-es/artist/0YkoClBB97wTJQcZF8cvCY",
  },
];

export default function SpotifyShowcase() {
  return (
    <section className="relative overflow-hidden border-t border-card-border bg-[#050505] py-24">
      {/* Luces de fondo sutiles para ambiente de estudio */}
      <div className="absolute top-1/4 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/3 blur-[120px] pointer-events-none z-0"></div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        
        {/* ── Cabecera ── */}
        <div className="mb-16 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1 text-xs font-black uppercase tracking-widest text-accent">
            <Music2 className="h-3 w-3" />
            <span>Producciones</span>
          </div>
          <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white sm:text-5xl">
            Escucha nuestro <span className="text-accent drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">sonido</span>
          </h2>
          <div className="mx-auto mt-4 h-1.5 w-16 rounded-full bg-accent"></div>
          <p className="mx-auto mt-6 max-w-xl text-base font-semibold text-gray-400 sm:text-lg">
            Producciones, artistas y proyectos que han pasado por Garage Studios.
          </p>
        </div>

        {/* ── Bloque Principal: Playlist Oficial (Ultra Dark) ── */}
        <div className="mx-auto mb-20 max-w-3xl">
          <div className="group overflow-hidden rounded-2xl border border-white/10 bg-black p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-all duration-500 hover:border-accent/30 hover:shadow-[0_0_60px_rgba(245,158,11,0.08)]">
            
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-accent">{OFFICIAL_PLAYLIST.subtitle}</span>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white mt-1">
                  {OFFICIAL_PLAYLIST.title}
                </h3>
              </div>
              <a
                href={OFFICIAL_PLAYLIST.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/30 px-4 py-2 text-xs font-bold text-[#1DB954] hover:bg-[#1DB954] hover:text-black hover:scale-105 transition-all shadow-[0_0_15px_rgba(29,185,84,0.05)]"
              >
                <span>Abrir en Spotify</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Embed grande de Spotify Playlist con wrapper oscuro */}
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black p-0.5 shadow-2xl">
              <iframe
                src={OFFICIAL_PLAYLIST.embedUrl}
                width="100%"
                height="352"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="opacity-95 transition-opacity duration-300 group-hover:opacity-100"
              ></iframe>
            </div>
          </div>
        </div>

        {/* ── Grid Inferior: Artistas y Referencias ── */}
        <div>
          <div className="mb-8 flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-lg font-black uppercase tracking-wider text-white/90">
              Referencias y Producciones
            </h3>
            <span className="text-xs font-bold text-muted uppercase tracking-widest">
              {SPOTIFY_ARTISTS.length} artistas reales
            </span>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {SPOTIFY_ARTISTS.map((artist, idx) => {
              // Si es el quinto elemento (último), en desktop (md) hacemos que se centre y ocupe dos columnas de forma simétrica
              const isLastOdd = idx === SPOTIFY_ARTISTS.length - 1 && SPOTIFY_ARTISTS.length % 2 !== 0;
              
              return (
                <div
                  key={idx}
                  className={`group flex flex-col justify-between rounded-2xl border border-white/10 bg-black p-6 shadow-[0_0_40px_rgba(0,0,0,0.7)] transition-all duration-300 hover:-translate-y-1 hover:border-accent/20 hover:shadow-[0_0_35px_rgba(245,158,11,0.05)] ${
                    isLastOdd ? "md:col-span-2 md:max-w-2xl md:mx-auto md:w-full" : ""
                  }`}
                >
                  {/* Cabecera de la Card de Artista */}
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h4 className="truncate text-xl font-black uppercase italic tracking-tight text-white group-hover:text-accent transition-colors">
                        {artist.name}
                      </h4>
                      <p className="truncate text-xs font-bold text-muted mt-0.5">
                        {artist.subtitle}
                      </p>
                    </div>
                    <a
                      href={artist.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/30 px-3 py-1.5 text-xs font-bold text-[#1DB954] hover:bg-[#1DB954] hover:text-black hover:border-transparent transition-all shadow-[0_0_15px_rgba(29,185,84,0.05)]"
                    >
                      <span>Abrir</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  {/* Spotify Artist Embed (con wrapper oscuro para aislar los colores del iframe) */}
                  <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black p-0.5 shadow-lg">
                    <iframe
                      src={artist.embedUrl}
                      width="100%"
                      height="352"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="opacity-95 group-hover:opacity-100 transition-opacity duration-300"
                    ></iframe>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
