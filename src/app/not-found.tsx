import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell grid min-h-[70vh] content-center gap-8 py-24">
      <p className="cartouche w-fit text-2xl">404</p>
      <h1 className="font-display text-[clamp(2.4rem,5vw,4.4rem)] leading-tight font-extrabold">This ground is empty.</h1>
      <p className="text-lg text-sumi-soft">Withdraw, and choose a better position.</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/combinations" className="inline-flex min-h-12 items-center bg-sumi px-6 text-washi">All combinations</Link>
        <Link href="/" className="inline-flex min-h-12 items-center border border-sumi px-6">Home</Link>
      </div>
    </div>
  );
}
