import { createContext, useContext, useMemo, type ReactNode } from "react";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { getSiteTexts } from "./site-text.functions";
import { TEXT_DEFAULTS } from "./site-text";

export const siteTextsQuery = queryOptions({
  queryKey: ["site-texts"],
  queryFn: () => getSiteTexts(),
  staleTime: 30_000,
});

const SiteTextContext = createContext<Record<string, string>>({});

export function SiteTextProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery(siteTextsQuery);

  const map = useMemo(() => {
    const merged: Record<string, string> = { ...TEXT_DEFAULTS };
    for (const row of data ?? []) {
      if (row.value?.trim()) merged[`${row.pageSlug}.${row.textKey}`] = row.value;
    }
    return merged;
  }, [data]);

  return <SiteTextContext.Provider value={map}>{children}</SiteTextContext.Provider>;
}

/** Returns a translator for a page: t("hero.title") -> CMS value or default. */
export function useT(pageSlug: string) {
  const map = useContext(SiteTextContext);
  return (key: string, fallback = "") => map[`${pageSlug}.${key}`] ?? fallback;
}
