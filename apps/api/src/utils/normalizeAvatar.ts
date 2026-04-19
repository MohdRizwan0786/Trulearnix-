const UPLOADS_BASE = 'https://api.peptly.in/uploads';

export function normalizeAvatar(avatar: string | null | undefined): string {
  if (!avatar) return '';
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
  return `${UPLOADS_BASE}/${avatar}`;
}

/** Normalize avatar on any object or array of objects in-place */
export function normalizeAvatars(data: any | any[]): void {
  const items: any[] = Array.isArray(data) ? data : [data];
  for (const item of items) {
    if (!item) continue;
    if (item.avatar !== undefined) item.avatar = normalizeAvatar(item.avatar);
    // Handle populated sub-documents (e.g. student, user, mentor)
    for (const key of ['student', 'user', 'mentor', 'teacher', 'instructor']) {
      if (item[key]?.avatar !== undefined) item[key].avatar = normalizeAvatar(item[key].avatar);
    }
  }
}
