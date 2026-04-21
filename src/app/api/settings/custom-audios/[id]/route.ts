import { prisma } from "@/lib/db";
import { error, handleError, json, requireAuth } from "@/lib/api";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const audio = await prisma.customAudio.findUnique({ where: { id } });
    if (!audio) return error("Áudio não encontrado", 404);
    if (audio.userId !== user.id) return error("Não autorizado", 403);

    await prisma.customAudio.delete({ where: { id } });

    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
