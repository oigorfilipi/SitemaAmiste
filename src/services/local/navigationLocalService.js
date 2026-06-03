import {
  headerNavigationMock,
  primaryNavigationMock,
  quickAccessMock,
} from "../../mocks/navigation.mock.js";

export async function getNavigationLocal() {
  return {
    primary: primaryNavigationMock,
    header: headerNavigationMock,
    quickAccess: quickAccessMock,
  };
}
