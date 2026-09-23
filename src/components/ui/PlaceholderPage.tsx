import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

export function PlaceholderPage({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Section className="py-28 md:py-36">
      <Container>
        <p className="text-sm text-brass">{eyebrow}</p>
        <h1 className="mt-3 max-w-2xl text-4xl md:text-5xl">{title}</h1>
        <p className="mt-5 max-w-prose text-base text-ink-soft">
          {description}
        </p>
      </Container>
    </Section>
  );
}
