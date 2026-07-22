import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "deliver due reminders",
  { minutes: 15 },
  internal.reminders.deliverDue
);

export default crons;
