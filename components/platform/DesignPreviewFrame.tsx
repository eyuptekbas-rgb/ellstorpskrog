import TenantThemeStyles from "@/components/tenant/TenantThemeStyles";
import {
  getConceptLayoutForTemplate,
  type ConceptLayoutId,
} from "@/lib/tenant/concept-layouts";
import {
  getTemplate,
  resolveTenantTheme,
  type TenantTemplateId,
} from "@/lib/tenant/templates";

export type PreviewPage = "home" | "menu" | "kontakt" | "booking";

type Props = {
  templateId: TenantTemplateId;
  page: PreviewPage;
};

function PreviewShell({
  templateId,
  page,
  layoutId,
  children,
}: {
  templateId: TenantTemplateId;
  page: PreviewPage;
  layoutId: ConceptLayoutId;
  children: React.ReactNode;
}) {
  const theme = resolveTenantTheme(templateId);

  return (
    <div
      data-template={templateId}
      data-concept-layout={layoutId}
      className="relative min-h-full text-[var(--foreground)]"
      style={{
        background: "var(--background)",
        fontFamily: "var(--font-body)",
      }}
    >
      <TenantThemeStyles theme={theme} />
      {children}
      <p className="sr-only">
        {getTemplate(templateId).conceptLabel} — {page}
      </p>
    </div>
  );
}

