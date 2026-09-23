import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <Section className="py-28 md:py-40">
      <Container>
        <p className="text-sm text-brass">404</p>
        <h1 className="mt-3 max-w-xl text-4xl md:text-5xl">
          This page doesn&apos;t exist
        </h1>
        <p className="mt-5 max-w-prose text-base text-ink-soft">
          The page you&apos;re looking for may have been moved or the link
          may be incorrect. Head back to the homepage or browse our
          projects.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/" variant="primary">
            Back to Home
          </Button>
          <Button href="/projects" variant="ghost">
            View Projects
          </Button>
        </div>
      </Container>
    </Section>
  );
}
