'use client';

interface StepperProps {
  currentStep: 1 | 2 | 3 | 4;
  completedSteps?: number[];
}

const STEPS = [
  { number: 1, label: 'Upload' },
  { number: 2, label: 'Preview' },
  { number: 3, label: 'Customize' },
  { number: 4, label: 'Generate' },
] as const;

export function Stepper({ currentStep, completedSteps = [] }: StepperProps) {
  const getStepStatus = (stepNumber: number): 'completed' | 'current' | 'future' => {
    if (completedSteps.includes(stepNumber)) {
      return 'completed';
    }
    if (stepNumber === currentStep) {
      return 'current';
    }
    if (stepNumber < currentStep) {
      // Steps before current are implicitly completed if not in completedSteps
      return 'completed';
    }
    return 'future';
  };

  const getStepClasses = (status: 'completed' | 'current' | 'future'): string => {
    switch (status) {
      case 'completed':
        return 'step step-primary';
      case 'current':
        return 'step step-primary';
      case 'future':
        return 'step';
    }
  };

  return (
    <ul className="steps steps-horizontal w-full">
      {STEPS.map((step) => {
        const status = getStepStatus(step.number);
        const isCompleted = status === 'completed';
        
        return (
          <li
            key={step.number}
            className={getStepClasses(status)}
            data-content={isCompleted ? '✓' : step.number}
          >
            {step.label}
          </li>
        );
      })}
    </ul>
  );
}
