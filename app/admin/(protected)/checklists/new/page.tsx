import { ChecklistForm } from "@/src/components/admin/ChecklistForm/ChecklistForm";

export const runtime = "nodejs";

type NewChecklistPageProps = {
  searchParams?: Promise<{
    created?: string;
    error?: string;
  }>;
};

export default async function NewChecklistPage({ searchParams }: NewChecklistPageProps) {
  const params = await searchParams;

  return (
    <main>
      <ChecklistForm created={params?.created} error={params?.error} />
    </main>
  );
}
