import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { InlineRichText, RichText } from "@/components/ui/RichText";
import { richHtmlToPlainText } from "@/lib/richText/server";
import { cn } from "@/lib/utils";

// Chairman / MD message on the About page: a framed portrait card
// (fixed 4:5 size, so a long message never stretches the photo) beside
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
  const hasHeading = !!richHtmlToPlainText(heading);

  const signature = hasSignature && (
    <div>
      <InlineRichText as="p" html={name} className="font-display text-2xl text-ink" />
      <InlineRichText as="p" html={role} className="mt-1.5 text-xs font-medium uppercase tracking-[0.18em] text-brass" />
    </div>
  );

  const text = (
    <div className="relative min-w-0">
      {/* Large opening quote mark — sits behind the heading. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-1 -top-10 select-none font-display text-[7rem] leading-none text-garden-100 sm:-top-12 sm:text-[8rem]"
      >
        &ldquo;
      </span>
      <div className="relative">
        {hasHeading && (
          <InlineRichText as="h2" html={heading} className="leader-heading text-3xl leading-[1.15] sm:text-4xl lg:text-[2.75rem]" />
        )}
        <RichText
          html={message}
          className={cn("max-w-[62ch] text-base leading-relaxed text-ink-soft md:text-[1.0625rem]", hasHeading && "mt-6")}
        />
      </div>
    </div>
  );

  if (!photoUrl) {
    return (
      <section className="bg-white py-20 md:py-28">
        <Container>
          <div className="mx-auto max-w-2xl">
            {text}
            {signature && <div className="mt-10 border-t border-limestone-300 pt-7">{signature}</div>}
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="bg-white py-16 md:py-24">
      <Container>
        <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] md:gap-12 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] lg:gap-20">
          {/* Portrait card: centred and modest on phones, a fixed-size
              column on larger screens that stays in view while a long
              message scrolls past. */}
          <figure className="mx-auto w-full max-w-[16rem] sm:max-w-[18rem] md:sticky md:top-28 md:mx-0 md:max-w-none">
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute inset-0 translate-x-3 translate-y-3 rounded-[1.75rem] border-2 border-brass-light/50 bg-brass-50/60 sm:translate-x-4 sm:translate-y-4"
              />
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-limestone-200 shadow-card-hover ring-1 ring-ink/5">
                <Image
                  src={photoUrl}
                  alt={plainName || "Portrait"}
                  fill
                  sizes="(min-width: 1024px) 336px, (min-width: 768px) 272px, 288px"
                  className="object-cover object-top"
                />
              </div>
            </div>
            {signature && <figcaption className="mt-8 text-center md:text-left">{signature}</figcaption>}
          </figure>

          <div className="pt-6 md:pt-10">{text}</div>
        </div>
      </Container>
    </section>
  );
}
