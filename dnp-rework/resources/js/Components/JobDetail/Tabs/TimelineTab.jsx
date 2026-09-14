import React from 'react';
import { STAGES, STAGE2_VERIFY_CHECKLIST, parseJsonObject } from '@/Constants';
import { DocChip } from '../constants';
import CompletedStageSummary from '../CompletedSummaries/CompletedStageSummary';

// Stage Action Components
import Stage1Action from '../StageActions/Stage1Action';
import Stage18Action from '../StageActions/Stage18Action';
import Stage19Action from '../StageActions/Stage19Action';
import Stage20Action from '../StageActions/Stage20Action';
import Stage2Action from '../StageActions/Stage2Action';
import Stage3Action from '../StageActions/Stage3Action';
import Stage4Action from '../StageActions/Stage4Action';
import Stage13Action from '../StageActions/Stage13Action';
import Stage16Action from '../StageActions/Stage16Action';
import Stage17Action from '../StageActions/Stage17Action';
import Stage5Action from '../StageActions/Stage5Action';
import Stage6Action from '../StageActions/Stage6Action';
import Stage7Action from '../StageActions/Stage7Action';
import Stage8Action from '../StageActions/Stage8Action';
import Stage9Action from '../StageActions/Stage9Action';
import Stage10Action from '../StageActions/Stage10Action';
import Stage11Action from '../StageActions/Stage11Action';
import Stage15Action from '../StageActions/Stage15Action';
import Stage14Action from '../StageActions/Stage14Action';
import Stage12Action from '../StageActions/Stage12Action';

