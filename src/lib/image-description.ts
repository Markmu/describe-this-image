import { completeUsage, refundUsage, reserveUsage } from "./billing/usage";
import { assertImageAllowed, moderationReady } from "./moderation";
import { describeImage, visionReady } from "./vision";
import type { GenerationStage } from "./admin/tracking";

const services = { reserveUsage, completeUsage, refundUsage, assertImageAllowed, describeImage };
type DescriptionRequest = Parameters<typeof reserveUsage>[0] & {
  image: Parameters<typeof describeImage>[0];
  language: string;
  signal?: AbortSignal;
  onStage?: (stage: GenerationStage, reservationId?: string) => Promise<void>;
};

export function generationReady() {
  return visionReady() && moderationReady();
}

export async function generateImageDescription(input: DescriptionRequest, dependencies = services) {
  await input.onStage?.("reservation");
  const usage = await dependencies.reserveUsage({ userId: input.userId, guestId: input.guestId, guestSource: input.guestSource, requestId: input.requestId, batch: input.batch });
  try {
    await input.onStage?.("moderation", usage.reservationId);
    await dependencies.assertImageAllowed(input.image, usage.reservationId, { signal: input.signal });
    await input.onStage?.("moderation_passed");
    await input.onStage?.("generation");
    const outputs = await dependencies.describeImage(input.image, input.language);
    await input.onStage?.("settlement");
    await dependencies.completeUsage(usage.reservationId, { language: input.language, outputs });
    return { outputs, language: input.language, remaining: usage.remaining };
  } catch (error) {
    try { await dependencies.refundUsage(usage.reservationId); await input.onStage?.("refunded"); }
    catch { console.error("USAGE_REFUND_PENDING", usage.reservationId); await input.onStage?.("refund_pending"); }
    throw error;
  }
}