function MiniNav({ layoutId }: { layoutId: ConceptLayoutId }) {
  if (layoutId === "menu-first") {
    return (
      <div className="concept-nav concept-nav--drawer border-t border-white/10">
        <div className="concept-nav__drawer-bar !min-h-[2.5rem] !py-1">
          <span className="concept-nav__drawer-menu !py-1.5 !text-[9px]">Meny</span>
          <div className="concept-nav__drawer-links !text-[8px]">
            <span className="is-active">Hem</span>
            <span>Boka</span>
            <span>Kontakt</span>
          </div>
        </div>
      </div>
    );
  }

  if (layoutId === "delivery-app") {
    return (
      <div className="concept-nav concept-nav--equal border-t border-white/10">
        <div className="concept-nav__bar !min-h-[2.25rem]">
          {["Hem", "Meny", "Kontakt", "Boka"].map((l, i) => (
            <span
              key={l}
              className={`concept-nav__tab !text-[8px] ${i === 1 ? "concept-nav__tab--active" : ""}`}
            >
              {l}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (layoutId === "fast-order") {
    return (
      <div className="concept-nav concept-nav--conversion border-t border-white/10 px-2 py-1">
        <span className="concept-nav__order-cta !py-1.5 !text-[9px]">Beställ</span>
      </div>
    );
  }

  if (layoutId === "booking-first") {
    return (
      <div className="concept-nav concept-nav--booking-fab border-t border-white/10">
        <div className="concept-nav__bar concept-nav__bar--booking !min-h-[2.5rem]">
          <span className="concept-nav__tab !text-[8px]">Meny</span>
          <span className="concept-nav__booking-fab !h-9 !w-9 !text-[7px]">Boka</span>
          <span className="concept-nav__tab !text-[8px]">Kontakt</span>
        </div>
      </div>
    );
  }

  return (
    <div className="site-bottom-nav relative border-t border-white/10">
      <div className="site-bottom-nav-bar !min-h-[2.25rem] !py-0">
        {["Hem", "Kontakt", "Meny", "Boka", "Konto"].map((l) => (
          <span key={l} className="site-bottom-nav-item !py-0 !text-[7px]">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

function HomePreview({ layoutId }: { layoutId: ConceptLayoutId }) {
  switch (layoutId) {
    case "delivery-app":
      return (
        <div className="px-2 pb-2 pt-1">
          <div className="concept-header concept-header--delivery relative !static mb-2 rounded-lg">
            <div className="concept-header__search-row !mb-1 !py-1 !text-[8px]">Sök…</div>
            <div className="concept-header__meta-row !text-[9px]">
              <span className="font-bold">Ellstorps Krog</span>
              <span>Varukorg</span>
            </div>
          </div>
          <div className="mb-2 h-24 rounded-xl bg-[var(--brand-elevated)]" />
          <span className="btn-primary mb-2 flex w-full justify-center !py-1.5 !text-[9px]">Beställ mat</span>
          <p className="section-label mb-1 !text-[8px]">Populärt</p>
          <div className="flex gap-1.5 overflow-hidden">
            {[1, 2].map((i) => (
              <div key={i} className="card-premium h-16 w-[45%] shrink-0 rounded-lg" />
            ))}
          </div>
        </div>
      );
    case "booking-first":
      return (
        <div className="px-2 pb-2 pt-1">
          <div className="mb-2 min-h-[120px] rounded-xl bg-[var(--brand-elevated)] p-3">
            <p className="section-label !text-[8px]">Bordsbokning</p>
            <h1 className="text-display mt-1 text-lg leading-tight">Boka din kväll</h1>
            <span className="btn-primary mt-2 inline-flex !px-2 !py-1 !text-[8px]">Boka bord</span>
          </div>
          <div className="card-premium rounded-lg p-2 text-[9px]">Öppettider · Öppet nu</div>
        </div>
      );
    case "card-modular":
      return (
        <div className="px-2 pb-2 pt-1">
          <div className="mb-2 h-20 rounded-xl bg-[var(--brand-elevated)]" />
          <div className="grid grid-cols-2 gap-1.5">
            {["Beställ", "Boka", "Kontakt", "Öppet"].map((t) => (
              <div key={t} className="card-premium rounded-lg p-2 text-[9px] font-semibold">{t}</div>
            ))}
          </div>
        </div>
      );
    case "menu-first":
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center px-4 text-center">
          <p className="section-label !text-[8px]">Ellstorps Krog</p>
          <h1 className="text-display text-xl">Välkommen</h1>
          <span className="btn-primary mt-3 !px-3 !py-1.5 !text-[9px]">Öppna menyn</span>
        </div>
      );
    case "luxury-editorial":
      return (
        <div className="px-3 pb-2 pt-4">
          <p className="mb-3 text-[7px] uppercase tracking-[0.35em] opacity-40">Ellstorps Krog</p>
          <h1 className="text-display text-2xl leading-none">En kväll att minnas</h1>
          <p className="mt-4 text-[9px] uppercase tracking-[0.2em]">Meny →</p>
        </div>
      );
    case "scandinavian-imagery":
      return (
        <div>
          <div className="aspect-[4/5] bg-[var(--brand-elevated)]" />
          <div className="px-3 py-3">
            <h1 className="text-display text-lg">Ellstorps Krog</h1>
            <p className="text-[9px] opacity-50">Meny →</p>
          </div>
        </div>
      );
    case "gastro-pub":
      return (
        <div className="px-2 pb-2 pt-1">
          <div className="mb-2 h-16 rounded-xl bg-[var(--brand-elevated)]" />
          <p className="section-label mb-1 !text-[8px]">Hos oss</p>
          {["Quiz", "Live", "After work"].map((e) => (
            <div key={e} className="mb-1 rounded-lg border border-white/10 px-2 py-1.5 text-[9px]">{e}</div>
          ))}
        </div>
      );
    case "app-store-horizontal":
      return (
        <div className="px-2 pb-2 pt-1">
          <p className="section-label !text-[8px]">Upptäck</p>
          <h1 className="text-display mb-2 text-lg">Ellstorps Krog</h1>
          <div className="flex gap-1.5 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-premium h-20 w-[55%] shrink-0 rounded-lg" />
            ))}
          </div>
        </div>
      );
    case "fast-order":
      return (
        <div className="px-2 pb-2 pt-1">
          <h1 className="text-display text-lg">Hungry?</h1>
          <span className="btn-primary mt-2 flex w-full justify-center !py-2 !text-[10px]">Starta beställning</span>
          <div className="mt-2 flex gap-1.5 overflow-hidden">
            {[1, 2].map((i) => (
              <div key={i} className="card-premium h-14 w-[48%] shrink-0 rounded-lg" />
            ))}
          </div>
        </div>
      );
    default:
      return (
        <div className="px-2 pb-2 pt-1">
          <div
            className="relative mb-2 overflow-hidden rounded-xl px-3 py-8"
            style={{ background: "var(--hero-gradient), var(--brand-elevated)" }}
          >
            <p className="section-label mb-1 !text-[8px]">Restaurang · Malmö</p>
            <h1 className="text-display text-base leading-tight">Smakrik mat</h1>
            <div className="mt-2 flex gap-1">
              <span className="btn-primary !px-2 !py-1 !text-[8px]">Beställ</span>
              <span className="btn-secondary !px-2 !py-1 !text-[8px]">Meny</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {["Meny", "Boka", "Ring", "Hämta"].map((a) => (
              <div key={a} className="rounded-lg border border-white/10 p-2 text-[8px]">{a}</div>
            ))}
          </div>
        </div>
      );
  }
}

function MenuPreview({ layoutId }: { layoutId: ConceptLayoutId }) {
  const grid = layoutId === "delivery-app" || layoutId === "card-modular" || layoutId === "app-store-horizontal";

  return (
    <div className="px-2 pb-2 pt-1">
      {layoutId === "delivery-app" && (
        <p className="mb-1 text-[8px] opacity-45">Beställ nu</p>
      )}
      {layoutId === "luxury-editorial" ? (
        <p className="mb-2 text-[7px] uppercase tracking-[0.3em] opacity-40">Meny</p>
      ) : null}
      <h1 className="text-display mb-1 text-base">
        {layoutId === "fast-order" ? "Snabbmeny" : "Meny"}
      </h1>
      <div className="mb-2 flex gap-1 overflow-hidden">
        {["Pizza", "Kebab", "Dryck"].map((c, i) => (
          <span
            key={c}
            className={`shrink-0 rounded-full px-2 py-0.5 text-[8px] ${i === 0 ? "bg-[var(--brand-copper)] text-white" : "border border-white/10"}`}
          >
            {c}
          </span>
        ))}
      </div>
      {grid ? (
        <div className="grid grid-cols-2 gap-1.5">
          {["Margherita", "Kebab", "Capricciosa", "Cola"].map((n) => (
            <div key={n} className="card-premium rounded-lg p-1.5">
              <div className="mb-1 h-8 rounded bg-[var(--brand-elevated)]" />
              <p className="text-[9px] font-semibold">{n}</p>
              <p className="text-[8px] opacity-40">119 kr</p>
            </div>
          ))}
        </div>
      ) : (
        ["Margherita", "Kebabpizza", "Capricciosa"].map((n) => (
          <div key={n} className="flex items-center justify-between border-b border-white/10 py-1.5">
            <div>
              <p className="text-[10px] font-semibold">{n}</p>
              <p className="text-[8px] opacity-40">119 kr</p>
            </div>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand-copper)] text-[10px] text-white">+</span>
          </div>
        ))
      )}
    </div>
  );
}

function KontaktPreview({ layoutId }: { layoutId: ConceptLayoutId }) {
  if (layoutId === "card-modular") {
    return (
      <div className="px-2 pb-2 pt-1">
        <h1 className="text-display mb-2 text-base">Kontakt</h1>
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          <div className="card-premium rounded-lg p-2 text-[9px]">Ring</div>
          <div className="card-premium rounded-lg p-2 text-[9px]">Karta</div>
        </div>
        <div className="card-premium rounded-lg p-2 text-[9px]">Sallerupsvägen 28D</div>
      </div>
    );
  }

  if (layoutId === "luxury-editorial") {
    return (
      <div className="px-3 pb-2 pt-3">
        <p className="mb-2 text-[7px] uppercase tracking-[0.35em] opacity-40">Kontakt</p>
        <h1 className="text-display text-xl">Reach us</h1>
        <p className="mt-3 text-[9px] opacity-50">Sallerupsvägen 28D</p>
      </div>
    );
  }

  if (layoutId === "scandinavian-imagery") {
    return (
      <div className="px-2 pb-2 pt-1">
        <div className="mb-2 aspect-video rounded-lg bg-[var(--brand-elevated)]" />
        <h1 className="text-display text-base">Ellstorps Krog</h1>
        <p className="text-[9px] opacity-50">040-18 42 68</p>
      </div>
    );
  }

  return (
    <div className="px-2 pb-2 pt-1">
      <h1 className="text-display mb-2 text-base">Kontakta oss</h1>
      <div className="mb-2 grid grid-cols-2 gap-1">
        <span className="btn-primary flex justify-center !py-1.5 !text-[8px]">Ring</span>
        <span className="btn-secondary flex justify-center !py-1.5 !text-[8px]">Karta</span>
      </div>
      <div className="card-premium space-y-1 rounded-lg p-2 text-[9px]">
        <p>Sallerupsvägen 28D</p>
        <p className="text-[var(--brand-copper)]">040-18 42 68</p>
      </div>
    </div>
  );
}

function BookingPreview({ layoutId }: { layoutId: ConceptLayoutId }) {
  return (
    <div className="relative flex min-h-[220px] items-end px-2 pb-2 pt-1">
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative z-10 w-full rounded-xl border border-white/10 bg-[var(--brand-surface)] p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold">Boka bord</p>
          <span className="text-[10px] opacity-40">✕</span>
        </div>
        {layoutId === "booking-first" && (
          <p className="mb-2 text-[8px] text-[var(--brand-gold)]">Prioriterad bokning</p>
        )}
        <div className="mb-2 grid grid-cols-2 gap-1">
          <div className="rounded-lg border border-white/10 px-2 py-1.5 text-[8px]">Datum</div>
          <div className="rounded-lg border border-white/10 px-2 py-1.5 text-[8px]">Tid</div>
        </div>
        <div className="mb-2 rounded-lg border border-white/10 px-2 py-1.5 text-[8px]">Antal gäster</div>
        <span className="btn-primary flex w-full justify-center !py-1.5 !text-[9px]">
          {layoutId === "luxury-editorial" ? "Confirm reservation" : "Bekräfta bokning"}
        </span>
      </div>
    </div>
  );
}

export default function DesignPreviewFrame({ templateId, page }: Props) {
  const layout = getConceptLayoutForTemplate(templateId);

  const body =
    page === "home" ? (
      <HomePreview layoutId={layout.id} />
    ) : page === "menu" ? (
      <MenuPreview layoutId={layout.id} />
    ) : page === "kontakt" ? (
      <KontaktPreview layoutId={layout.id} />
    ) : (
      <BookingPreview layoutId={layout.id} />
    );

  return (
    <PreviewShell templateId={templateId} page={page} layoutId={layout.id}>
      <div className="flex min-h-[220px] flex-col">
        <div className="flex-1">{body}</div>
        <MiniNav layoutId={layout.id} />
      </div>
    </PreviewShell>
  );
}
