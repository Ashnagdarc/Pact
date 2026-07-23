/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin_wipe from "../admin_wipe.js";
import type * as checkIns from "../checkIns.js";
import type * as commitments from "../commitments.js";
import type * as crons from "../crons.js";
import type * as email from "../email.js";
import type * as evidence from "../evidence.js";
import type * as health from "../health.js";
import type * as insights from "../insights.js";
import type * as invitations from "../invitations.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_dedupe from "../lib/dedupe.js";
import type * as lib_emailHtml from "../lib/emailHtml.js";
import type * as lib_health from "../lib/health.js";
import type * as lib_notificationTypes from "../lib/notificationTypes.js";
import type * as lib_notify from "../lib/notify.js";
import type * as lib_recoveryLabels from "../lib/recoveryLabels.js";
import type * as lib_serverSecret from "../lib/serverSecret.js";
import type * as lib_time from "../lib/time.js";
import type * as lib_validators from "../lib/validators.js";
import type * as notifications from "../notifications.js";
import type * as pacts from "../pacts.js";
import type * as push from "../push.js";
import type * as pushSubscriptions from "../pushSubscriptions.js";
import type * as reminders from "../reminders.js";
import type * as rescue from "../rescue.js";
import type * as seed from "../seed.js";
import type * as tasks from "../tasks.js";
import type * as users from "../users.js";
import type * as waitlist from "../waitlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin_wipe: typeof admin_wipe;
  checkIns: typeof checkIns;
  commitments: typeof commitments;
  crons: typeof crons;
  email: typeof email;
  evidence: typeof evidence;
  health: typeof health;
  insights: typeof insights;
  invitations: typeof invitations;
  "lib/auth": typeof lib_auth;
  "lib/dedupe": typeof lib_dedupe;
  "lib/emailHtml": typeof lib_emailHtml;
  "lib/health": typeof lib_health;
  "lib/notificationTypes": typeof lib_notificationTypes;
  "lib/notify": typeof lib_notify;
  "lib/recoveryLabels": typeof lib_recoveryLabels;
  "lib/serverSecret": typeof lib_serverSecret;
  "lib/time": typeof lib_time;
  "lib/validators": typeof lib_validators;
  notifications: typeof notifications;
  pacts: typeof pacts;
  push: typeof push;
  pushSubscriptions: typeof pushSubscriptions;
  reminders: typeof reminders;
  rescue: typeof rescue;
  seed: typeof seed;
  tasks: typeof tasks;
  users: typeof users;
  waitlist: typeof waitlist;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
