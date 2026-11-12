import { setInterval } from "node:timers";
import { Types } from "mongoose";
import Store from "../models/Store";

const STORE_TIME_ZONE = "Asia/Manila";

type StoreHours = {
  _id: Types.ObjectId;
  openTime?: string;
  closeTime?: string;
  isOpen?: boolean;
};

function parseTime(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (minute > 59) return null;

  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    if (hour === 12) hour = 0;
    if (meridiem === "PM") hour += 12;
  } else if (hour > 23) {
    return null;
  }

  return hour * 60 + minute;
}

function manilaMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: STORE_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

/** True once a store's local closing time has passed. Supports overnight hours. */
export function isPastStoreClosingTime(
  store: Pick<StoreHours, "openTime" | "closeTime">,
  date = new Date()
): boolean {
  const opening = parseTime(store.openTime);
  const closing = parseTime(store.closeTime);
  if (opening === null || closing === null || opening === closing) return false;

  const current = manilaMinutes(date);
  if (closing > opening) return current >= closing;

  // Overnight schedule, for example 8:00 PM to 2:00 AM.
  return current >= closing && current < opening;
}

export async function closeStoreIfPastHours(store: StoreHours, date = new Date()) {
  if (!store.isOpen || !isPastStoreClosingTime(store, date)) return false;

  await Store.updateOne(
    { _id: store._id, isOpen: true },
    { $set: { isOpen: false } }
  );
  store.isOpen = false;
  return true;
}

export async function closeStoresPastHours(date = new Date()) {
  const openStores = await Store.find({ isOpen: true })
    .select("_id openTime closeTime isOpen")
    .lean();
  const expiredIds = openStores
    .filter((store) => isPastStoreClosingTime(store, date))
    .map((store) => store._id);

  if (!expiredIds.length) return 0;

  const result = await Store.updateMany(
    { _id: { $in: expiredIds }, isOpen: true },
    { $set: { isOpen: false } }
  );
  return result.modifiedCount;
}

export function startStoreAutoCloseScheduler() {
  let isRunning = false;
  const closeExpiredStores = async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      const closedCount = await closeStoresPastHours();
      if (closedCount > 0) {
        console.log(`Automatically closed ${closedCount} store(s) after closing time.`);
      }
    } catch (error) {
      console.error("Store auto-close check failed:", error);
    } finally {
      isRunning = false;
    }
  };

  void closeExpiredStores();
  const timer: unknown = setInterval(() => void closeExpiredStores(), 30_000);
  if (typeof timer === "object" && timer !== null && "unref" in timer) {
    const unref = timer.unref;
    if (typeof unref === "function") unref.call(timer);
  }
}
