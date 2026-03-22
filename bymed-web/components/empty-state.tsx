export function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-center text-neutral-600" role="status">
      {message}
    </p>
  );
}
