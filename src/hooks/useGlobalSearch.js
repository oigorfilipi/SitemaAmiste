import { useEffect, useState } from "react";
import { searchGlobal } from "../services/searchService.js";

export function useGlobalSearch(term, role) {
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let ignoreResult = false;

    async function runSearch() {
      setIsSearching(true);
      const searchResults = await searchGlobal(term, role);

      if (!ignoreResult) {
        setResults(searchResults);
        setIsSearching(false);
      }
    }

    runSearch();

    return () => {
      ignoreResult = true;
    };
  }, [role, term]);

  useEffect(() => {
    function refreshSearch() {
      searchGlobal(term, role).then(setResults);
    }

    window.addEventListener("amiste-db-change", refreshSearch);

    return () => {
      window.removeEventListener("amiste-db-change", refreshSearch);
    };
  }, [role, term]);

  return { isSearching, results };
}
