import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Step1Motor from './Step1_Motor';
import Step2MotorSelection from './Step2_MotorSelection';
import Step3TransmissionDesign from './Step3_TransmissionDesign';
import Step4ShaftBearing from './Step4_ShaftBearing';
import Step5ValidationAnalysis from './Step5_ValidationAnalysis';

const calculateWizard = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);

    const handleNext = () => {
        if (currentStep < 5) {
            setCurrentStep(currentStep + 1);
            window.scrollTo(0, 0);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
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

export default calculateWizard;
