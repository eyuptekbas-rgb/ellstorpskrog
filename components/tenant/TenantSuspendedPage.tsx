export default function TenantSuspendedPage({
  restaurantName,
}: {
  restaurantName: string;
}) {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
      <p className="section-label mb-3">Tillfälligt otillgänglig</p>
      <h1 className="text-display max-w-md text-2xl">{restaurantName}</h1>
      <p className="text-body mt-4 max-w-sm text-sm opacity-55">
        Denna restaurangs beställningssystem är tillfälligt pausat. Försök igen
        senare eller kontakta restaurangen direkt.
      </p>
    </div>
  );
}
