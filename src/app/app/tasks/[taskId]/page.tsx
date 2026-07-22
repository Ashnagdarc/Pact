import { TaskDetailScreen } from "@/components/screens/task-detail-screen";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  return <TaskDetailScreen taskId={taskId} />;
}
