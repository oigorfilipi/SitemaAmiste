import { useEffect, useState } from "react";

export function useAsyncResource(loader, initialValue) {
  const [data, setData] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    /* --- SECAO: CARREGAMENTO ASSINCRONO ---
     * O guard evita setState depois que o componente desmontar, algo comum quando rotas mudam rapido.
     */
    async function loadResource() {
      try {
        setIsLoading(true);
        const loadedData = await loader();

        if (isMounted) {
          setData(loadedData);
          setError(null);
        }
      } catch (resourceError) {
        if (isMounted) {
          setError(resourceError);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadResource();

    return () => {
      isMounted = false;
    };
  }, [loader]);

  return { data, isLoading, error };
}
