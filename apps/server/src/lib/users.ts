/** The user fields the API returns. `avatarVersion` changes whenever the picture does (cache key). */
export function publicUser(user: { id: string; email: string; name: string; avatarUpdatedAt: Date | null }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarVersion: user.avatarUpdatedAt?.toISOString() ?? null,
  };
}

export const publicUserSelect = { id: true, email: true, name: true, avatarUpdatedAt: true } as const;