export default function TimelineTab({
    job,
    auth,
    permissions = {},
    currentStageInfo,
    daysInStage,
    slaTag,
    actions = {},
    state = {},
}) {
    const canManage = permissions?.canManage ?? false;
    const canManageStageDocs = permissions?.canManageStageDocs || (() => false);
    const { deleteDoc } = actions || {};
    const s = job.stage;

    const commonProps = {
        job,
        auth,
        state: state || {},
        actions: actions || {},
        permissions: permissions || {},
        canManage,
        canManageStageDocs,
        ...(state || {}),
        ...(actions || {}),
    };

    const renderStageAction = () => {
        if (!canManage) return null;

        switch (s) {
            case 1:
                return <Stage1Action {...commonProps} />;
            case 18:
                return <Stage18Action {...commonProps} />;
            case 19:
                return <Stage19Action {...commonProps} />;
            case 20:
                return <Stage20Action {...commonProps} />;
            case 2:
                return <Stage2Action {...commonProps} />;
            case 3:
                return <Stage3Action {...commonProps} />;
            case 4:
                return <Stage4Action {...commonProps} />;
            case 13:
                return <Stage13Action {...commonProps} />;
            case 16:
                return <Stage16Action {...commonProps} />;
            case 17:
                return <Stage17Action {...commonProps} />;
            case 5:
                return <Stage5Action {...commonProps} />;
            case 6:
                return <Stage6Action {...commonProps} />;
            case 7:
                return <Stage7Action {...commonProps} />;
            case 8:
                return <Stage8Action {...commonProps} />;
            case 9:
                return <Stage9Action {...commonProps} />;
            case 10:
                return <Stage10Action {...commonProps} />;
            case 11:
                return <Stage11Action {...commonProps} />;
            case 15:
                return <Stage15Action {...commonProps} />;
            case 14:
                return <Stage14Action {...commonProps} />;
            case 12:
                return <Stage12Action {...commonProps} />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 py-2">
            <h3 className="font-bold text-gray-800 border-b pb-2">
                Status Pekerjaan: Stage {currentStageInfo?.displayId || job.stage} ({currentStageInfo?.name})
            </h3>

            {/* SLA Badge for current stage */}
            {slaTag && (
                <div className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold ${slaTag.cls}`}>
                    {daysInStage} hari di stage ini {currentStageInfo?.sla ? `(SLA: ${currentStageInfo.sla} hari)` : ''} — {slaTag.label}
                </div>
            )}

            <div className="relative border-l-2 border-gray-200 ml-4 pl-6 space-y-8">
                {STAGES.map(stage => {
                    const currentStageIdx = STAGES.findIndex(sItem => sItem.id === job.stage);
                    const stageIdx = STAGES.findIndex(sItem => sItem.id === stage.id);
                    const isPast = currentStageIdx > stageIdx;
                    const isCurrent = currentStageIdx === stageIdx;
                    const isFuture = currentStageIdx < stageIdx;

                    let iconBg = 'bg-gray-100 border-gray-300';
                    if (isPast) iconBg = 'bg-emerald-500 border-emerald-600 text-white shadow-2xs';
                    if (isCurrent) iconBg = 'bg-gradient-to-tr from-[#0A385C] to-[#00A8E8] border-2 border-white text-white ring-4 ring-[#00A8E8]/30 shadow-md scale-110 font-extrabold';

                    const stageDocs = (job.documents || []).filter(d => d.stage === stage.id);

                    return (
                        <div key={stage.id} className={`relative ${isFuture ? 'opacity-40' : ''}`}>
                            {/* Connector Node */}
                            <div className={`absolute -left-[35px] top-1 w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold transition-transform ${iconBg}`}>
                                {isPast ? 'Selesai' : (stage.displayId || stage.id)}
                            </div>

                            <div className={`bg-white border rounded-xl shadow-xs p-4 transition-all ${isCurrent ? 'border-[#00A8E8] ring-1 ring-[#00A8E8]/40 shadow-sm' : 'border-slate-200'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className={`font-extrabold text-sm ${isCurrent ? 'text-[#0A385C]' : 'text-slate-800'}`}>
                                        Stage {stage.displayId || stage.id}: {stage.name}
                                    </h4>
                                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${isCurrent ? 'bg-[#0A385C] text-[#00A8E8]' : 'bg-slate-100 text-slate-600'}`}>
                                        PIC: {stage.role.toUpperCase()}
                                    </span>
                                </div>

                                {isCurrent && (
                                    <div className="mt-4 pt-4 border-t border-[#00A8E8]/20 bg-[#F8FAFC] -mx-4 -mb-4 p-4 rounded-b-xl">
                                        {canManage ? (
                                            renderStageAction()
                                        ) : (
                                            <div className="space-y-3">
                                                <CompletedStageSummary stage={stage.id} job={job} />
                                                {stageDocs.length > 0 && (
                                                    <div className="mt-3 space-y-1">
                                                        <p className="text-xs text-gray-500 font-medium">Dokumen Tersimpan:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {stageDocs.map((d, idx) => (
                                                                <DocChip key={d.id || `${d.type || 'doc'}_${d.file_path || idx}`} doc={d} canManage={canManageStageDocs(d.stage)} onDelete={deleteDoc} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!isCurrent && stage.id === 2 && (
                                    <div className="mt-3 space-y-2 pt-2 border-t border-gray-100">
                                        <p className="text-xs font-bold text-gray-700">Hasil Verifikasi Dokumen (Stage 2):</p>
                                        <div className="border border-gray-200 rounded-lg overflow-hidden text-xs bg-gray-50/50 divide-y divide-gray-100">
                                            {STAGE2_VERIFY_CHECKLIST.map((item) => {
                                                const docs = (job.documents || []).filter(d =>
                                                    (d.stage === 1 || d.stage === 2) && d.type === item.type
                                                );
                                                const hasFile = docs.length > 0;
                                                const savedData = parseJsonObject(job.s2_verify_data);
                                                const status = savedData[item.type] || state?.s2Verify?.[item.type];
                                                return (
                                                    <div key={item.type} className="flex items-center justify-between px-3 py-1.5 hover:bg-white transition-colors">
                                                        <div className="flex items-center gap-2 min-w-0 pr-2">
                                                            <span className="font-mono text-gray-400 text-[10px] w-4">{item.no}</span>
                                                            <span className="font-medium text-gray-800 truncate">{item.label}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            {item.isManual ? (
                                                                <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">Manual</span>
                                                            ) : hasFile ? (
                                                                <span className="text-[10px] text-green-700 font-semibold bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                                                                    Ada File
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded border border-red-200">Kosong</span>
                                                            )}
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${status === 'ok' ? 'bg-green-600 text-white' :
                                                                    status === 'tidak' ? 'bg-red-600 text-white' :
                                                                        status === 'na' ? 'bg-gray-500 text-white' :
                                                                            'bg-gray-200 text-gray-600'
                                                                }`}>
                                                                {status === 'ok' ? 'OK' : status === 'tidak' ? 'Tidak' : status === 'na' ? 'N/A' : 'Belum Set'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {!isCurrent && stageDocs.length > 0 && stage.id !== 2 && (
                                    <div className="mt-3 space-y-1">
                                        <p className="text-xs text-gray-500 font-medium">Dokumen Tersimpan:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {stageDocs.map((d, idx) => (
                                                <DocChip key={d.id || `${d.type || 'doc'}_${d.file_path || idx}`} doc={d} canManage={canManageStageDocs(d.stage)} onDelete={deleteDoc} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {!isCurrent && isPast && (
                                    <CompletedStageSummary stage={stage.id} job={job} />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
