export async function updateAnnouncementState(db, update) {
  const ref = db.ref('announcementState');
  const keepCache = () => {};
  // RTDB transaction callbacks can initially see null; retain the loaded state while validating revisions.
  ref.on('value', keepCache);
  try {
    await ref.once('value');
    return await ref.transaction(update);
  } finally { ref.off('value', keepCache); }
}
