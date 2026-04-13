import React from 'react';
import PropTypes from 'prop-types';

const toFiniteNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value, min, max) => {
    let next = value;
    if (Number.isFinite(min)) next = Math.max(min, next);
    if (Number.isFinite(max)) next = Math.min(max, next);
    return next;
};

const getPrecision = (step) => {
    const text = String(step ?? '1');
    if (!text.includes('.')) return 0;
    return text.split('.')[1].length;
};

const NumericStepperInput = ({
    id,
    name,
    value,
    onChange,
    min,
    max,
    step = 1,
    suffix,
    disabled = false,
    onKeyDown,
    className = '',
    inputClassName = '',
}) => {
    const stepValue = Math.abs(toFiniteNumber(step, 1)) || 1;
    const minValue = Number.isFinite(Number(min)) ? Number(min) : undefined;
    const maxValue = Number.isFinite(Number(max)) ? Number(max) : undefined;
    const precision = getPrecision(stepValue);

    const emitValue = (nextValue) => {
        if (!onChange || !name) return;
        onChange({
            target: {
                name,
                value: String(nextValue),
            },
        });
    };

    const adjustValue = (direction) => {
        const baseValue = toFiniteNumber(value, minValue ?? 0);
        const shifted = baseValue + direction * stepValue;
        const bounded = clamp(shifted, minValue, maxValue);
        const rounded = Number(bounded.toFixed(precision));
        emitValue(rounded);
    };

    return (
        <div className={`relative ${className}`}>
            <input
                id={id}
                name={name}
                type="number"
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                className={inputClassName}
                style={{ paddingRight: suffix ? '5.75rem' : '3.75rem' }}
            />

            <div className="absolute inset-y-0 right-2 flex items-center gap-2 pointer-events-none">
                {suffix ? <span className="text-xs font-bold text-slate-400">{suffix}</span> : null}
                <div className="pointer-events-auto flex h-8 w-6 flex-col overflow-hidden rounded border border-slate-300 bg-white/90 shadow-sm">
                    <button
                        type="button"
                        onClick={() => adjustValue(1)}
                        disabled={disabled}
                        aria-label="Increase value"
                        className="flex flex-1 items-center justify-center border-b border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined block leading-none text-[13px]">keyboard_arrow_up</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => adjustValue(-1)}
                        disabled={disabled}
                        aria-label="Decrease value"
                        className="flex flex-1 items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined block leading-none text-[13px]">keyboard_arrow_down</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

NumericStepperInput.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    onChange: PropTypes.func.isRequired,
    min: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    max: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    step: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    suffix: PropTypes.string,
    disabled: PropTypes.bool,
    onKeyDown: PropTypes.func,
    className: PropTypes.string,
    inputClassName: PropTypes.string,
};

export default NumericStepperInput;