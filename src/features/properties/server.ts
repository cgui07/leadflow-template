import { prisma } from "@/lib/db";
import type { AIConfig } from "@/lib/ai";
import { extractPropertyData } from "@/lib/ai";

export async function extractAndSaveProperty(
  userId: string,
  rawText: string,
  aiConfig: AIConfig,
) {
  const extracted = await extractPropertyData(aiConfig, rawText);

  const property = await prisma.properties.create({
    data: {
      user_id: userId,
      raw_text: rawText,
      title: extracted?.title ?? null,
      type: extracted?.type ?? null,
      purpose: extracted?.purpose ?? null,
      price: extracted?.price ?? null,
      area: extracted?.area ?? null,
      bedrooms: extracted?.bedrooms ?? null,
      bathrooms: extracted?.bathrooms ?? null,
      parking_spots: extracted?.parkingSpots ?? null,
      address: extracted?.address ?? null,
      neighborhood: extracted?.neighborhood ?? null,
      city: extracted?.city ?? null,
      state: extracted?.state ?? null,
      amenities: extracted?.amenities ?? [],
      description: extracted?.description ?? null,
    },
  });

  return property;
}

export async function listProperties(userId: string) {
  return prisma.properties.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
  });
}

export async function deleteProperty(userId: string, propertyId: string) {
  const property = await prisma.properties.findFirst({
    where: { id: propertyId, user_id: userId },
  });
  if (!property) throw new Error("NOT_FOUND");
  await prisma.properties.delete({ where: { id: propertyId } });
}
