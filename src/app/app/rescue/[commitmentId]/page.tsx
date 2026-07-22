import { RescueScreen } from "@/components/screens/rescue-screen";

type RescuePageProps = {
  params: Promise<{ commitmentId: string }>;
};

export default async function RescuePage({ params }: RescuePageProps) {
  const { commitmentId } = await params;
  return <RescueScreen commitmentId={commitmentId} />;
}
