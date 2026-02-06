import BottomNav from "../components/BottomNav";

export default function Home() {
  return (
    <main className="bg-black text-white">

      {/* HERO SECTION */}
      <section className="relative w-full h-[75vh] overflow-hidden">

        {/* IMAGE */}
        <img
          src="/hero.jpg"
          alt="Ellstorps Krog"
          className="w-full h-full object-cover"
        />

        {/* DARK OVERLAY */}
        <div className="absolute inset-0 bg-black/60"></div>

        {/* CENTER TEXT */}
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-white text-3xl font-semibold text-center px-4">
            Välkommen till Ellstorps Krog
          </h1>
        </div>

      </section>

      {/* BOTTOM NAV */}
      <BottomNav />

    </main>
  );
}
