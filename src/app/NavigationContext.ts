import { createContext, useContext } from "react";
import type { OnboardingCase } from "../types/api";

export interface NavigationContextType {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  openNewInvitation: () => void;
  openApiKeyModal: () => void;
  openCaseDetail?: (caseItem: OnboardingCase) => void;
  openHelpModal?: () => void;
}

export const NavigationContext = createContext<NavigationContextType | null>(null);

export function useNavigation() {
  return useContext(NavigationContext);
}
