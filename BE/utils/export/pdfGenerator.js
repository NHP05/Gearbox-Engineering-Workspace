const { buildReportLines } = require('./reportPayloadFormatter');

const escapePdfText = (value) => {
    const normalized = String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^\x20-\x7E]/g, '?');

    return normalized
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');
};

const wrapLine = (line, maxLength = 95) => {
    const text = String(line || '');
    if (text.length <= maxLength) return [text];

    const chunks = [];
    let start = 0;
    while (start < text.length) {
        chunks.push(text.slice(start, start + maxLength));
        start += maxLength;
    }
    return chunks;
};

const formatXrefOffset = (offset) => String(offset).padStart(10, '0');

const buildPdfBuffer = (lines = []) => {
    const header = '%PDF-1.4\n';

    const wrapped = lines.flatMap((line) => wrapLine(line));
    const maxLines = 52;
    const pageLines = wrapped.slice(0, maxLines);

    if (wrapped.length > maxLines) {
        pageLines[pageLines.length - 1] = '... output truncated for single-page export preview ...';
    }

    const streamCommands = [
        'BT',
        '/F1 11 Tf',
        '50 790 Td',
        '14 TL',
    ];

    pageLines.forEach((line, index) => {
        const escaped = escapePdfText(line);
        if (index === 0) {
            streamCommands.push(`(${escaped}) Tj`);
        } else {
            streamCommands.push(`T* (${escaped}) Tj`);
        }
    });

    streamCommands.push('ET');
    const streamContent = `${streamCommands.join('\n')}\n`;

    const objects = [
        '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
        '2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n',
        '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
        '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
        `5 0 obj\n<< /Length ${Buffer.byteLength(streamContent, 'utf8')} >>\nstream\n${streamContent}endstream\nendobj\n`,
    ];

    const offsets = [0];
    let body = '';

    objects.forEach((objectText) => {
        offsets.push(Buffer.byteLength(header + body, 'utf8'));
        body += objectText;
    });

    const xrefStart = Buffer.byteLength(header + body, 'utf8');
    let xref = `xref\n0 ${objects.length + 1}\n`;
    xref += '0000000000 65535 f \n';
    for (let i = 1; i < offsets.length; i += 1) {
        xref += `${formatXrefOffset(offsets[i])} 00000 n \n`;
    }

    const trailer = [
        'trailer',
        `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
        'startxref',
        String(xrefStart),
        '%%EOF',
        '',
    ].join('\n');

    return Buffer.from(header + body + xref + trailer, 'utf8');
};

const generatePdfBuffer = (payload = {}) => {
    const lines = buildReportLines(payload);
    return buildPdfBuffer(lines);
};

module.exports = {
    generatePdfBuffer,
};
