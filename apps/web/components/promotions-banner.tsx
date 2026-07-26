import { getPromotions } from "@/lib/api";

// Server Component - fetches at render time, no client-side loading state
// needed for what's effectively a marketing banner. Renders nothing until
// the owner has actually uploaded a promotion via /admin/promotions.
export async function PromotionsBanner() {
  let promotions;
  try {
    promotions = await getPromotions();
  } catch {
    // A promotions-fetch failure shouldn't take down the homepage - just
    // skip the banner for this render.
    return null;
  }

  if (promotions.length === 0) return null;

  return (
    <div className="w-full max-w-3xl px-6">
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {promotions.map((promotion) => {
          const image = (
            // eslint-disable-next-line @next/next/no-img-element -- owner-uploaded Blob URLs, arbitrary host, not worth next/image's remotePatterns coupling for a simple banner
            <img
              src={promotion.imageUrl}
              alt={promotion.title ?? ""}
              className="h-40 w-full rounded-xl object-cover sm:h-56"
            />
          );
          return (
            <div
              key={promotion.id}
              className="w-full flex-shrink-0 snap-start sm:w-[calc(50%-0.5rem)]"
            >
              {promotion.linkUrl ? (
                <a href={promotion.linkUrl} target="_blank" rel="noopener noreferrer">
                  {image}
                </a>
              ) : (
                image
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
