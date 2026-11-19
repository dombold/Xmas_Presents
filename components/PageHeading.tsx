export default function PageHeading({ title, intro }: { title: string; intro?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      {intro && <p className="mt-2 text-muted">{intro}</p>}
    </div>
  );
}
