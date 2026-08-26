import React from 'react';

export default function ApplicationLogo({ className = "h-12 w-auto", showText = true, textClassName = "" }) {
    return (
        <div className="flex items-center gap-3">
            {/* DNP Delta Icon SVG */}
            <div className="relative flex items-center justify-center shrink-0">
                <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Outer Circle Container */}
                    <circle cx="50" cy="50" r="48" fill="#0A385C" stroke="#00A8E8" strokeWidth="2" />
                    {/* Delta Triangle Inner Blades */}
                    {/* Top Peak */}
                    <path d="M50 18 L68 55 L50 48 Z" fill="#FFFFFF" />
                    {/* Left Blade */}
                    <path d="M50 48 L28 76 L50 82 Z" fill="#00A8E8" />
                    {/* Right Blade / Red Accent Peak */}
                    <path d="M50 48 L72 76 L50 82 Z" fill="#E11D48" />
                    {/* Center Core Line */}
                    <path d="M50 18 L50 82" stroke="#0A385C" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </div>
            
            {showText && (
                <div className={`flex flex-col text-left ${textClassName}`}>
                    <span className="font-extrabold tracking-tight text-gray-900 text-base leading-tight uppercase font-sans">
                        DELTA NUSANTARA <span className="text-[#00A8E8]">PERSADA</span>
                    </span>
                    <span className="text-[10px] font-semibold text-gray-500 tracking-wider uppercase">
                        Inspection <span className="text-[#E11D48]">|</span> consultant
                    </span>
                </div>
            )}
        </div>
    );
}
