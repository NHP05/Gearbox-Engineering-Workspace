import React from 'react';
import PropTypes from 'prop-types';

const TOP_LINKS = ['Projects', 'Calculations', 'Simulation'];

const SIDE_LINKS = [
    { key: 'parameters', icon: 'settings_input_component', label: 'Input Parameters' },
    { key: 'motor', icon: 'electric_bolt', label: 'Motor Selection' },
    { key: 'transmission', icon: 'settings', label: 'Transmission Design' },
    { key: 'shaft', icon: 'account_tree', label: 'Shaft & Bearing' },
    { key: 'validation', icon: 'verified', label: 'Validation Analysis' },
];

const Icon = ({ name, className = '' }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

Icon.propTypes = {
    name: PropTypes.string.isRequired,
    className: PropTypes.string,
};

const WizardScaffold = ({
    activeKey,
    projectTitle,
    projectSubtitle,
    headerBrand,
    children,
}) => {
    return (
        <div className="bg-[#f8f9fa] min-h-screen text-[#191c1d] antialiased">
            <header className="fixed top-0 z-50 w-full h-14 px-6 flex items-center justify-between bg-white/90 backdrop-blur-xl border-b border-slate-200/60">
                <div className="flex items-center gap-8">
                    <span className="text-lg font-bold tracking-tight text-slate-900">{headerBrand}</span>
                    <nav className="hidden md:flex items-center gap-6" aria-label="Top navigation">
                        {TOP_LINKS.map((item) => (
                            <button
                                key={item}
                                type="button"
                                className={`text-sm font-medium tracking-tight px-2 py-1 rounded ${item === 'Calculations' ? 'text-blue-700 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
                            >
                                {item}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="flex items-center gap-3">
                    <button className="hidden md:inline-flex gradient-button text-white text-sm font-semibold px-4 py-1.5 rounded-lg">Create New Project</button>
                    <button className="p-2 rounded-full hover:bg-slate-100"><Icon name="notifications" className="text-slate-500" /></button>
                    <button className="p-2 rounded-full hover:bg-slate-100"><Icon name="help_outline" className="text-slate-500" /></button>
                    <div className="w-8 h-8 rounded-full bg-slate-200" />
                </div>
            </header>

            <aside className="hidden md:flex fixed top-14 bottom-0 left-0 w-64 bg-slate-50 border-r border-slate-200/40 flex-col p-4 z-40">
                <div className="px-2 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-[#2170e4] flex items-center justify-center">
                            <Icon name="precision_manufacturing" className="text-white text-[18px]" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-blue-700">{projectTitle}</p>
                            <p className="text-[11px] text-slate-500">{projectSubtitle}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 space-y-1">
                    {SIDE_LINKS.map((item) => {
                        const active = item.key === activeKey;
                        return (
                            <button
                                key={item.key}
                                type="button"
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${active ? 'bg-blue-50 text-blue-700 translate-x-1' : 'text-slate-600 hover:bg-slate-200/60'}`}
                            >
                                <Icon name={item.icon} className="text-[20px]" />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="pt-4 border-t border-slate-200/60 space-y-1">
                    <button className="w-full bg-[#0058be] text-white text-xs font-bold uppercase tracking-widest py-2.5 rounded-lg">Export CAD</button>
                    <button type="button" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200/60">
                        <Icon name="menu_book" className="text-[20px]" />
                        <span>Documentation</span>
                    </button>
                    <button type="button" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200/60">
                        <Icon name="contact_support" className="text-[20px]" />
                        <span>Support</span>
                    </button>
                </div>
            </aside>

            <main className="pt-14 md:ml-64 min-h-screen">
                {children}
            </main>
        </div>
    );
};

WizardScaffold.propTypes = {
    activeKey: PropTypes.oneOf(['parameters', 'motor', 'transmission', 'shaft', 'validation']).isRequired,
    projectTitle: PropTypes.string,
    projectSubtitle: PropTypes.string,
    headerBrand: PropTypes.string,
    children: PropTypes.node.isRequired,
};

WizardScaffold.defaultProps = {
    projectTitle: 'Project Alpha',
    projectSubtitle: 'Gearbox Design v2.1',
    headerBrand: 'Gearbox Engineer',
};

export default WizardScaffold;
