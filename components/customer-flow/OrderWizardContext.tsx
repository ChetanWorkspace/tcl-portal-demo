'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type WizardStep = 1 | 2 | 3;

type Ctx = {
  wizardStep: WizardStep;
  setWizardStep: (s: WizardStep) => void;
};

const OrderWizardContext = createContext<Ctx | null>(null);

export function OrderWizardProvider({ children }: { children: ReactNode }) {
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const value = useMemo(() => ({ wizardStep, setWizardStep }), [wizardStep]);
  return <OrderWizardContext.Provider value={value}>{children}</OrderWizardContext.Provider>;
}

export function useOrderWizardStep() {
  const ctx = useContext(OrderWizardContext);
  if (!ctx) {
    return { wizardStep: null as WizardStep | null, setWizardStep: () => {} };
  }
  return { wizardStep: ctx.wizardStep, setWizardStep: ctx.setWizardStep };
}
