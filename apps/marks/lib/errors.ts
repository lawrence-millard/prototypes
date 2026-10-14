export type ActionState = { error?: string };

export function rethrowNext(error: unknown): void {
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string"
  ) {
    const digest = (error as { digest: string }).digest;
    if (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND") || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK")) {
      throw error;
    }
  }
}

export function actionError(error: unknown): ActionState {
  rethrowNext(error);
  if (error instanceof Error && error.message === "DATABASE_URL is not set") {
    return { error: "Database is not configured." };
  }
  const message = error instanceof Error ? error.message : "";
  if (/postgres(ql)?:\/\//i.test(message) || /password/i.test(message)) console.error("database error");
  else if (message) console.error(message.slice(0, 200));
  return { error: "Could not save." };
}
