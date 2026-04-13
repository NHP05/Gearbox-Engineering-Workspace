const { normalizePayload } = require('./reportPayloadFormatter');

const pushTextEntity = (lines, x, y, height, text) => {
    const safeText = String(text || '').replace(/\r?\n/g, ' ').slice(0, 240);

    lines.push('0');
    lines.push('TEXT');
    lines.push('8');
    lines.push('0');
    lines.push('10');
    lines.push(String(x));
    lines.push('20');
    lines.push(String(y));
    lines.push('30');
    lines.push('0.0');
    lines.push('40');
    lines.push(String(height));
    lines.push('1');
    lines.push(safeText);
};

const generateDxfBuffer = (payload = {}) => {
    const normalized = normalizePayload(payload);
    const lines = [
        '0', 'SECTION',
        '2', 'HEADER',
        '9', '$ACADVER',
        '1', 'AC1018',
        '0', 'ENDSEC',
        '0', 'SECTION',
        '2', 'ENTITIES',
    ];

    const summary = normalized.summary || {};
    const step1 = normalized?.steps?.step1 || {};
    const step3 = normalized?.steps?.step3 || {};
    const step4 = normalized?.steps?.step4 || {};

    let y = 280;
    pushTextEntity(lines, 10, y, 3.2, 'GEARBOX ENGINEERING - DXF REPORT');
    y -= 12;

    pushTextEntity(lines, 10, y, 2.2, `Generated: ${normalized.meta.generatedAt}`);
    y -= 8;
    pushTextEntity(lines, 10, y, 2.2, `User: ${normalized.meta.userName}`);
    y -= 12;

    pushTextEntity(lines, 10, y, 2.4, 'SUMMARY');
    y -= 8;
    pushTextEntity(lines, 12, y, 2.0, `Torque: ${summary.torqueEstimate} Nm`);
    y -= 6;
    pushTextEntity(lines, 12, y, 2.0, `Contact Stress: ${summary.contactStress} MPa`);
    y -= 6;
    pushTextEntity(lines, 12, y, 2.0, `Root Bending: ${summary.rootBending} MPa`);
    y -= 6;
    pushTextEntity(lines, 12, y, 2.0, `Safety Factor: ${summary.safetyFactor}`);
    y -= 12;

    pushTextEntity(lines, 10, y, 2.4, 'DESIGN DATA');
    y -= 8;
    pushTextEntity(lines, 12, y, 2.0, `Power: ${step1?.input?.power ?? '-'} kW | Speed: ${step1?.input?.n_motor ?? '-'} rpm`);
    y -= 6;
    pushTextEntity(lines, 12, y, 2.0, `Belt d1/d2: ${step3?.d1 ?? '-'} / ${step3?.d2 ?? '-'} mm`);
    y -= 6;
    pushTextEntity(lines, 12, y, 2.0, `Shaft d_std: ${step4?.standard_diameter_d ?? '-'} mm`);
    y -= 6;
    pushTextEntity(lines, 12, y, 2.0, `Bearing: ${step4?.selectedBearing?.model ?? '-'}`);

    lines.push('0');
    lines.push('ENDSEC');
    lines.push('0');
    lines.push('EOF');

    return Buffer.from(lines.join('\n'), 'utf8');
};

module.exports = {
    generateDxfBuffer,
};
