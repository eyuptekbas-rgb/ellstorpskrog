import BottomNav from "../components/BottomNav";

export default function Home() {
  return (
    <main className="bg-black text-white">

      {/* HERO */}
      <section className="relative w-full h-[320px] overflow-hidden">

        {/* IMAGE */}
        <img
          src="/hero.jpg"
          alt="Ellstorps Krog"
          className="w-full h-full object-cover scale-110"
        />

        {/* DARK OVERLAY */}
        <div className="absolute inset-0 bg-black/80"></div>

        {/* CENTER TEXT */}
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-white text-xl font-semibold text-center px-4">
            Välkommen till Ellstorps Krog
          </h1>
        </div>

      </section>

      {/* CONTENT PLACEHOLDER */}
      <section className="px-6 py-10 text-center">
        <p className="text-white/70 text-sm">
          
        </p>
      </section>

      {/* BOTTOM NAV */}
      <BottomNav />

    </main>
  );
}
