import { useEffect, useState } from "react";
import {
  readResourceCache,
  runCachedRequest,
  writeResourceCache,
} from "../services/dataCacheService.js";

export function useAsyncResource(loader, initialValue, options = {}) {
  const { cacheKey } = options;
  const [data, setData] = useState(() => (cacheKey ? readResourceCache(cacheKey) : null) || initialValue);
  const [isLoading, setIsLoading] = useState(() => !(cacheKey && readResourceCache(cacheKey)));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const cachedData = cacheKey ? readResourceCache(cacheKey) : null;

    if (cachedData) {
      setData(cachedData);
      setIsLoading(false);
    } else {
      setData(initialValue);
      setIsLoading(true);
    }

    /* --- SECAO: CARREGAMENTO ASSINCRONO ---
     * O guard evita setState depois que o componente desmontar, algo comum quando rotas mudam rapido.
     */
    async function loadResource() {
      try {
        if (cachedData) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        const loadedData = await runCachedRequest(
          cacheKey ? `resource:${cacheKey}` : "",
          loader
        );
        const nextData = cacheKey ? writeResourceCache(cacheKey, loadedData) : loadedData;

        if (isMounted) {
          setData(nextData);
          setError(null);
        }
      } catch (resourceError) {
        if (isMounted) {
          setError(resourceError);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    loadResource();

    return () => {
      isMounted = false;
    };
  }, [cacheKey, loader]);

  return { data, isLoading, isRefreshing, error };
}
