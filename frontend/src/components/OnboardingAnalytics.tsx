'use client';

import { useEffect, useRef } from 'react';
import { useAnalytics } from '@/lib/analytics';

interface OnboardingAnalyticsProps {
  step: string;
  stepNumber: number;
  totalSteps: number;
  userId?: string;
  properties?: Record<string, any>;
}

export const OnboardingAnalytics: React.FC<OnboardingAnalyticsProps> = ({
  step,
  stepNumber,
  totalSteps,
  userId,
  properties = {}
}) => {
  const { trackOnboardingStep, trackFeatureUsage } = useAnalytics();
  const stepStartTime = useRef<number>(Date.now());
  const hasTrackedStep = useRef<boolean>(false);

  useEffect(() => {
    // Track step start
    if (!hasTrackedStep.current) {
      trackOnboardingStep(`step_${stepNumber}_start`, {
        step,
        stepNumber,
        totalSteps,
        userId,
        ...properties
      });
      hasTrackedStep.current = true;
    }

    // Track step completion when component unmounts
    return () => {
      const stepDuration = Date.now() - stepStartTime.current;
      trackOnboardingStep(`step_${stepNumber}_complete`, {
        step,
        stepNumber,
        totalSteps,
        duration: stepDuration,
        userId,
        ...properties
      });
    };
  }, [step, stepNumber, totalSteps, userId, properties, trackOnboardingStep]);

  // Track specific onboarding actions
  const trackOnboardingAction = (action: string, actionProperties?: Record<string, any>) => {
    trackFeatureUsage('onboarding', action, {
      step,
      stepNumber,
      totalSteps,
      userId,
      ...actionProperties
    });
  };

  // Track step navigation
  const trackStepNavigation = (direction: 'next' | 'previous' | 'skip') => {
    trackOnboardingAction(`navigate_${direction}`, {
      fromStep: stepNumber,
      toStep: direction === 'next' ? stepNumber + 1 : direction === 'previous' ? stepNumber - 1 : 'skipped'
    });
  };

  // Track form interactions
  const trackFormInteraction = (fieldName: string, interactionType: 'focus' | 'blur' | 'change' | 'submit') => {
    trackOnboardingAction(`form_${interactionType}`, {
      fieldName,
      step
    });
  };

  // Track option selections
  const trackOptionSelection = (optionType: string, selectedValue: string) => {
    trackOnboardingAction('option_selected', {
      optionType,
      selectedValue,
      step
    });
  };

  // Track onboarding completion
  const trackOnboardingComplete = () => {
    trackOnboardingAction('onboarding_complete', {
      totalSteps,
      userId
    });
  };

  // Track onboarding abandonment
  const trackOnboardingAbandon = (reason?: string) => {
    trackOnboardingAction('onboarding_abandon', {
      step,
      stepNumber,
      reason
    });
  };

  return null; // This component doesn't render anything, it just tracks analytics
};

// Hook for easy onboarding analytics usage
export const useOnboardingAnalytics = (step: string, stepNumber: number, totalSteps: number) => {
  const { trackOnboardingStep, trackFeatureUsage } = useAnalytics();

  const trackStepStart = (properties?: Record<string, any>) => {
    trackOnboardingStep(`step_${stepNumber}_start`, {
      step,
      stepNumber,
      totalSteps,
      ...properties
    });
  };

  const trackStepComplete = (properties?: Record<string, any>) => {
    trackOnboardingStep(`step_${stepNumber}_complete`, {
      step,
      stepNumber,
      totalSteps,
      ...properties
    });
  };

  const trackOnboardingAction = (action: string, properties?: Record<string, any>) => {
    trackFeatureUsage('onboarding', action, {
      step,
      stepNumber,
      totalSteps,
      ...properties
    });
  };

  return {
    trackStepStart,
    trackStepComplete,
    trackOnboardingAction
  };
};

