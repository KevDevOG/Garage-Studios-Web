"use client";

interface SpotifyWork {
  title: string;
  artist: string;
  type: "Grabación" | "Mezcla" | "Masterización" | "Producción" | "Videoclip";
  spotifyUrl: string; // Embed URL format: https://open.spotify.com/embed/track/...
}

const PRODUCTIONS: SpotifyWork[] = [
  {
    title: "Muestra de Sonido 1",
    artist: "Artista de Ejemplo",
    type: "Producción",
    spotifyUrl: "https://open.spotify.com/embed/track/6T04vQzhtNhmDrklr6UKO8?utm_source=generator&theme=0",
  },
  {
    title: "Tu pelo",
    artist: "LEJI",
    type: "Producción",
    spotifyUrl: "https://open.spotify.com/embed/track/3rD3ueejc2auQ5zW5998cd?utm_source=generator&theme=0",
  },
  {
    title: "Playlist del Estudio",
    artist: "Varios Artistas",
    type: "Producción",
    spotifyUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM3M?utm_source=generator&theme=0",
  }
];

export default function SpotifyProductions() {
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

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTIONS.map((work, index) => (
            <div
              key={index}
              className="flex flex-col overflow-hidden rounded-2xl border border-card-border bg-card-bg transition-all hover:-translate-y-2 hover:border-accent/30 hover:shadow-[0_0_40px_rgba(0,0,0,0.8)] group"
            >
              <div className="p-6">
                <div className="mb-4 inline-block rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent">
                  {work.type}
                </div>
                <h3 className="text-xl font-black uppercase italic tracking-tight text-white">{work.title}</h3>
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
                  Escuchar en Spotify →
                </a>
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
