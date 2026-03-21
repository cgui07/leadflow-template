export function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-blush bg-red-pale px-3 py-2 text-sm text-red-dark">
      {message}
    </div>
  );
}
