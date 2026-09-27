import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { InlineRichText, RichText } from "@/components/ui/RichText";
import { richHtmlToPlainText } from "@/lib/richText/server";
import { cn } from "@/lib/utils";

// Chairman / MD message on the About page — a full-bleed portrait beside
// the message, closed by a signature block. Every text field is rich
// text; italic words in the heading take the gold accent (see
// `.leader-heading` in globals.css). Without a photo the text simply
// centres in the content column.
export function LeadershipMessage({
  heading,
  message,
  name,
  role,
  photoUrl,
}: {
  heading: string;
  message: string;
  name: string;
  role: string;
  photoUrl: string | null;
}) {
  const plainName = richHtmlToPlainText(name);
  const hasSignature = !!plainName || !!richHtmlToPlainText(role);

  const content = (
    <div className={cn("w-full", photoUrl ? "max-w-xl" : "mx-auto max-w-2xl")}>
      <InlineRichText
        as="h2"
        html={heading}
        className="leader-heading text-4xl leading-[1.1] md:text-5xl lg:text-[3rem]"
      />
      <RichText html={message} className={cn("text-base leading-relaxed text-ink-soft", richHtmlToPlainText(heading) && "mt-7")} />

      {hasSignature && (
        <div className="mt-10 border-t border-limestone-300 pt-7">
          <InlineRichText as="p" html={name} className="font-display text-2xl text-ink" />
          <InlineRichText
            as="p"
            html={role}
            className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-brass"
          />
        </div>
      )}
    </div>
  );

  if (!photoUrl) {
    return (
      <section className="bg-white py-20 md:py-28">
        <Container>{content}</Container>
      </section>
    );
  }

  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-2">
        {/* Portrait: stacked above the text on mobile/tablet, a full-height
            column flush with the viewport edge on desktop. */}
        <div className="relative aspect-[4/5] max-h-[620px] w-full overflow-hidden bg-limestone-200 sm:aspect-[4/3] lg:aspect-auto lg:max-h-none lg:min-h-[640px]">
          <Image
            src={photoUrl}
            alt={plainName || "Portrait"}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover object-top"
          />
        </div>
        <div className="flex items-center px-6 py-14 md:px-10 md:py-20 lg:px-16 lg:py-24 xl:px-24">
          {content}
        </div>
      </div>
    </section>
  );
}
