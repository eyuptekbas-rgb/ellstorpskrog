import BottomNav from "../components/BottomNav";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <main className="bg-black text-white">

      {/* HERO */}
      <section className="relative w-full h-[260px] overflow-hidden">

        {/* IMAGE */}
        <img
          src="/hero.jpg"
          alt="Ellstorps Krog"
          className="w-full h-full object-cover brightness-110"
        />

        {/* LIGHT OVERLAY */}
        <div className="absolute inset-0 bg-white/20"></div>

        {/* CENTER TEXT */}
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-white text-lg font-semibold text-center px-4 drop-shadow">
            Välkommen till Ellstorps Krog
          </h1>
        </div>

      </section>

      {/* CONTENT PLACEHOLDER */}
      <section className="px-6 py-10 text-center">
        <p className="text-white/70 text-sm">
          
        </p>
      </section>

      {/* FOOTER */}
      <Footer />

      {/* BOTTOM NAV */}
      <BottomNav />

    </main>
  );
}
