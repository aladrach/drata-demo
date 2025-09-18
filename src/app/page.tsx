import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <section className="pt-16 sm:pt-24 pb-0 animate-in fade-in-50 slide-in-from-top-2 duration-500 mb-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Security and compliance marketing, reimagined
          </h1>
          <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
            Build a performant, CMS-driven SaaS marketing site using modern UI components.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/features/demo-feature">View Sample Feature Page</Link>
            </Button>
            <Button size="lg" variant="outline">
              <Link href="/docs">View Docs</Link>
            </Button>
            <Button size="lg" variant="outline">
              <Link href="/chat">Open AI chat</Link>
            </Button>
            <Button size="lg" variant="outline">
              <Link href="/personalization">Personalization Plan</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="pb-0 sm:pb-0">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "CMS-powered pages",
              description: "Publish content from your CMS—no code deploys needed.",
              details:
                "Render marketing pages with modern UI components while keeping content separate from presentation.",
            },
            {
              title: "Composable blocks",
              description: "Build pages from reusable, configurable blocks.",
              details:
                "Mix and match sections like hero, features, testimonials, and CTAs to ship faster.",
            },
            {
              title: "Dark mode ready",
              description: "Adaptive theming that respects user preferences.",
              details:
                "All components support light/dark themes via Tailwind and shadcn/ui tokens.",
            },
          ].map((item, i) => (
            <Card key={i} className="transition-all hover:shadow-md hover:-translate-y-0.5">
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {item.details}
              </CardContent>
              <CardFooter>
                <Button variant="ghost" asChild>
                  <Link href="/features/demo-feature">Explore</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
