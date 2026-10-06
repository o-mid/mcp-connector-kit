export function PageIntro({
  kicker,
  title,
  lede,
}: {
  kicker: string;
  title: string;
  lede: string;
}) {
  return (
    <section className="px-4 pb-6 pt-14 sm:px-6 sm:pt-20">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">{kicker}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl sm:leading-[1.05]">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-400">{lede}</p>
      </div>
    </section>
  );
}
