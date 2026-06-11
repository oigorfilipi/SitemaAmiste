export const DATA_SOURCE = import.meta.env.VITE_DATA_SOURCE || "local";
export const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export function isApiDataSource() {
  return DATA_SOURCE === "api" && Boolean(API_BASE_URL);
}
