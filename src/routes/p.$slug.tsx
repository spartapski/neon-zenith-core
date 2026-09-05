import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { getCustomPage } from "@/lib/public.functions";

const pageQuery = (slug: string) =>
  queryOptions({ queryKey: ["custom-page", slug], queryFn: () => getCustomPage({ data: { slug } }) });

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ context, params }) => {
    const page = await context.queryClient.ensureQueryData(pageQuery(params.slug));
    if (!page) throw notFound();
    return page;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Page"} — DODRICOM` },
      { name: "description", content: loaderData?.description ?? "Page DODRICOM générée par DodriAI." },
      { property: "og:title", content: `${loaderData?.title ?? "Page"} — DODRICOM` },
      { property: "og:description", content: loaderData?.description ?? "Page DODRICOM." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomPage,
  notFoundComponent: () => (
    <SiteLayout>
      <PageHeader eyebrow="404" title="Page introuvable" subtitle="Cette page n'existe pas ou n'est pas encore publiée.">
        <Link to="/" className="btn-gradient mt-8 inline-flex rounded-full px-6 py-3 text-sm font-semibold">
          Retour à l'accueil
        </Link>
      </PageHeader>
    </SiteLayout>
  ),
  errorComponent: () => (
    <SiteLayout>
      <PageHeader eyebrow="Erreur" title="Impossible d'afficher cette page" />
    </SiteLayout>
  ),
});

function CustomPage() {
  const { slug } = Route.useParams();
  const { data: page } = useSuspenseQuery(pageQuery(slug));
  if (!page) return null;
  return (
    <SiteLayout>
      <PageHeader eyebrow="DODRICOM" title={page.title} subtitle={page.description ?? undefined} />
      <section className="mx-auto max-w-7xl px-5 pb-24 lg:px-8">
        {page.content_css && <style dangerouslySetInnerHTML={{ __html: page.content_css }} />}
        <div className="dodri-page text-white/85" dangerouslySetInnerHTML={{ __html: page.content_html }} />
      </section>
    </SiteLayout>
  );
}
