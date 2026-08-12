import { NewCommitmentScreen } from "@/components/screens/new-commitment-screen";

type NewPageProps = {
  searchParams: Promise<{ pactId?: string; task?: string }>;
};

export default async function NewPage({ searchParams }: NewPageProps) {
  const { pactId, task } = await searchParams;
  return (
    <NewCommitmentScreen
      initialPactId={pactId}
      initialAsPersonalTask={task === "1" || task === "true"}
    />
  );
}
