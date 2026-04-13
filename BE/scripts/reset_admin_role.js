require('dotenv').config({ path: './.env' });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'test123';

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false },
    });

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const [columnRows] = await conn.query('SHOW COLUMNS FROM users');
    const columnSet = new Set(columnRows.map((row) => String(row.Field || '')));

    const hasPasswordPlain = columnSet.has('password_plain');
    const hasIsBanned = columnSet.has('is_banned');
    const hasBanReason = columnSet.has('ban_reason');
    const hasBannedBy = columnSet.has('banned_by');
    const hasBannedAt = columnSet.has('banned_at');
    const hasLanguage = columnSet.has('language');
    const hasTheme = columnSet.has('theme');
    const hasCreatedAt = columnSet.has('createdAt');
    const hasUpdatedAt = columnSet.has('updatedAt');

    const [existingRows] = await conn.query('SELECT id FROM users WHERE username = ? LIMIT 1', [ADMIN_USERNAME]);
    const adminExists = existingRows.length > 0;

    if (adminExists) {
        const updateSetParts = [
            "role = 'ADMIN'",
            'password_hash = ?',
        ];
        const updateValues = [passwordHash];

        if (hasPasswordPlain) {
            updateSetParts.push('password_plain = ?');
            updateValues.push(ADMIN_PASSWORD);
        }
        if (hasIsBanned) updateSetParts.push('is_banned = 0');
        if (hasBanReason) updateSetParts.push('ban_reason = NULL');
        if (hasBannedBy) updateSetParts.push('banned_by = NULL');
        if (hasBannedAt) updateSetParts.push('banned_at = NULL');
        if (hasLanguage) updateSetParts.push("language = 'vi'");
        if (hasTheme) updateSetParts.push("theme = 'light'");
        if (hasUpdatedAt) updateSetParts.push('updatedAt = NOW()');

        await conn.query(
            `UPDATE users SET ${updateSetParts.join(', ')} WHERE username = ?`,
            [...updateValues, ADMIN_USERNAME]
        );
    } else {
        const insertColumns = ['username', 'email', 'password_hash', 'role'];
        const insertValues = [ADMIN_USERNAME, null, passwordHash, 'ADMIN'];

        if (hasPasswordPlain) {
            insertColumns.push('password_plain');
            insertValues.push(ADMIN_PASSWORD);
        }
        if (hasIsBanned) {
            insertColumns.push('is_banned');
            insertValues.push(0);
        }
        if (hasBanReason) {
            insertColumns.push('ban_reason');
            insertValues.push(null);
        }
        if (hasBannedBy) {
            insertColumns.push('banned_by');
            insertValues.push(null);
        }
        if (hasBannedAt) {
            insertColumns.push('banned_at');
            insertValues.push(null);
        }
        if (hasLanguage) {
            insertColumns.push('language');
            insertValues.push('vi');
        }
        if (hasTheme) {
            insertColumns.push('theme');
            insertValues.push('light');
        }
        if (hasCreatedAt) {
            insertColumns.push('createdAt');
            insertValues.push(new Date());
        }
        if (hasUpdatedAt) {
            insertColumns.push('updatedAt');
            insertValues.push(new Date());
        }

        const placeholders = insertColumns.map(() => '?').join(', ');
        await conn.query(
            `INSERT INTO users (${insertColumns.join(', ')}) VALUES (${placeholders})`,
            insertValues
        );
    }

    const [rows] = await conn.query(
        "SELECT id, username, role, is_banned, language, theme FROM users WHERE username = ?",
        [ADMIN_USERNAME]
    );
    console.log('ADMIN_ACCOUNT_RESTORED', rows[0]);
    console.log('LOGIN_CREDENTIAL', { username: ADMIN_USERNAME, password: ADMIN_PASSWORD });

    await conn.end();
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
