import type { Metadata } from "next";
import { WaveLab } from "./wave-lab";

export const metadata: Metadata = {
  title: "Wave sketches",
  robots: { index: false, follow: false },
};

export default function WaveLabPage() {
  return (
    <div className="shell py-10 md:py-16">
      <h1 className="font-display text-[clamp(2rem,4vw,3.2rem)] leading-tight font-extrabold">Ten waves</h1>
      <p className="mt-2 mb-10 text-sumi-soft">Abstract directions for the hero. Use ← → to browse; tell me the number.</p>
      <WaveLab />
    </div>
  );
}
