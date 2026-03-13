interface AuthorAvatarProps {
  name: string;
  photo: string | null;
  className?: string;
}

export default function AuthorAvatar({ name, photo, className = 'h-10 w-10' }: AuthorAvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (photo) {
    return <img src={photo} alt={name} className={`object-top rounded-full object-cover ${className}`} />;
  }

  return (
    <div className={`flex items-center justify-center rounded-full bg-muted font-medium text-muted-foreground ${className}`}>
      {initials}
    </div>
  );
}
