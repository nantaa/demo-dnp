import React from 'react';
import Stage1Action from './StageActions/Stage1Action';
import Stage2Action from './StageActions/Stage2Action';
import Stage3Action from './StageActions/Stage3Action';
import Stage4Action from './StageActions/Stage4Action';
import Stage5Action from './StageActions/Stage5Action';
import Stage6Action from './StageActions/Stage6Action';
import Stage7Action from './StageActions/Stage7Action';
import Stage8Action from './StageActions/Stage8Action';
import Stage9Action from './StageActions/Stage9Action';
import Stage10Action from './StageActions/Stage10Action';
import Stage11Action from './StageActions/Stage11Action';
import Stage14Action from './StageActions/Stage14Action';
import Stage15Action from './StageActions/Stage15Action';
import Stage12Action from './StageActions/Stage12Action';
import Stage13Action from './StageActions/Stage13Action';
import Stage16Action from './StageActions/Stage16Action';

export default function StageActionDispatcher(props) {
    const {
        job,
        canManage,
        data,
        setData,
        processing,
        isMoving,
        isINS,
        isMGR,
        user,
        permissions,
        canSeeNilai,
        canEditNilai,
        showTgl15Warning,
        canReviseInvoiceMonth,
        stage1DocOk,
        stage2DocOk,
        stage2CanMove,
        stage2Bypass,
        s2Verify,
        scheduleDays,
        setScheduleDays,
        recommendations,
        allSelectedInspectorIds,
        masterData,
        s3ScheduleValid,
        s4,
        setS4,
        s4UnitMismatch,
        photoNotes,
        setPhotoNotes,
        lhppLinks,
        isSavingLink,
        s5,
        setS5,
        s7,
        setS7,
        s8,
        setS8,
        s9,
        setS9,
        s10,
        setS10,
        s11,
        setS11,
        s14,
        setS14,
        s15,
        setS15,
        editForm,
        // Handlers
        handleMoveStage,
        handleRejectStage,
        handleBypassStage5,
        handleAskApproval,
        handleApproveAsManager,
        handleSetS2Status,
        handleRouteTo13,
        handleSaveS4,
        handleSaveS5,
        handleSaveS7,
        handleSaveS8,
        handleSaveS9,
        handleSaveS10,
        handleSaveS11,
        handleSaveS14,
        handleSaveS15,
        handleUpdateJob,
        handleReopenJob,
        triggerUpload,
        uploadFileDirectly,
        uploadPhoto,
        canManageStageDocs,
        deleteDoc,
        getDocs,
        setShowReviseInvoiceModal,
        post,
        onClose,
        handleUpdateLhppLink,
        handleRemoveLhppLink,
        handleAddLhppLink,
        handleSaveLhppLinks,
    } = props;

    if (!canManage) return null;
    const s = Number(job.stage);

    return (
        <form onSubmit={handleMoveStage}>
            {s === 1 && (
                <Stage1Action
                    job={job}
                    data={data}
                    setData={setData}
                    processing={processing}
                    stage1DocOk={stage1DocOk}
                    handleRejectStage={handleRejectStage}
                    triggerUpload={triggerUpload}
                    uploadFileDirectly={uploadFileDirectly}
                    canManageStageDocs={canManageStageDocs}
                    deleteDoc={deleteDoc}
                    isINS={isINS}
                />
            )}
            {s === 2 && (
                <Stage2Action
                    job={job}
                    data={data}
                    setData={setData}
                    processing={processing}
                    stage2Bypass={stage2Bypass}
                    isMGR={isMGR}
                    handleApproveAsManager={handleApproveAsManager}
                    s2Verify={s2Verify}
                    handleSetS2Status={handleSetS2Status}
                    triggerUpload={triggerUpload}
                    canManageStageDocs={canManageStageDocs}
                    isINS={isINS}
                    stage2DocOk={stage2DocOk}
                    stage2CanMove={stage2CanMove}
                    handleRejectStage={handleRejectStage}
                    handleAskApproval={handleAskApproval}
                />
            )}
            {s === 3 && (
                <Stage3Action
                    job={job}
                    data={data}
                    setData={setData}
                    processing={processing}
                    isMoving={isMoving}
                    scheduleDays={scheduleDays}
                    setScheduleDays={setScheduleDays}
                    recommendations={recommendations}
                    allSelectedInspectorIds={allSelectedInspectorIds}
                    masterData={masterData}
                    s3ScheduleValid={s3ScheduleValid}
                    handleRejectStage={handleRejectStage}
                />
            )}
            {s === 4 && (
                <Stage4Action
                    job={job}
                    s4={s4}
                    setS4={setS4}
                    s4UnitMismatch={s4UnitMismatch}
                    handleSaveS4={handleSaveS4}
                    getDocs={getDocs}
                    photoNotes={photoNotes}
                    setPhotoNotes={setPhotoNotes}
                    uploadPhoto={uploadPhoto}
                    canManageStageDocs={canManageStageDocs}
                    deleteDoc={deleteDoc}
                    isINS={isINS}
                    data={data}
                    setData={setData}
                    processing={processing}
                    handleRejectStage={handleRejectStage}
                    handleRouteTo13={handleRouteTo13}
                    post={post}
                    onClose={onClose}
                />
            )}
            {s === 13 && (
                <Stage13Action
                    job={job}
                    editForm={editForm}
                    canSeeNilai={canSeeNilai}
                    canEditNilai={canEditNilai}
                    showTgl15Warning={showTgl15Warning}
                    handleUpdateJob={handleUpdateJob}
                    data={data}
                    setData={setData}
                    processing={processing}
                    handleRejectStage={handleRejectStage}
                    post={post}
                    onClose={onClose}
                />
            )}
            {s === 5 && (
                <Stage5Action
                    job={job}
                    canManage={canManage}
                    lhppLinks={lhppLinks}
                    handleUpdateLhppLink={handleUpdateLhppLink}
                    handleRemoveLhppLink={handleRemoveLhppLink}
                    handleAddLhppLink={handleAddLhppLink}
                    handleSaveLhppLinks={handleSaveLhppLinks}
                    isSavingLink={isSavingLink}
                    canManageStageDocs={canManageStageDocs}
                    deleteDoc={deleteDoc}
                    isINS={isINS}
                    data={data}
                    setData={setData}
                    processing={processing}
                    isMoving={isMoving}
                    handleRejectStage={handleRejectStage}
                    handleBypassStage5={handleBypassStage5}
                />
            )}
            {s === 6 && (
                <Stage6Action
                    job={job}
                    s5={s5}
                    setS5={setS5}
                    handleSaveS5={handleSaveS5}
                    data={data}
                    setData={setData}
                    processing={processing}
                    handleRejectStage={handleRejectStage}
                />
            )}
            {s === 7 && (
                <Stage7Action
                    job={job}
                    s7={s7}
                    setS7={setS7}
                    handleSaveS7={handleSaveS7}
                    triggerUpload={triggerUpload}
                    uploadFileDirectly={uploadFileDirectly}
                    canManageStageDocs={canManageStageDocs}
                    deleteDoc={deleteDoc}
                    isINS={isINS}
                    data={data}
                    setData={setData}
                    processing={processing}
                    handleRejectStage={handleRejectStage}
                />
            )}
            {s === 8 && (
                <Stage8Action
                    job={job}
                    s8={s8}
                    setS8={setS8}
                    handleSaveS8={handleSaveS8}
                    triggerUpload={triggerUpload}
                    uploadFileDirectly={uploadFileDirectly}
                    canManageStageDocs={canManageStageDocs}
                    deleteDoc={deleteDoc}
                    isINS={isINS}
                    data={data}
                    setData={setData}
                    processing={processing}
                    handleRejectStage={handleRejectStage}
                />
            )}
            {s === 9 && (
                <Stage9Action
                    job={job}
                    s9={s9}
                    setS9={setS9}
                    handleSaveS9={handleSaveS9}
                    triggerUpload={triggerUpload}
                    uploadFileDirectly={uploadFileDirectly}
                    canManageStageDocs={canManageStageDocs}
                    deleteDoc={deleteDoc}
                    isINS={isINS}
                    data={data}
                    setData={setData}
                    processing={processing}
                    handleRejectStage={handleRejectStage}
                />
            )}
            {s === 10 && (
                <Stage10Action
                    job={job}
                    s10={s10}
                    setS10={setS10}
                    canEditNilai={canEditNilai}
                    showTgl15Warning={showTgl15Warning}
                    handleSaveS10={handleSaveS10}
                    triggerUpload={triggerUpload}
                    uploadFileDirectly={uploadFileDirectly}
                    canManageStageDocs={canManageStageDocs}
                    deleteDoc={deleteDoc}
                    isINS={isINS}
                    data={data}
                    setData={setData}
                    processing={processing}
                    isMoving={isMoving}
                    handleRejectStage={handleRejectStage}
                />
            )}
            {s === 11 && (
                <Stage11Action
                    job={job}
                    s11={s11}
                    setS11={setS11}
                    handleSaveS11={handleSaveS11}
                    canSeeNilai={canSeeNilai}
                    canEditNilai={canEditNilai}
                    canReviseInvoiceMonth={canReviseInvoiceMonth}
                    setShowReviseInvoiceModal={setShowReviseInvoiceModal}
                    triggerUpload={triggerUpload}
                    uploadFileDirectly={uploadFileDirectly}
                    canManageStageDocs={canManageStageDocs}
                    deleteDoc={deleteDoc}
                    isINS={isINS}
                    data={data}
                    setData={setData}
                    processing={processing}
                    isMoving={isMoving}
                    handleRejectStage={handleRejectStage}
                />
            )}
            {s === 14 && (
                <Stage14Action
                    job={job}
                    s14={s14}
                    setS14={setS14}
                    handleSaveS14={handleSaveS14}
                    user={user}
                    canSeeNilai={canSeeNilai}
                    triggerUpload={triggerUpload}
                    uploadFileDirectly={uploadFileDirectly}
                    canManageStageDocs={canManageStageDocs}
                    deleteDoc={deleteDoc}
                    isINS={isINS}
                    data={data}
                    setData={setData}
                    processing={processing}
                    isMoving={isMoving}
                    handleRejectStage={handleRejectStage}
                />
            )}
            {s === 15 && (
                <Stage15Action
                    job={job}
                    s15={s15}
                    setS15={setS15}
                    handleSaveS15={handleSaveS15}
                    triggerUpload={triggerUpload}
                    uploadFileDirectly={uploadFileDirectly}
                    canManageStageDocs={canManageStageDocs}
                    deleteDoc={deleteDoc}
                    isINS={isINS}
                    data={data}
                    setData={setData}
                    processing={processing}
                    isMoving={isMoving}
                    handleRejectStage={handleRejectStage}
                />
            )}
            {s === 12 && (
                <Stage12Action
                    job={job}
                    triggerUpload={triggerUpload}
                    uploadFileDirectly={uploadFileDirectly}
                    canManageStageDocs={canManageStageDocs}
                    deleteDoc={deleteDoc}
                    isINS={isINS}
                    user={user}
                    permissions={permissions}
                    data={data}
                    setData={setData}
                    processing={processing}
                    handleReopenJob={handleReopenJob}
                />
            )}
            {s === 16 && (
                <Stage16Action
                    job={job}
                    user={user}
                    permissions={permissions}
                    handleReopenJob={handleReopenJob}
                />
            )}
        </form>
    );
}
