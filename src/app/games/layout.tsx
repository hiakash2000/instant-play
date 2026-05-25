export default function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full opacity-35 blur-3xl"
        style={{
          background: "radial-gradient(circle, #ff5d8f, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-32 h-80 w-80 rounded-full opacity-30 blur-3xl"
        style={{
          background: "radial-gradient(circle, #38bdf8, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/3 -bottom-40 h-[28rem] w-[28rem] rounded-full opacity-25 blur-3xl"
        style={{
          background: "radial-gradient(circle, #a78bfa, transparent 70%)",
        }}
      />
      <div className="relative flex flex-1 flex-col">{children}</div>
    </div>
  );
}
