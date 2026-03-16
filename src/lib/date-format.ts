export function formatTimeAgo(dateStr: string | null) {
  if (!dateStr) return "";

  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));

  if (minutes < 60) return `${minutes}min atras`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atras`;

  const days = Math.floor(hours / 24);
  return `${days}d atras`;
}
