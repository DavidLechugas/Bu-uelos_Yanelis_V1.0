export function Avatar({ user, size = 'small' }) {
  const initial = (user?.nombre?.trim()?.[0] ?? '?').toUpperCase();
  return (
    <span className={`avatar avatar--${size}`} aria-hidden="true">
      {user?.foto ? <img src={user.foto} alt="" /> : initial}
    </span>
  );
}
