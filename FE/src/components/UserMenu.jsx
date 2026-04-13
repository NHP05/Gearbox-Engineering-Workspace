import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const UserMenu = ({ user, onNavigate, onLogout }) => {
    const { t } = useLanguage();
    const { isDark } = useTheme();
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
        const onClickOutside = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    const firstLetter = String(user?.username || 'U').slice(0, 1).toUpperCase();
    const roleLabel = String(user?.role || 'USER').toUpperCase();

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${isDark ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
                <span className="w-6 h-6 rounded-full bg-[#0058be] text-white flex items-center justify-center text-[10px] font-black">{firstLetter}</span>
                <span className="max-w-24 truncate">{user?.username || 'Guest'}</span>
                <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold leading-none ${roleLabel === 'ADMIN' ? 'border-amber-300 bg-amber-100 text-amber-800' : 'border-slate-300 bg-slate-200 text-slate-600'}`}>
                    {roleLabel}
                </span>
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>

            {open ? (
                <div className={`absolute right-0 mt-2 w-52 rounded-xl border shadow-xl z-50 overflow-hidden ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                    <button
                        type="button"
                        onClick={() => {
                            onNavigate('/settings');
                            setOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-2 ${isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                        <span className="material-symbols-outlined text-[18px]">settings</span>
                        {t('user_settings')}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onNavigate('/profile');
                            setOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-2 ${isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                        <span className="material-symbols-outlined text-[18px]">person</span>
                        {t('user_info')}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onLogout();
                            setOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        {t('user_logout')}
                    </button>
                </div>
            ) : null}
        </div>
    );
};

UserMenu.propTypes = {
    user: PropTypes.shape({
        username: PropTypes.string,
    }),
    onNavigate: PropTypes.func.isRequired,
    onLogout: PropTypes.func.isRequired,
};

UserMenu.defaultProps = {
    user: { username: 'Guest' },
};

export default UserMenu;
