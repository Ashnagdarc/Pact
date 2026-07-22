/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as checkIns from "../checkIns.js";
import type * as commitments from "../commitments.js";
import type * as health from "../health.js";
import type * as insights from "../insights.js";
import type * as invitations from "../invitations.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_health from "../lib/health.js";
import type * as lib_notificationTypes from "../lib/notificationTypes.js";
import type * as lib_notify from "../lib/notify.js";
import type * as lib_recoveryLabels from "../lib/recoveryLabels.js";
import type * as lib_validators from "../lib/validators.js";
import type * as notifications from "../notifications.js";
import type * as pacts from "../pacts.js";
import type * as push from "../push.js";
import type * as pushSubscriptions from "../pushSubscriptions.js";
import type * as rescue from "../rescue.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";
import type * as waitlist from "../waitlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  checkIns: typeof checkIns;
  commitments: typeof commitments;
  health: typeof health;
  insights: typeof insights;
  invitations: typeof invitations;
  "lib/auth": typeof lib_auth;
  "lib/health": typeof lib_health;
  "lib/notificationTypes": typeof lib_notificationTypes;
  "lib/notify": typeof lib_notify;
  "lib/recoveryLabels": typeof lib_recoveryLabels;
  "lib/validators": typeof lib_validators;
  notifications: typeof notifications;
  pacts: typeof pacts;
  push: typeof push;
  pushSubscriptions: typeof pushSubscriptions;
  rescue: typeof rescue;
  seed: typeof seed;
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
