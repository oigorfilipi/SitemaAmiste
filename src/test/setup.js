import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach } from "vitest";

function clearBrowserStorage() {
  window.localStorage.clear();
  window.sessionStorage.clear();
}

beforeEach(() => {
  clearBrowserStorage();
});

afterEach(() => {
  clearBrowserStorage();
});
