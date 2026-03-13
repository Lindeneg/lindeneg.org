interface AuthorAvatarProps {
  name: string;
  photo: string | null;
}

export default function AuthorAvatar({ name, photo }: AuthorAvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (photo) {
    return <img src={photo} alt={name} className="h-10 w-10 rounded-full object-cover" />;
  }

  return (
    <div className="capitalize flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
      {initials}
    </div>
  );
}
