type SearchPageProps = {
  searchParams: { q?: string };
};

export default function SearchPage({ searchParams }: SearchPageProps) {
  const q = searchParams.q?.trim() ?? "";

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Search
      </h1>
      {q ? (
        <p className="mt-2 text-muted-foreground">
          Results for &quot;{q}&quot; will appear here.
        </p>
      ) : (
        <p className="mt-2 text-muted-foreground">
          Use the search bar in the header to find products.
        </p>
      )}
    </div>
  );
}
