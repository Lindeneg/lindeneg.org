interface EmptyStateProps {
  message: string;
}

export default function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="py-24 text-center">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
