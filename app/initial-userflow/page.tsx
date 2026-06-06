"use client";

import SwipeDeck from "../../components/swipe-deck";

export default function InitialUserflowPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center p-4 overflow-hidden"
      style={{ backgroundColor: "lab(2.75381% 0 0)" }}
    >
      <div className="w-full max-w-4xl">
        <div className="bg-black rounded-3xl shadow-lg shadow-black/40 border border-slate-800 p-8">
          <header className="mb-8">
            <h1 className="text-3xl font-semibold text-white">
              Choose your favorites
            </h1>
            <p className="mt-2 text-sm text-slate-300 max-w-2xl">
              Swipe through the suggestions to build your personalized
              experience.
            </p>
          </header>

          <section className="flex flex-col items-center gap-4">
            <div className="w-full rounded-3xl border border-slate-800 bg-slate-950/95 p-6 shadow-inner shadow-slate-950/40">
              <SwipeDeck />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
