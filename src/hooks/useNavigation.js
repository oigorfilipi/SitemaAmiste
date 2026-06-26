import { useCallback } from "react";
import { getNavigation } from "../services/navigationService.js";
import { useAsyncResource } from "./useAsyncResource.js";

export function useNavigation() {
  const loadNavigation = useCallback(() => getNavigation(), []);

  return useAsyncResource(loadNavigation, {
    primary: [],
    header: [],
    quickAccess: [],
  }, {
    cacheKey: "navigation",
  });
}
