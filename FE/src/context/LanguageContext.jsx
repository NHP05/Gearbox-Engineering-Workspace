import React, { createContext, useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { messages } from '../i18n/messages';

const LANG_KEY = 'gearbox_language';
const LanguageContext = createContext(null);

const detectLanguage = () => {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'vi' || saved === 'en') return saved;
    return 'vi';
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguageState] = useState(detectLanguage);

    const setLanguage = (lang) => {
        const safe = lang === 'en' ? 'en' : 'vi';
        setLanguageState(safe);
        localStorage.setItem(LANG_KEY, safe);
    };

    const t = (key, fallback = '') => {
        const dict = messages[language] || messages.vi;
        return dict[key] || fallback || key;
    };

    const value = useMemo(() => ({ language, setLanguage, t }), [language]);

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

LanguageProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};
