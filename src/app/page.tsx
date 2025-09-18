import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <section className="pt-16 sm:pt-24 pb-0 animate-in fade-in-50 slide-in-from-top-2 duration-500">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Security and compliance marketing, reimagined
          </h1>
          <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
            Build a performant, CMS-driven SaaS marketing site using modern UI components.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg">Get started</Button>
            <Button size="lg" variant="outline">Learn more</Button>
          </div>
        </div>
      </section>

      <section className="pb-0 sm:pb-0">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {["CMS-powered pages", "Composable blocks", "Dark mode ready"].map((title, i) => (
            <Card key={i} className="transition-all hover:shadow-md hover:-translate-y-0.5">
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Modern primitives to ship faster with confidence.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Tailwind v4 + shadcn/ui with accessible, themeable components.
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
