import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Step1Motor from './Step1_Motor';
import Step2MotorSelection from './Step2_MotorSelection';
import Step3TransmissionDesign from './Step3_TransmissionDesign';
import Step4ShaftBearing from './Step4_ShaftBearing';
import Step5ValidationAnalysis from './Step5_ValidationAnalysis';

const CalculationWizard = () => {
    const navigate = useNavigate();
    const { step } = useParams();
    const [currentStep, setCurrentStep] = useState(1);

    // Map step names to numbers
    const stepMap = {
        'motor': 1,
        'motor-selection': 2,
        'transmission-design': 3,
        'shaft-bearing': 4,
        'validation-analysis': 5
    };

    // Map step numbers to names
    const stepNameMap = {
        1: 'motor',
        2: 'motor-selection',
        3: 'transmission-design',
        4: 'shaft-bearing',
        5: 'validation-analysis'
    };

    // Initialize step from URL param
    useEffect(() => {
        if (step && stepMap[step]) {
            setCurrentStep(stepMap[step]);
        }
    }, [step]);

    const handleNext = () => {
        if (currentStep < 5) {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
            navigate(`/wizard/${stepNameMap[nextStep]}`);
            window.scrollTo(0, 0);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            const prevStep = currentStep - 1;
            setCurrentStep(prevStep);
            navigate(`/wizard/${stepNameMap[prevStep]}`);
            window.scrollTo(0, 0);
        }
    };

    const handleComplete = () => {
        // Navigate to dashboard or export page
        navigate('/dashboard');
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <Step1Motor onNext={handleNext} />;
            case 2:
                return <Step2MotorSelection onNext={handleNext} onBack={handleBack} />;
            case 3:
                return <Step3TransmissionDesign onNext={handleNext} onBack={handleBack} />;
            case 4:
                return <Step4ShaftBearing onNext={handleNext} onBack={handleBack} />;
            case 5:
                return <Step5ValidationAnalysis onBack={handleBack} onComplete={handleComplete} />;
            default:
                return <Step1Motor onNext={handleNext} />;
        }
    };

    return (
        <div>
            {renderStep()}
        </div>
    );
};

export default CalculationWizard;
