import BottomNav from "../components/BottomNav";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white pb-20 flex items-center justify-center">
      <h1 className="text-3xl font-bold">OnlineFood</h1>
      <BottomNav />
    </main>
  );
}
