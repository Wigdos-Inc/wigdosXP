// Utility helpers for save/load/export/import and postMessage request/response patterns

// Download JSON as a file
function exportSaveData(filename, dataObj) {
    const blob = new Blob([JSON.stringify(dataObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'save.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

// Import JSON file (returns Promise that resolves to parsed object)
function importSaveFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result);
                resolve(parsed);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

// Simple request/response wrapper using postMessage and a messageId
function postMessageRequest(targetWindow, message, targetOrigin = '*', timeoutMs = 4000) {
    return new Promise((resolve, reject) => {
        const messageId = `req_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
        function onResp(e) {
            if (!e.data || e.data.messageId !== messageId) return;
            window.removeEventListener('message', onResp);
            resolve(e.data);
        }
        window.addEventListener('message', onResp);
        targetWindow.postMessage(Object.assign({}, message, { messageId }), targetOrigin);
        setTimeout(() => {
            window.removeEventListener('message', onResp);
            reject(new Error('postMessageRequest timeout'));
        }, timeoutMs);
    });
}

export { exportSaveData, importSaveFile, postMessageRequest };
