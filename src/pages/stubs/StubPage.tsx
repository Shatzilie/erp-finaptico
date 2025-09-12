export default function StubPage({ title }: { title: string }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Próximamente: contenido y KPIs de {title.toLowerCase()}.
      </p>
    </div>
  );
}