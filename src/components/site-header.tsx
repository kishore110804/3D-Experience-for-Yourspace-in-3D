import { Navbar } from "./ui/navbar";

export function SiteHeader() {
  return (
    <header className="w-full z-40">
      <div className="flex justify-center">
        <Navbar />
      </div>
    </header>
  );
}
