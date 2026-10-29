import React from 'react';
import logoImg from '../../images/logo.png';

export default function ApplicationLogo({ className = "h-14 w-auto object-contain", showText = true, textClassName = "" }) {
    return (
        <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center shrink-0">
                <img src={logoImg} alt="DNP Logo" className={className} onError={(e) => { e.target.src = '/DNP Logo Baru.png'; }} />
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
