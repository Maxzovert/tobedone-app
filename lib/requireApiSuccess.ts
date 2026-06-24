import { ApiResult } from "@/lib/api";

export async function requireApiSuccess<T>(result: ApiResult<T>): Promise<T> {
  if (!result.success) {
    throw new Error(
      result.error ??
        (result.httpStatus
          ? `Request failed (${result.httpStatus})`
          : "Request failed")
    );
  }
  return (result.data ?? ({} as T)) as T;
}
