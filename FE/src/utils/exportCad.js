import { getWizardState, getStoredStepData } from './wizardState';

const downloadBlob = (blob, fileName) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
};

export const exportCadFile = () => {
    const wizard = getWizardState();
    const steps = getStoredStepData();

    const content = [
        '0',
        'SECTION',
        '2',
        'HEADER',
        '9',
        '$ACADVER',
        '1',
        'AC1018',
        '0',
        'ENDSEC',
        '0',
        'SECTION',
        '2',
        'ENTITIES',
        '0',
        'TEXT',
        '8',
        '0',
        '10',
        '10.0',
        '20',
        '10.0',
        '30',
        '0.0',
        '40',
        '2.5',
        '1',
        `Gearbox CAD Draft - ${wizard?.meta?.projectName || 'Unnamed Project'}`,
        '0',
        'TEXT',
        '8',
        '0',
        '10',
        '10.0',
        '20',
        '15.0',
        '30',
        '0.0',
        '40',
        '1.8',
        '1',
        `Power: ${wizard?.step1Input?.power || ''}kW | Speed: ${wizard?.step1Input?.speed || ''}rpm`,
        '0',
        'TEXT',
        '8',
        '0',
        '10',
        '10.0',
        '20',
        '20.0',
        '30',
        '0.0',
        '40',
        '1.8',
        '1',
        `Belt d1/d2: ${steps?.step3?.d1 || '-'} / ${steps?.step3?.d2 || '-'}`,
        '0',
        'TEXT',
        '8',
        '0',
        '10',
        '10.0',
        '20',
        '25.0',
        '30',
        '0.0',
        '40',
        '1.8',
        '1',
        `Shaft d_standard: ${steps?.step4?.standard_diameter_d || '-'}`,
        '0',
        'ENDSEC',
        '0',
        'EOF',
    ].join('\n');

    const blob = new Blob([content], { type: 'application/dxf' });
    downloadBlob(blob, `gearbox-cad-${Date.now()}.dxf`);
};
