import { InviteScreen } from "@/components/screens/invite-screen";

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  return <InviteScreen token={token} />;
}
