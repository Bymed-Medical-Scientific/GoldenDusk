export function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-center text-muted-foreground" role="status">
      {message}
    </p>
  );
}
