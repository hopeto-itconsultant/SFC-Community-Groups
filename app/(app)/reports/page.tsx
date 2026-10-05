import { ReportsView } from "./ReportsView";

export default async function ReportsPage({ searchParams }: PageProps<"/reports">) {
  const { group } = await searchParams;
  return <ReportsView initialGroupId={typeof group === "string" ? group : undefined} />;
}
