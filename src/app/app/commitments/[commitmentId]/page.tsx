import { Suspense } from "react";
import { CommitmentDetailScreen } from "@/components/screens/commitment-detail-screen";

type CommitmentPageProps = {
  params: Promise<{ commitmentId: string }>;
};

export default async function CommitmentPage({ params }: CommitmentPageProps) {
  const { commitmentId } = await params;
  return (
    <Suspense fallback={null}>
      <CommitmentDetailScreen commitmentId={commitmentId} />
    </Suspense>
  );
}
