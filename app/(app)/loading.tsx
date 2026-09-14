export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"
        role="status"
        aria-label="Cargando"
      />
    </div>
  );
}