export const nativeErrorMessage = (error: unknown): string => {
  if (typeof error === "string" && error.trim()) return error;
  if (error instanceof Error && error.message) return error.message;

  if (error && typeof error === "object") {
    const value = error as { message?: unknown; error?: unknown; details?: unknown };
    for (const candidate of [value.message, value.error, value.details]) {
      if (typeof candidate === "string" && candidate.trim()) return candidate;
    }

    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== "{}") return serialized;
    } catch {
      // Fall through to the generic message below.
    }
  }

  return "Unknown native operation error";
};
