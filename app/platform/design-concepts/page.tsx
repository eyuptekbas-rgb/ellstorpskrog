import DesignConceptGallery from "@/components/platform/DesignConceptGallery";
import { ORDINA } from "@/lib/tenant/branding";

export const metadata = {
  title: "Designkoncept — Ordina",
};

export default function DesignConceptsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#a78bfa]">
        Ordina Platform
      </p>
      <h1
        className="mt-2 text-3xl font-bold text-white"
        style={{ fontFamily: "system-ui" }}
      >
        10 designkoncept
      </h1>
      <p className="mt-3 max-w-2xl text-white/55">
        Jämför 10 mobil-först layoutkoncept byggda på samma Ellstorps Krog-applikation.
        Mockups nedan visar hem, meny, kontakt och bokning per koncept.
      </p>

      <div className="mt-8">
        <DesignConceptGallery />
      </div>

      <p className="mt-10 text-center text-xs text-white/30">
        Ordina · {ORDINA.name}
      </p>
    </div>
  );
}
