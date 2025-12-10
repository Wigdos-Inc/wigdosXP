// Save Editor - Simplified version
// Communicates with parent via postMessage for save data management

(function() {
  'use strict';
  
  // ===== DOM Elements =====
  const $ = id => document.getElementById(id);
  const status = $('status');
  const controls = $('controls');
  const refreshBtn = $('refreshBtn');
  const gameSelect = $('gameSelect');
  const loadBtn = $('loadBtn');
  const downloadBtn = $('downloadBtn');
  const keysWrap = $('keysWrap');
  const modal = $('se-modal');
  const modalTitle = $('se-modal-title');
  const modalTextarea = $('se-modal-textarea');
  const modalSaveBtn = $('se-modal-save');
  const modalCancelBtn = $('se-modal-cancel');

  // ===== State =====
  let lastSaves = null;
  let lastUser = null;
  const pendingResponses = new Map();

  // Reusable file input
  const fileInput = Object.assign(document.createElement('input'), {
    type: 'file',
    style: 'display:none'
  });
  document.body.appendChild(fileInput);

  // ===== Messaging Utils =====
  const generateMessageId = () => `msg_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  
  const postToParent = (obj) => {
    try {
      window.parent.postMessage(obj, '*');
    } catch (e) {
      console.error('postMessage failed:', e);
    }
  };

  const sendMessage = (type, data = {}, timeout = 5000) => {
    const messageId = generateMessageId();
    return new Promise((resolve) => {
      pendingResponses.set(messageId, resolve);
      postToParent({ type, messageId, ...data });
      setTimeout(() => {
        if (pendingResponses.has(messageId)) {
          pendingResponses.delete(messageId);
          resolve(null);
        }
      }, timeout);
    });
  };

  window.addEventListener('message', (ev) => {
    const { data } = ev;
    if (!data?.type || !data?.messageId) return;
    const callback = pendingResponses.get(data.messageId);
    if (callback) {
      pendingResponses.delete(data.messageId);
      callback(data);
    }
  });

  // ===== Checksum (must match parent) =====
  const generateChecksum = (data) => {
    try {
      const str = JSON.stringify(data);
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash &= hash;
      }
      return hash.toString(36);
    } catch {
      return null;
    }
  };

  // ===== Base64 Utils =====
  const base64ToBytes = (b64) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const bytesToBase64 = (bytes) => btoa(String.fromCharCode(...bytes));
  const textToBase64 = (text) => bytesToBase64(new TextEncoder().encode(text));
  const base64ToText = (b64) => new TextDecoder().decode(base64ToBytes(b64));

  // ===== Serialization =====
  const decodeValue = (s) => {
    if (s === null || s === 'JS:__NULL__') return null;
    if (s === 'JS:__UNDEFINED__') return undefined;
    if (typeof s !== 'string') return s;

    const [prefix, ...rest] = s.split(':');
    const content = rest.join(':');

    try {
      if (prefix === 'JS') {
        return content === '__NULL__' ? null : 
               content === '__UNDEFINED__' ? undefined : 
               JSON.parse(content);
      }
      if (prefix === 'OBJ') return JSON.parse(content);
      if (prefix === 'TA' || prefix === 'AB' || prefix === 'BL') {
        const b64 = prefix === 'TA' ? content.split(':')[1] || '' : content;
        if (!b64) return '';
        const text = base64ToText(b64);
        try { return JSON.parse(text); } catch { return text; }
      }
      if (prefix === 'DATE') return new Date(Number(content)).toString();
    } catch {}
    return s;
  };

  const encodeValue = (value, originalFormat = '') => {
    try {
      const json = JSON.stringify(value);
      if (originalFormat.startsWith('TA:')) {
        const ctor = originalFormat.slice(3).split(':')[0] || 'Int8Array';
        return `TA:${ctor}:${textToBase64(json)}`;
      }
      if (originalFormat.startsWith('AB:')) return `AB:${textToBase64(json)}`;
      if (originalFormat.startsWith('BL:')) return `BL:${textToBase64(json)}`;
      if (originalFormat.startsWith('OBJ:')) return `OBJ:${json}`;
      return `JS:${json}`;
    } catch {
      return `JS:${JSON.stringify(value)}`;
    }
  };

  // ===== Wrapped File Detection =====
  const isWrappedFile = (obj) => obj?.timestamp !== undefined && obj?.mode !== undefined && obj?.contents !== undefined;
  
  const parseWrappedFile = (serialized) => {
    if (typeof serialized !== 'string') return null;
    try {
      const decoded = decodeValue(serialized);
      return isWrappedFile(decoded) ? decoded : null;
    } catch {
      return null;
    }
  };

  // ===== Download Utils =====
  const downloadBlob = (blob, filename) => {
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  // ===== Modal =====
  const showModal = (title, text, onSave) => {
    modalTitle.textContent = title;
    modalTextarea.value = text || '';
    modal.style.display = 'flex';
    modalTextarea.focus();
    modalSaveBtn.onclick = () => { hideModal(); onSave?.(modalTextarea.value); };
    modalCancelBtn.onclick = hideModal;
  };

  const hideModal = () => {
    modal.style.display = 'none';
    modalSaveBtn.onclick = null;
    modalCancelBtn.onclick = null;
  };

  // ===== Save Operations =====
  const saveKey = async (gameId, key, wrapped) => {
    wrapped.checksum = generateChecksum(wrapped.data);
    
    // Try per-key update first
    const resp = await sendMessage('admin_set_wrapped_key', {
      gameId, key, serializedValue: wrapped.data[key]
    }, 7000);
    
    if (resp?.success) {
      lastSaves[gameId] = JSON.stringify(wrapped);
      return { success: true };
    }
    
    // Fallback to full save
    const resp2 = await sendMessage('admin_set_wrapped_save', {
      gameId, wrappedString: JSON.stringify(wrapped)
    }, 7000);
    
    if (!resp2) return { success: false, error: 'No response' };
    if (resp2.success) {
      lastSaves[gameId] = JSON.stringify(wrapped);
      return { success: true, fallback: true };
    }
    return { success: false, error: resp2.error || 'Save failed' };
  };

  const saveFull = async (gameId, wrapped) => {
    wrapped.checksum = generateChecksum(wrapped.data);
    const resp = await sendMessage('admin_set_wrapped_save', {
      gameId, wrappedString: JSON.stringify(wrapped)
    }, 7000);
    
    if (!resp) return { success: false, error: 'No response' };
    if (resp.success) lastSaves[gameId] = JSON.stringify(wrapped);
    return { success: resp.success, error: resp.error };
  };

  // ===== Main UI Functions =====
  const refresh = async () => {
    status.textContent = 'Requesting saves...';
    const res = await sendMessage('admin_get_all_saves');
    
    if (!res) {
      status.textContent = 'No response from parent';
      controls.style.display = 'block';
      return;
    }
    
    lastUser = res.user;
    lastSaves = res.savesDoc || {};
    status.textContent = `Loaded saves for: ${res.user || 'unknown'}`;
    controls.style.display = 'block';
    populateGameSelect(Object.keys(lastSaves));
  };

  const populateGameSelect = (gameIds) => {
    gameSelect.innerHTML = '<option value="">-- select game --</option>';
    gameIds.forEach(id => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = id;
      gameSelect.appendChild(opt);
    });
    
    if (gameIds.length === 1) {
      gameSelect.value = gameIds[0];
      setTimeout(() => loadGame(gameIds[0]), 100);
    }
  };

  const loadGame = (gameId) => {
    const wrappedString = lastSaves[gameId];
    if (!wrappedString) return alert(`No save found for ${gameId}`);
    
    try {
      renderSaveEditor(gameId, JSON.parse(wrappedString));
    } catch {
      alert('Invalid save data');
    }
  };

  const downloadGame = (gameId) => {
    const wrappedString = lastSaves[gameId];
    if (!wrappedString) return alert(`No save found for ${gameId}`);
    downloadBlob(
      new Blob([wrappedString], { type: 'application/json' }),
      `${gameId}.wrapped.json`
    );
  };

  // ===== UI Helpers =====
  const createElement = (tag, props = {}, children = []) => {
    const el = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (k === 'style' && typeof v === 'object') {
        Object.assign(el.style, v);
      } else if (k.startsWith('on')) {
        el.addEventListener(k.slice(2).toLowerCase(), v);
      } else {
        el[k] = v;
      }
    });
    children.forEach(child => el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child));
    return el;
  };

  const btn = (text, onClick) => createElement('button', { textContent: text, onClick });

  // ===== Main Render Function =====
  const renderSaveEditor = (gameId, wrapped) => {
    keysWrap.innerHTML = '';
    keysWrap.appendChild(createElement('h2', { textContent: `Edit ${gameId} (v${wrapped.version || 'n/a'})` }));

    const keys = Object.keys(wrapped.data || {}).filter(k => !k.endsWith('::ts') && !k.startsWith('_'));
    
    if (keys.length === 0) {
      keysWrap.appendChild(createElement('p', { textContent: 'No keys in this save.' }));
    } else {
      keys.forEach(key => {
      const raw = wrapped.data[key];
      
      console.log(`\n=== Processing key: ${key} ===`);
      console.log('Raw value type:', typeof raw);
      console.log('Raw value preview:', raw?.substring?.(0, 100) || raw);
      
      // Always try to decode first to see what we get
      const decoded = decodeValue(raw);
      console.log('Decoded value type:', typeof decoded);
      console.log('Decoded value:', decoded);
      
      const wrappedFile = isWrappedFile(decoded) ? decoded : null;
      console.log('Is wrapped file:', !!wrappedFile);
      
      const isFile = !!wrappedFile;
      
      let displayValue = '';
      if (isFile) {
        // For wrapped files, the contents field might ALSO be serialized, so decode it
        let contents = wrappedFile.contents;
        
        // If contents is a serialized string, decode it
        if (typeof contents === 'string' && (contents.startsWith('TA:') || contents.startsWith('AB:') || contents.startsWith('BL:'))) {
          console.log('Contents is serialized, decoding...');
          contents = decodeValue(contents);
          console.log('Decoded contents type:', typeof contents);
          console.log('Decoded contents preview:', contents?.substring?.(0, 100) || contents);
        }
        
        if (typeof contents === 'string') {
          displayValue = contents;
        } else if (typeof contents === 'object') {
          displayValue = JSON.stringify(contents, null, 2);
        } else {
          displayValue = String(contents ?? '');
        }
      } else {
        // Not a wrapped file, just show the decoded value
        if (decoded === null) displayValue = 'null';
        else if (decoded === undefined) displayValue = 'undefined';
        else if (typeof decoded === 'object') displayValue = JSON.stringify(decoded, null, 2);
        else displayValue = String(decoded);
      }
      
      console.log('Final display value preview:', displayValue.substring(0, 100));

      const [prefix] = raw?.split(':') || [];
      let typeText = 'String';
      if (isFile) {
        // Decode the mode value if it's serialized
        let modeValue = wrappedFile.mode;
        if (typeof modeValue === 'string' && modeValue.startsWith('JS:')) {
          try {
            modeValue = JSON.parse(modeValue.slice(3));
          } catch {}
        }
        typeText = `File (mode: ${modeValue})`;
      } else {
        typeText = prefix === 'TA' ? 'TypedArray' :
                   prefix === 'AB' ? 'ArrayBuffer' :
                   prefix === 'BL' ? 'Blob' :
                   prefix === 'OBJ' ? 'Object' :
                   prefix === 'JS' ? 'Value' : 'String';
      }

      const keyDiv = createElement('div', {
        className: 'key-item',
        style: { marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #ddd' }
      }, [
        createElement('h3', { textContent: key, style: { margin: '0 0 4px 0' } }),
        createElement('div', { textContent: typeText, style: { fontSize: '11px', color: '#666', marginBottom: '6px' } }),
        createElement('pre', { 
          textContent: displayValue,
          className: 'key-value'
        })
      ]);

      // Edit button
      keyDiv.appendChild(btn('Edit', () => {
        showModal(`Edit ${key}`, displayValue, (newText) => {
          if (isFile) {
            wrappedFile.contents = newText;
            wrapped.data[key] = encodeValue(wrappedFile, raw);
          } else {
            wrapped.data[key] = encodeValue(newText, raw);
          }
          renderSaveEditor(gameId, wrapped);
        });
      }));

      // Save button
      keyDiv.appendChild(btn('Save', async () => {
        const result = await saveKey(gameId, key, wrapped);
        if (result.success) {
          alert(result.fallback ? 'Saved (fallback)' : 'Saved');
        } else {
          alert(`Failed: ${result.error}`);
        }
      }));

      // Upload button
      keyDiv.appendChild(btn('Upload', () => {
        fileInput.value = '';
        fileInput.onchange = async (ev) => {
          const file = ev.target.files?.[0];
          if (!file) return;
          try {
            const text = await file.text();
            if (isFile) {
              wrappedFile.contents = text;
              wrapped.data[key] = encodeValue(wrappedFile, raw);
            } else {
              wrapped.data[key] = encodeValue(text, raw);
            }
            renderSaveEditor(gameId, wrapped);
          } catch (err) {
            alert(`Upload failed: ${err.message}`);
          }
        };
        fileInput.click();
      }));

      // Delete button
      keyDiv.appendChild(btn('Delete', async () => {
        if (!confirm(`Delete "${key}"?`)) return;
        delete wrapped.data[key];
        delete wrapped.data[key + '::ts'];
        const result = await saveFull(gameId, wrapped);
        if (result.success) {
          renderSaveEditor(gameId, wrapped);
        } else {
          alert(`Delete failed: ${result.error}`);
        }
      }));

      // Download button
      keyDiv.appendChild(btn('Download', () => {
        try {
          // Extract just the filename from the key path (e.g., "dt/_savedata/filech3_0" -> "filech3_0")
          const filename = key.split('/').pop();
          // Download the actual decoded content that's being displayed
          downloadBlob(new Blob([displayValue], { type: 'text/plain' }), filename);
        } catch (err) {
          alert(`Download failed: ${err.message}`);
        }
      }));

      keysWrap.appendChild(keyDiv);
    });
    }

    // Add new file section (always show, even if no files exist)
    const addFileDiv = createElement('div', {
      style: { marginTop: '20px', padding: '16px', background: '#f9f9f9', borderRadius: '4px', borderTop: '2px solid #ddd' }
    });
    
    const addFileTitle = createElement('h3', { textContent: 'Add New File', style: { marginTop: 0 } });
    addFileDiv.appendChild(addFileTitle);
    
    const pathInput = createElement('input', {
      type: 'text',
      placeholder: 'File path (e.g., dt/_savedata/newfile)',
      style: { width: '300px', padding: '6px', marginRight: '8px', border: '1px solid #ccc', borderRadius: '4px' }
    });
    addFileDiv.appendChild(pathInput);
    
    addFileDiv.appendChild(btn('Choose File', () => {
      fileInput.value = '';
      fileInput.onchange = async (ev) => {
        const file = ev.target.files?.[0];
        if (!file) return;
        
        const path = pathInput.value.trim();
        if (!path) return alert('Please enter a file path first');
        
        try {
          const text = await file.text();
          
          // Create a wrapped file object with the new content
          const wrappedFileObj = {
            timestamp: `DATE:${Date.now()}`,
            mode: 'JS:33206',
            contents: `TA:Int8Array:${textToBase64(text)}`
          };
          
          // Encode it as OBJ:
          wrapped.data[path] = `OBJ:${JSON.stringify(wrappedFileObj)}`;
          
          // Save to parent
          const result = await saveFull(gameId, wrapped);
          if (result.success) {
            alert('File added successfully!');
            renderSaveEditor(gameId, wrapped);
            pathInput.value = '';
          } else {
            alert(`Failed to add file: ${result.error}`);
          }
        } catch (err) {
          alert(`Failed to read file: ${err.message}`);
        }
      };
      fileInput.click();
    }));
    
    keysWrap.appendChild(addFileDiv);
    
    // Save all button
    keysWrap.appendChild(btn('Save All to Parent', async () => {
      const result = await saveFull(gameId, wrapped);
      alert(result.success ? 'Saved' : `Failed: ${result.error}`);
    }));
  };

  // ===== Event Listeners =====
  refreshBtn.addEventListener('click', refresh);
  gameSelect.addEventListener('change', () => {
    const gameId = gameSelect.value;
    if (gameId) loadGame(gameId);
  });
  loadBtn.addEventListener('click', () => {
    const gameId = gameSelect.value;
    if (!gameId) return alert('Select a game');
    loadGame(gameId);
  });
  downloadBtn.addEventListener('click', () => {
    const gameId = gameSelect.value;
    if (!gameId) return alert('Select a game');
    downloadGame(gameId);
  });

  // ===== Initialize =====
  controls.style.display = 'block';
  status.textContent = 'Loading...';
  setTimeout(refresh, 200);
})();
