"use client";

import { useEffect, useSyncExternalStore } from "react";

import { SIGNED_URL_SECONDS, signUrls, type Bucket } from "@/lib/data/files";
import { createClient } from "@/lib/supabase/client";

/*
 * Links to private files, shared by every component that shows one. Requests made in
 * the same moment (a list of avatars) go out together, and links are renewed before
 * they expire so long-open pages keep working.
 */

interface Entry {
  url: string;
  expiresAt: number;
}

/** Renew a link this long before it expires. */
const RENEW_EARLY_MS = 5 * 60 * 1000;

const links = new Map<string, Entry>();
const waiting = new Map<Bucket, Set<string>>();
const inFlight = new Set<string>();
const listeners = new Set<() => void>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const keyOf = (bucket: Bucket, path: string) => `${bucket}/${path}`;

function emit() {
  for (const listener of listeners) listener();
}

async function flush() {
  flushTimer = null;
  const batches = [...waiting.entries()];
  waiting.clear();
  for (const [bucket, paths] of batches) {
    const list = [...paths];
    try {
      const signed = await signUrls(createClient(), bucket, list);
      const expiresAt = Date.now() + SIGNED_URL_SECONDS * 1000;
      for (const [path, url] of signed) links.set(keyOf(bucket, path), { url, expiresAt });
    } catch (error) {
      console.warn(`Couldn't get links for ${bucket}`, error);
    } finally {
      for (const path of list) inFlight.delete(keyOf(bucket, path));
      emit();
    }
  }
}

/** Asks for a link if there isn't a fresh one. */
function ensure(bucket: Bucket, path: string) {
  const key = keyOf(bucket, path);
  const entry = links.get(key);
  if ((entry && entry.expiresAt - Date.now() > RENEW_EARLY_MS) || inFlight.has(key)) return;
  inFlight.add(key);
  if (!waiting.has(bucket)) waiting.set(bucket, new Set());
  waiting.get(bucket)!.add(path);
  flushTimer ??= setTimeout(() => void flush(), 0);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** A link to a private file, or null while it loads (or when there's no file). */
export function useSignedUrl(bucket: Bucket, path: string | null): string | null {
  const url = useSyncExternalStore(
    subscribe,
    () => (path ? (links.get(keyOf(bucket, path))?.url ?? null) : null),
    () => null,
  );

  useEffect(() => {
    if (!path) return;
    ensure(bucket, path);
    // Check again before the link expires; ensure() renews it only if needed.
    const timer = setInterval(() => ensure(bucket, path), RENEW_EARLY_MS);
    return () => clearInterval(timer);
  }, [bucket, path]);

  return url;
}
