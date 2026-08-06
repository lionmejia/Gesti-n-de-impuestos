export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50 to-white">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
            Impuestos del Hogar
          </p>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900">
            Gestión compartida
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
}
