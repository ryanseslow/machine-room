import ImageEnhancer from "@/components/ImageEnhancer";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-12 sm:py-16">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Media Polish AI
        </h1>
        <p className="mt-3 text-base text-slate-600 sm:text-lg">
          Turn rough interior photos into professional website-ready images.
        </p>
      </header>

      <ImageEnhancer />

      <footer className="mt-12 text-center text-xs text-slate-400">
        Built for contractors, real estate, interior designers &amp; WordPress pros.
      </footer>
    </main>
  );
}
