const { buildReportLines } = require('../utils/export/reportPayloadFormatter');
const { generatePdfBuffer } = require('../utils/export/pdfGenerator');
const { generateDocxBuffer } = require('../utils/export/docxGenerator');
const { generateDxfBuffer } = require('../utils/export/dxfGenerator');

const normalizeExportFormat = (format) => {
    const value = String(format || '').trim().toLowerCase();

    if (value === 'dwg') return 'dxf';
    if (value === 'pdf') return 'pdf';
    if (value === 'docx') return 'docx';
    if (value === 'dxf') return 'dxf';
    if (value === 'step') return 'step';
    if (value === 'txt') return 'txt';

    return 'pdf';
};

const toStepLiteral = (value) => String(value || '').replace(/'/g, "''");

const buildStepText = (payload = {}) => {
    const steps = payload?.steps || {};
    const step1 = toStepLiteral(JSON.stringify(steps?.step1 || {}));
    const step3 = toStepLiteral(JSON.stringify(steps?.step3 || {}));
    const step4 = toStepLiteral(JSON.stringify(steps?.step4 || {}));

    return [
        'ISO-10303-21;',
        'HEADER;',
        'FILE_DESCRIPTION((\'GEARBOX DESIGN SNAPSHOT\'),\'2;1\');',
        `FILE_NAME('gearbox-design-${Date.now()}.stp','${new Date().toISOString()}',('Gearbox Engineering'),('Gearbox Engineering'),'','', '');`,
        'FILE_SCHEMA((\'AUTOMOTIVE_DESIGN\'));',
        'ENDSEC;',
        'DATA;',
        `#1=TEXT_LITERAL('step1', '${step1}');`,
        `#2=TEXT_LITERAL('step3', '${step3}');`,
        `#3=TEXT_LITERAL('step4', '${step4}');`,
        'ENDSEC;',
        'END-ISO-10303-21;',
        '',
    ].join('\n');
};

const exportReport = (req, res) => {
    try {
        const payload = req.body || {};
        const format = normalizeExportFormat(payload?.meta?.exportFormat || req.body?.exportFormat || 'pdf');

        let contentType = 'text/plain; charset=utf-8';
        let extension = 'txt';
        let fileBuffer = Buffer.from(buildReportLines(payload).join('\n'), 'utf8');

        if (format === 'pdf') {
            contentType = 'application/pdf';
            extension = 'pdf';
            fileBuffer = generatePdfBuffer(payload);
        } else if (format === 'docx') {
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            extension = 'docx';
            fileBuffer = generateDocxBuffer(payload);
        } else if (format === 'dxf') {
            contentType = 'application/dxf';
            extension = 'dxf';
            fileBuffer = generateDxfBuffer(payload);
        } else if (format === 'step') {
            contentType = 'application/step';
            extension = 'step';
            fileBuffer = Buffer.from(buildStepText(payload), 'utf8');
        }

        const fileName = `gearbox-report-${Date.now()}.${extension}`;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', fileBuffer.length);

        return res.status(200).send(fileBuffer);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    exportReport,
};
