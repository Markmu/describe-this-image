import { completeUsage, refundUsage, reserveUsage } from "./billing/usage";
import { assertImageAllowed, moderationReady } from "./moderation";
import { describeImage, visionReady } from "./vision";

const services = { reserveUsage, completeUsage, refundUsage, assertImageAllowed, describeImage };
type DescriptionRequest = Parameters<typeof reserveUsage>[0] & {
  image: Parameters<typeof describeImage>[0];
  language: string;
  signal?: AbortSignal;
};

export function generationReady() {
  return visionReady() && moderationReady();
}

export async function generateImageDescription(input: DescriptionRequest, dependencies = services) {
  const usage = await dependencies.reserveUsage({ userId: input.userId, guestId: input.guestId, requestId: input.requestId, batch: input.batch });
  try {
    await dependencies.assertImageAllowed(input.image, usage.reservationId, { signal: input.signal });
    const outputs = await dependencies.describeImage(input.image, input.language);
    await dependencies.completeUsage(usage.reservationId);
    return { outputs, language: input.language, remaining: usage.remaining };
  } catch (error) {
    try { await dependencies.refundUsage(usage.reservationId); }
    catch { console.error("USAGE_REFUND_PENDING", usage.reservationId); }
    throw error;
  }
}
