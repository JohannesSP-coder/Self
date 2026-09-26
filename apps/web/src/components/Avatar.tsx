import { useAuth } from "../auth";

/** The signed-in user's profile picture, or their initial on red while there is none. */
export function Avatar({ size }: { size?: number }) {
  const { user, avatarUrl } = useAuth();
  const style = size ? { width: size, height: size, fontSize: Math.round(size * 0.38) } : undefined;
  return (
    <span className="avatar" style={style} aria-hidden="true">
      {avatarUrl ? <img src={avatarUrl} alt="" /> : user?.name.charAt(0).toUpperCase()}
    </span>
  );
}
