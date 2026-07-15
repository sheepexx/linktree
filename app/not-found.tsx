import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="text-center">
        <p className="text-sm text-muted">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          this page does not exist.
        </h1>
        <Link
          href="/"
          className="mt-8 inline-block bg-ink px-6 py-3 text-sm font-medium text-paper transition-opacity hover:opacity-80"
        >
          back home
        </Link>
      </div>
    </main>
  );
}
