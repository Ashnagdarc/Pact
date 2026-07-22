import { NewCommitmentScreen } from "@/components/screens/new-commitment-screen";

type NewPageProps = {
  searchParams: Promise<{ pactId?: string }>;
};

export default async function NewPage({ searchParams }: NewPageProps) {
  const { pactId } = await searchParams;
  return <NewCommitmentScreen initialPactId={pactId} />;
}
