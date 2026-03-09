const secrets = {
  "tv time": {
    video: "assets/mp4/TENNA BATTLE THEME DELTARUNE CHAPTER 3.mp4",
    audio: "assets/music/27. Its TV Time! (DELTARUNE Chapter 34 Soundtrack) - Toby Fox.mp3",
    gif: "assets/secrets/gif/tenna.gif"
  },
  //where the "Asgore" is placed at will be the code that will need to be inputted
  "asgore": {
    video: "assets/videos/bergentruck.mp4",
    audio: "assets/videos/bergentruck.mp4",
    gif: ""
  },
  "github": {
    video: "assets/videos/far.mp4",
    audio: "assets/audio/misc/buddy_holly_riff.mp3",
    gif: ""
  },
  "disturbing the peace": {
    video: "assets/videos/persona5_opening.mp4",
    audio: "assets/audio/music/going_down.mp3",
    gif: "assets/gifs/misc/haru_okumura.gif"
  },
  "steve": {
    video: "assets/videos/steve.mp4",
    audio: "assets/music/C418 - Living Mice - Minecraft Volume Alpha.mp3",
    gif: "assets/gifs/misc/steve.gif"
  },
  "criminal": {
    video: "assets/videos/criminal.mp4",
    audio: "assets/sfx/criminal.mp3",
    gif: ""
  },
  "nword": {
    video: "assets/videos/Nword.mp4",
    audio: "assets/audio/music/Nword.mp3",
    gif: ""
  },
  // add for more secrets
};

const WIGGLE_ADMIN_TEST_ACCOUNTS = ['tests', 'testaccount'];
const WIGGLE_ADMIN_DEFAULT_CODE = 'WIGDOS-ADMIN-2003';
const WIGGLE_ADMIN_PANEL_POS_KEY = 'wiggle_admin_panel_position';
const WIGGLE_ADMIN_PANEL_SIZE_KEY = 'wiggle_admin_panel_size';
const WIGGLE_ADMIN_PANEL_HIDDEN_KEY = 'wiggle_admin_panel_hidden';
const WIGGLE_ADMIN_PFP_CACHE_PREFIX = 'pfp_';
let wiggleUserCache = null;

function normalizeWiggleUsername(username) {
  return String(username || '').trim().toLowerCase();
}

function getWiggleRootWindow() {
  let current = window;
  while (true) {
    try {
      if (!current.parent || current.parent === current) {
        break;
      }
      current = current.parent;
    } catch (e) {
      break;
    }
  }
  return current;
}

function getWiggleFirebaseAPI() {
  let current = window;
  while (true) {
    try {
      if (current.firebaseAPI) {
        return {
          api: current.firebaseAPI,
          online: current.firebaseOnline === true
        };
      }
      if (!current.parent || current.parent === current) break;
      current = current.parent;
    } catch (e) {
      break;
    }
  }
  return { api: null, online: false };
}

function getCurrentWigdosUser() {
  let current = window;
  while (true) {
    try {
      if (typeof current.getUser === 'function') {
        const user = current.getUser();
        return (user || 'guest').trim();
      }
      if (!current.parent || current.parent === current) break;
      current = current.parent;
    } catch (e) {
      break;
    }
  }
  return (localStorage.getItem('username') || 'guest').trim();
}

async function getWiggleUserDoc(username) {
  const { api, online } = getWiggleFirebaseAPI();
  if (!online || !api || !api.db) return null;
  const { doc, getDoc } = api;
  const raw = String(username || '').trim();
  const normalized = normalizeWiggleUsername(raw);
  if (!normalized) return null;

  const normalizedSnap = await getDoc(doc(api.db, 'users', normalized));
  if (normalizedSnap.exists()) return normalizedSnap.data();

  if (raw && raw !== normalized) {
    const rawSnap = await getDoc(doc(api.db, 'users', raw));
    if (rawSnap.exists()) return rawSnap.data();
  }

  return null;
}

async function updateWiggleUserDoc(username, fields) {
  const { api, online } = getWiggleFirebaseAPI();
  if (!online || !api || !api.db) {
    throw new Error('This action requires an online Firebase connection.');
  }
  const { doc, getDoc, setDoc } = api;
  const raw = String(username || '').trim();
  const normalized = normalizeWiggleUsername(raw);
  if (!normalized) {
    throw new Error('Please enter a username.');
  }

  let targetDocId = normalized;
  if (raw && raw !== normalized) {
    const rawSnap = await getDoc(doc(api.db, 'users', raw));
    if (rawSnap.exists()) {
      targetDocId = raw;
    }
  }

  await setDoc(doc(api.db, 'users', targetDocId), fields, { merge: true });
}

function filterRepliesByAuthor(replies, author, counter) {
  if (!Array.isArray(replies)) return [];
  const result = [];
  for (const reply of replies) {
    if ((reply.author || '').toLowerCase() === author) {
      counter.count += 1;
      continue;
    }
    const cleaned = { ...reply };
    if (Array.isArray(cleaned.replies)) {
      cleaned.replies = filterRepliesByAuthor(cleaned.replies, author, counter);
    }
    result.push(cleaned);
  }
  return result;
}

async function removeWigTubeCommentsByUser(username) {
  const target = (username || '').trim().toLowerCase();
  if (!target) throw new Error('Please enter a username.');

  const { api, online } = getWiggleFirebaseAPI();
  if (!online || !api || !api.db) {
    throw new Error('This action requires an online Firebase connection.');
  }

  const { doc, getDoc, setDoc, updateDoc, collection } = api;
  const commentsRef = doc(api.db, 'wigtube', 'wigtube_comments');
  const commentsSnap = await getDoc(commentsRef);
  const commentsData = commentsSnap.exists() ? commentsSnap.data() : {};
  const commentsMap = commentsData.comments || {};

  let removed = 0;
  const affectedVideos = [];

  Object.keys(commentsMap).forEach((videoId) => {
    const currentComments = Array.isArray(commentsMap[videoId]) ? commentsMap[videoId] : [];
    const counter = { count: 0 };

    const filtered = currentComments
      .filter((comment) => {
        const isTarget = (comment.author || '').toLowerCase() === target;
        if (isTarget) counter.count += 1;
        return !isTarget;
      })
      .map((comment) => {
        const cleanedComment = { ...comment };
        cleanedComment.replies = filterRepliesByAuthor(comment.replies, target, counter);
        return cleanedComment;
      });

    if (counter.count > 0) {
      removed += counter.count;
      commentsMap[videoId] = filtered;
      affectedVideos.push({ videoId, count: filtered.length });
    }
  });

  if (removed === 0) {
    return 0;
  }

  await setDoc(commentsRef, { comments: commentsMap }, { merge: true });

  // Keep per-video comment counts in sync with top-level comments.
  const videoCollectionRef = collection(api.db, 'wigtube', 'data', 'videos');
  await Promise.all(
    affectedVideos.map(async (item) => {
      const videoRef = doc(videoCollectionRef, item.videoId);
      try {
        await updateDoc(videoRef, { commentCount: item.count });
      } catch (e) {
        console.warn('[WiggleAdmin] Failed to update comment count for', item.videoId, e);
      }
    })
  );

  return removed;
}

async function removeWigCordMessagesByUser(username) {
  const target = (username || '').trim().toLowerCase();
  if (!target) throw new Error('Please enter a username.');

  const { api, online } = getWiggleFirebaseAPI();
  if (!online || !api || !api.db) {
    throw new Error('This action requires an online Firebase connection.');
  }

  const { collection, getDocs, deleteDoc } = api;
  const channelsRef = collection(api.db, 'wigcord', 'data', 'messages');
  const channelsSnap = await getDocs(channelsRef);

  let removed = 0;
  for (const channelDoc of channelsSnap.docs) {
    const msgsRef = collection(channelDoc.ref, 'msgs');
    const msgsSnap = await getDocs(msgsRef);
    for (const msgDoc of msgsSnap.docs) {
      const data = msgDoc.data() || {};
      if ((data.author || '').toLowerCase() === target) {
        await deleteDoc(msgDoc.ref);
        removed += 1;
      }
    }
  }

  return removed;
}

async function deleteWigTubeVideosByUser(username) {
  const target = (username || '').trim().toLowerCase();
  if (!target) throw new Error('Please enter a username.');

  const { api, online } = getWiggleFirebaseAPI();
  if (!online || !api || !api.db) {
    throw new Error('This action requires an online Firebase connection.');
  }

  const { collection, getDocs, deleteDoc, doc, getDoc, setDoc } = api;
  const videosRef = collection(api.db, 'wigtube', 'data', 'videos');
  const videosSnap = await getDocs(videosRef);

  const deletedVideoIds = [];
  for (const videoDoc of videosSnap.docs) {
    const data = videoDoc.data() || {};
    const uploaderId = (data.uploaderId || '').toLowerCase();
    const uploaderName = (data.uploaderName || '').toLowerCase();
    if (uploaderId === target || uploaderName === target) {
      await deleteDoc(videoDoc.ref);
      deletedVideoIds.push(videoDoc.id);
    }
  }

  if (deletedVideoIds.length > 0) {
    const commentsRef = doc(api.db, 'wigtube', 'wigtube_comments');
    const commentsSnap = await getDoc(commentsRef);
    if (commentsSnap.exists()) {
      const data = commentsSnap.data() || {};
      const commentsMap = data.comments || {};
      deletedVideoIds.forEach((videoId) => {
        delete commentsMap[videoId];
      });
      await setDoc(commentsRef, { comments: commentsMap }, { merge: true });
    }
  }

  return deletedVideoIds.length;
}

async function getAllWigdosUsernames() {
  if (Array.isArray(wiggleUserCache)) {
    return wiggleUserCache;
  }

  const { api, online } = getWiggleFirebaseAPI();
  if (!online || !api || !api.db) {
    throw new Error('This action requires an online Firebase connection.');
  }

  const { collection, getDocs } = api;
  const snap = await getDocs(collection(api.db, 'users'));
  wiggleUserCache = snap.docs.map((d) => d.id).sort((a, b) => a.localeCompare(b));
  return wiggleUserCache;
}

async function searchUsersByPrefix(prefix) {
  const allUsers = await getAllWigdosUsernames();
  const normalized = (prefix || '').trim().toLowerCase();
  if (!normalized) return allUsers.slice(0, 12);
  return allUsers.filter((user) => user.toLowerCase().startsWith(normalized)).slice(0, 12);
}

async function removeSpecificWigTubeComment(videoId, commentId) {
  const { api, online } = getWiggleFirebaseAPI();
  if (!online || !api || !api.db) {
    throw new Error('This action requires an online Firebase connection.');
  }

  const { doc, getDoc, setDoc, updateDoc, collection } = api;
  const commentsRef = doc(api.db, 'wigtube', 'wigtube_comments');
  const commentsSnap = await getDoc(commentsRef);
  if (!commentsSnap.exists()) return false;

  const commentsData = commentsSnap.data() || {};
  const comments = commentsData.comments || {};
  const videoComments = Array.isArray(comments[videoId]) ? comments[videoId] : [];
  const nextComments = videoComments.filter((comment) => comment.id !== commentId);
  const changed = nextComments.length !== videoComments.length;
  if (!changed) return false;

  comments[videoId] = nextComments;
  await setDoc(commentsRef, { comments }, { merge: true });

  const videosCollectionRef = collection(api.db, 'wigtube', 'data', 'videos');
  const videoRef = doc(videosCollectionRef, videoId);
  try {
    await updateDoc(videoRef, { commentCount: nextComments.length });
  } catch (e) {
    console.warn('[WiggleAdmin] Failed to sync comment count for specific deletion:', e);
  }

  return true;
}

async function removeSpecificWigTubeVideo(videoId) {
  const { api, online } = getWiggleFirebaseAPI();
  if (!online || !api || !api.db) {
    throw new Error('This action requires an online Firebase connection.');
  }

  const { collection, doc, deleteDoc, getDoc, setDoc } = api;
  const videosRef = collection(api.db, 'wigtube', 'data', 'videos');
  await deleteDoc(doc(videosRef, videoId));

  const commentsRef = doc(api.db, 'wigtube', 'wigtube_comments');
  const commentsSnap = await getDoc(commentsRef);
  if (commentsSnap.exists()) {
    const data = commentsSnap.data() || {};
    const commentsMap = data.comments || {};
    if (commentsMap[videoId]) {
      delete commentsMap[videoId];
      await setDoc(commentsRef, { comments: commentsMap }, { merge: true });
    }
  }
}

async function removeSpecificWigCordMessage(channelId, messageId) {
  const { api, online } = getWiggleFirebaseAPI();
  if (!online || !api || !api.db) {
    throw new Error('This action requires an online Firebase connection.');
  }

  const { doc, deleteDoc } = api;
  await deleteDoc(doc(api.db, 'wigcord', 'data', 'messages', channelId, 'msgs', messageId));
}

async function findSpecificWigTubeItemsByPrefix(prefix) {
  const { api, online } = getWiggleFirebaseAPI();
  if (!online || !api || !api.db) {
    throw new Error('This action requires an online Firebase connection.');
  }

  const normalized = (prefix || '').trim().toLowerCase();
  if (!normalized) return { comments: [], videos: [] };

  const { doc, getDoc, collection, getDocs } = api;
  const commentsRef = doc(api.db, 'wigtube', 'wigtube_comments');
  const commentsSnap = await getDoc(commentsRef);
  const commentsData = commentsSnap.exists() ? commentsSnap.data() : {};
  const commentsMap = commentsData.comments || {};

  const comments = [];
  Object.keys(commentsMap).forEach((videoId) => {
    const videoComments = Array.isArray(commentsMap[videoId]) ? commentsMap[videoId] : [];
    videoComments.forEach((comment) => {
      if ((comment.author || '').toLowerCase().startsWith(normalized)) {
        comments.push({
          videoId,
          commentId: comment.id,
          author: comment.author || 'unknown',
          text: (comment.text || '').slice(0, 120),
          timestamp: comment.timestamp || ''
        });
      }
    });
  });

  const videos = [];
  const videosSnap = await getDocs(collection(api.db, 'wigtube', 'data', 'videos'));
  videosSnap.docs.forEach((videoDoc) => {
    const data = videoDoc.data() || {};
    const uploader = (data.uploaderName || data.uploaderId || '').toLowerCase();
    if (uploader.startsWith(normalized)) {
      videos.push({
        videoId: videoDoc.id,
        title: data.title || videoDoc.id,
        uploader: data.uploaderName || data.uploaderId || 'unknown'
      });
    }
  });

  return { comments: comments.slice(0, 30), videos: videos.slice(0, 30) };
}

async function findSpecificWigCordMessagesByPrefix(prefix) {
  const { api, online } = getWiggleFirebaseAPI();
  if (!online || !api || !api.db) {
    throw new Error('This action requires an online Firebase connection.');
  }

  const normalized = (prefix || '').trim().toLowerCase();
  if (!normalized) return [];

  const { collection, getDocs } = api;
  const channelsSnap = await getDocs(collection(api.db, 'wigcord', 'data', 'messages'));
  const messages = [];

  for (const channelDoc of channelsSnap.docs) {
    const msgsSnap = await getDocs(collection(channelDoc.ref, 'msgs'));
    for (const msgDoc of msgsSnap.docs) {
      const data = msgDoc.data() || {};
      if ((data.author || '').toLowerCase().startsWith(normalized)) {
        messages.push({
          channelId: channelDoc.id,
          messageId: msgDoc.id,
          author: data.author || 'unknown',
          content: (data.content || data.text || '').slice(0, 120),
          timestamp: data.timestamp || data.createdAt || ''
        });
      }
    }
  }

  return messages.slice(0, 40);
}

function createAdminPanelMarkup(username, panelTitle) {
  return `
    <button id="wiggleAdminShowBtn" style="position: fixed; top: 72px; right: 12px; z-index: 11999; display: none; padding: 6px 10px; border: 1px solid #2f4f85; background: #dfeaff; color: #1f3d66; font-family: Tahoma, sans-serif; font-size: 12px; cursor: pointer; box-shadow: 2px 2px 0 #7f9db9;">Show Admin Panel</button>
    <div id="wiggleAdminShell" style="position: fixed; top: 72px; right: 12px; width: min(760px, calc(100vw - 24px)); min-width: 360px; min-height: 260px; max-width: calc(100vw - 16px); max-height: calc(100vh - 16px); overflow: auto; border: 2px solid #0d2c63; background: #f3f8ff; box-shadow: 3px 3px 0 #7f9db9; font-family: Tahoma, sans-serif; z-index: 12000;">
      <div id="wiggleAdminDragHandle" style="padding: 10px 12px; background: linear-gradient(to right, #1a4f9c, #3c88df); color: #fff; font-weight: bold; font-size: 13px; cursor: move; user-select: none; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
        <span>${panelTitle} <span style="font-size: 11px; opacity: 0.9;">(drag + resize)</span></span>
        <button id="wiggleAdminHideBtn" style="padding: 3px 8px; border: 1px solid #f0f6ff; background: rgba(255,255,255,0.2); color: #fff; font-family: Tahoma, sans-serif; font-size: 11px; cursor: pointer;">Hide</button>
      </div>
      <div id="wiggleAdminGate" style="padding: 12px; border-top: 1px solid #d0def3;">
        <div style="font-size: 12px; margin-bottom: 8px; color: #1f3d66;">Signed in as <strong>${username}</strong>. Enter your admin confirmation code.</div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <input id="wiggleAdminCodeInput" type="password" placeholder="Admin confirmation code" style="flex: 1; min-width: 210px; padding: 6px; border: 1px solid #7f9db9;" />
          <button id="wiggleAdminUnlockBtn" style="padding: 6px 12px; border: 1px solid #2f4f85; background: #dfeaff; cursor: pointer;">Unlock</button>
        </div>
        <div id="wiggleAdminGateStatus" style="margin-top: 8px; font-size: 12px; color: #8a1c1c;"></div>
      </div>
      <div id="wiggleAdminPanel" style="display: none; padding: 12px; border-top: 1px solid #d0def3;">
        <div style="display: grid; gap: 10px;">
          <div style="padding: 10px; border: 1px solid #c2d8f5; background: #fff;">
            <div style="font-size: 12px; font-weight: bold; margin-bottom: 6px;">User Roles and Access</div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <input id="adminTargetUser" type="text" placeholder="Target username" style="flex: 1; min-width: 180px; padding: 6px; border: 1px solid #7f9db9;" />
              <button id="setAdminBtn" style="padding: 6px 10px;">Make Admin</button>
              <button id="removeAdminBtn" style="padding: 6px 10px;">Remove Admin</button>
              <button id="banSearchBtn" style="padding: 6px 10px;">Ban WiggleSearch</button>
              <button id="unbanSearchBtn" style="padding: 6px 10px;">Unban WiggleSearch</button>
            </div>
            <div id="adminSelectedUserCard" style="display:none; margin-top:8px;"></div>
          </div>
          <div style="padding: 10px; border: 1px solid #c2d8f5; background: #fff;">
            <div style="font-size: 12px; font-weight: bold; margin-bottom: 6px;">WigTube Moderation</div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <input id="wigtubeTargetUser" type="text" placeholder="Target username" style="flex: 1; min-width: 180px; padding: 6px; border: 1px solid #7f9db9;" />
              <button id="banCommentsBtn" style="padding: 6px 10px;">Ban Commenting</button>
              <button id="unbanCommentsBtn" style="padding: 6px 10px;">Unban Commenting</button>
              <button id="removeCommentsBtn" style="padding: 6px 10px;">Remove Comments</button>
              <button id="deleteVideosBtn" style="padding: 6px 10px;">Delete User Videos</button>
              <button id="findWigTubeSpecificBtn" style="padding: 6px 10px;">Find Specific Items</button>
            </div>
            <div id="wigtubeSelectedUserCard" style="display:none; margin-top:8px;"></div>
            <div id="wigTubeSpecificResults" style="margin-top: 8px; max-height: 180px; overflow: auto; font-size: 11px; border-top: 1px solid #dbe7f7; padding-top: 8px;"></div>
          </div>
          <div style="padding: 10px; border: 1px solid #c2d8f5; background: #fff;">
            <div style="font-size: 12px; font-weight: bold; margin-bottom: 6px;">WigCord Moderation</div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <input id="wigcordTargetUser" type="text" placeholder="Target username" style="flex: 1; min-width: 180px; padding: 6px; border: 1px solid #7f9db9;" />
              <button id="removeWigcordMessagesBtn" style="padding: 6px 10px;">Remove User Messages</button>
              <button id="findWigCordSpecificBtn" style="padding: 6px 10px;">Find Specific Messages</button>
            </div>
            <div id="wigcordSelectedUserCard" style="display:none; margin-top:8px;"></div>
            <div id="wigCordSpecificResults" style="margin-top: 8px; max-height: 180px; overflow: auto; font-size: 11px; border-top: 1px solid #dbe7f7; padding-top: 8px;"></div>
          </div>
          <datalist id="wiggleAdminUserSuggestions"></datalist>
          <div id="wiggleAdminStatus" style="font-size: 12px; color: #173f21; padding: 8px; border: 1px solid #b8d8be; background: #f2fff4;">Ready.</div>
        </div>
      </div>
      <div data-resize-dir="n" style="position: absolute; top: -4px; left: 8px; right: 8px; height: 8px; cursor: n-resize; z-index: 12010;"></div>
      <div data-resize-dir="s" style="position: absolute; bottom: -4px; left: 8px; right: 8px; height: 8px; cursor: s-resize; z-index: 12010;"></div>
      <div data-resize-dir="e" style="position: absolute; top: 8px; right: -4px; bottom: 8px; width: 8px; cursor: e-resize; z-index: 12010;"></div>
      <div data-resize-dir="w" style="position: absolute; top: 8px; left: -4px; bottom: 8px; width: 8px; cursor: w-resize; z-index: 12010;"></div>
      <div data-resize-dir="ne" style="position: absolute; top: -4px; right: -4px; width: 10px; height: 10px; cursor: ne-resize; z-index: 12011;"></div>
      <div data-resize-dir="nw" style="position: absolute; top: -4px; left: -4px; width: 10px; height: 10px; cursor: nw-resize; z-index: 12011;"></div>
      <div data-resize-dir="se" style="position: absolute; bottom: -4px; right: -4px; width: 10px; height: 10px; cursor: se-resize; z-index: 12011;"></div>
      <div data-resize-dir="sw" style="position: absolute; bottom: -4px; left: -4px; width: 10px; height: 10px; cursor: sw-resize; z-index: 12011;"></div>
    </div>
  `;
}

function clampAdminPanelToViewport(panel) {
  const margin = 8;
  panel.style.maxWidth = `${Math.max(320, window.innerWidth - (margin * 2))}px`;
  panel.style.maxHeight = `${Math.max(220, window.innerHeight - (margin * 2))}px`;
  const rect = panel.getBoundingClientRect();
  const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
  const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);
  const currentLeft = parseInt(panel.style.left || `${rect.left}`, 10);
  const currentTop = parseInt(panel.style.top || `${rect.top}`, 10);
  const safeLeft = Math.min(Math.max(Number.isFinite(currentLeft) ? currentLeft : margin, margin), maxLeft);
  const safeTop = Math.min(Math.max(Number.isFinite(currentTop) ? currentTop : margin, margin), maxTop);

  panel.style.left = `${safeLeft}px`;
  panel.style.top = `${safeTop}px`;
  panel.style.right = 'auto';
}

function restoreAdminPanelSize(panel) {
  try {
    const raw = localStorage.getItem(WIGGLE_ADMIN_PANEL_SIZE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (typeof parsed.width !== 'number' || typeof parsed.height !== 'number') return;
    panel.style.width = `${Math.max(360, parsed.width)}px`;
    panel.style.height = `${Math.max(260, parsed.height)}px`;
  } catch (e) {
    console.warn('[WiggleAdmin] Failed to restore panel size:', e);
  }
}

function saveAdminPanelSize(panel) {
  try {
    const rect = panel.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    localStorage.setItem(WIGGLE_ADMIN_PANEL_SIZE_KEY, JSON.stringify({ width, height }));
  } catch (e) {
    console.warn('[WiggleAdmin] Failed to save panel size:', e);
  }
}

function restoreAdminPanelPosition(panel) {
  try {
    const raw = localStorage.getItem(WIGGLE_ADMIN_PANEL_POS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (typeof parsed.left !== 'number' || typeof parsed.top !== 'number') return;
    panel.style.left = `${parsed.left}px`;
    panel.style.top = `${parsed.top}px`;
    panel.style.right = 'auto';
  } catch (e) {
    console.warn('[WiggleAdmin] Failed to restore panel position:', e);
  }
}

function saveAdminPanelPosition(panel) {
  try {
    const left = parseInt(panel.style.left || '0', 10);
    const top = parseInt(panel.style.top || '0', 10);
    localStorage.setItem(WIGGLE_ADMIN_PANEL_POS_KEY, JSON.stringify({ left, top }));
  } catch (e) {
    console.warn('[WiggleAdmin] Failed to save panel position:', e);
  }
}

function makeAdminPanelDraggable(panel) {
  const handle = panel.querySelector('#wiggleAdminDragHandle');
  if (!handle) return;

  let dragState = null;

  const onMouseMove = (event) => {
    if (!dragState) return;
    panel.style.left = `${event.clientX - dragState.offsetX}px`;
    panel.style.top = `${event.clientY - dragState.offsetY}px`;
    panel.style.right = 'auto';
    clampAdminPanelToViewport(panel);
  };

  const stopDrag = () => {
    if (!dragState) return;
    dragState = null;
    document.body.style.userSelect = '';
    saveAdminPanelPosition(panel);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', stopDrag);
  };

  handle.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;
    if (event.target.closest('button')) return;
    if (event.target.closest('[data-resize-dir]')) return;
    event.preventDefault();

    const rect = panel.getBoundingClientRect();
    panel.style.left = `${rect.left}px`;
    panel.style.top = `${rect.top}px`;
    panel.style.right = 'auto';

    dragState = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };

    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopDrag);
  });

  window.addEventListener('resize', () => {
    clampAdminPanelToViewport(panel);
    saveAdminPanelSize(panel);
    saveAdminPanelPosition(panel);
  });
}

function makeAdminPanelResizable(panel) {
  const handles = panel.querySelectorAll('[data-resize-dir]');
  if (!handles.length) return;

  const margin = 8;
  const minWidth = 360;
  const minHeight = 260;
  let resizeState = null;

  const onResizeMove = (event) => {
    if (!resizeState) return;

    const dx = event.clientX - resizeState.startX;
    const dy = event.clientY - resizeState.startY;
    const dir = resizeState.dir;

    let nextLeft = resizeState.startLeft;
    let nextTop = resizeState.startTop;
    let nextWidth = resizeState.startWidth;
    let nextHeight = resizeState.startHeight;

    if (dir.includes('e')) nextWidth = resizeState.startWidth + dx;
    if (dir.includes('s')) nextHeight = resizeState.startHeight + dy;
    if (dir.includes('w')) {
      nextWidth = resizeState.startWidth - dx;
      nextLeft = resizeState.startLeft + dx;
    }
    if (dir.includes('n')) {
      nextHeight = resizeState.startHeight - dy;
      nextTop = resizeState.startTop + dy;
    }

    if (nextWidth < minWidth) {
      if (dir.includes('w')) {
        nextLeft -= (minWidth - nextWidth);
      }
      nextWidth = minWidth;
    }

    if (nextHeight < minHeight) {
      if (dir.includes('n')) {
        nextTop -= (minHeight - nextHeight);
      }
      nextHeight = minHeight;
    }

    const maxWidth = Math.max(minWidth, window.innerWidth - (margin * 2));
    const maxHeight = Math.max(minHeight, window.innerHeight - (margin * 2));
    nextWidth = Math.min(nextWidth, maxWidth);
    nextHeight = Math.min(nextHeight, maxHeight);

    nextLeft = Math.min(Math.max(nextLeft, margin), window.innerWidth - nextWidth - margin);
    nextTop = Math.min(Math.max(nextTop, margin), window.innerHeight - nextHeight - margin);

    panel.style.left = `${Math.round(nextLeft)}px`;
    panel.style.top = `${Math.round(nextTop)}px`;
    panel.style.width = `${Math.round(nextWidth)}px`;
    panel.style.height = `${Math.round(nextHeight)}px`;
    panel.style.right = 'auto';
  };

  const stopResize = () => {
    if (!resizeState) return;
    resizeState = null;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    saveAdminPanelSize(panel);
    saveAdminPanelPosition(panel);
    window.removeEventListener('mousemove', onResizeMove);
    window.removeEventListener('mouseup', stopResize);
  };

  handles.forEach((handle) => {
    handle.addEventListener('mousedown', (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();

      const rect = panel.getBoundingClientRect();
      panel.style.left = `${Math.round(rect.left)}px`;
      panel.style.top = `${Math.round(rect.top)}px`;
      panel.style.width = `${Math.round(rect.width)}px`;
      panel.style.height = `${Math.round(rect.height)}px`;
      panel.style.right = 'auto';

      resizeState = {
        dir: handle.getAttribute('data-resize-dir') || 'se',
        startX: event.clientX,
        startY: event.clientY,
        startLeft: rect.left,
        startTop: rect.top,
        startWidth: rect.width,
        startHeight: rect.height
      };

      document.body.style.userSelect = 'none';
      document.body.style.cursor = window.getComputedStyle(handle).cursor;
      window.addEventListener('mousemove', onResizeMove);
      window.addEventListener('mouseup', stopResize);
    });
  });
}

async function initializeWiggleAdminPanel() {
  const username = getCurrentWigdosUser();
  const normalizedUsername = normalizeWiggleUsername(username);
  const userDoc = await getWiggleUserDoc(normalizedUsername || username);
  const isTestAccount = WIGGLE_ADMIN_TEST_ACCOUNTS.includes(normalizedUsername);
  const isAdmin = !!(userDoc && userDoc.admin);

  const wiggleSearch = document.getElementById('wiggle-search');
  const isWiggleSearchPage = !!wiggleSearch;
  const isWigTubePlayerPage = window.location.pathname.includes('wigtube-player.html');
  if (!isWiggleSearchPage && !isWigTubePlayerPage) return;

  if (window.top !== window.self) {
    try {
      if (window.top.document.getElementById('wiggleAdminShell')) {
        return;
      }
    } catch (e) {
      // Ignore cross-origin or restricted frame access.
    }
  }

  if (isWiggleSearchPage && userDoc && userDoc.bannedFromWiggleSearch && !isAdmin && !isTestAccount) {
    window.wiggleSearchAccessDenied = true;
    wiggleSearch.innerHTML = `
      <div style="max-width: 600px; margin: 40px auto; padding: 16px; border: 2px solid #963737; background: #fff2f2; font-family: Tahoma, sans-serif;">
        <h2 style="margin: 0 0 8px; color: #7e1f1f;">Access Blocked</h2>
        <p style="margin: 0; font-size: 12px;">Your account is banned from WiggleSearch access. Contact an administrator if this is a mistake.</p>
      </div>
    `;
    return;
  }

  if (isWiggleSearchPage) {
    window.wiggleSearchAccessDenied = false;
  }

  if (!isAdmin && !isTestAccount) {
    return;
  }

  if (document.getElementById('wiggleAdminShell')) {
    return;
  }

  const shellHost = document.createElement('div');
  const panelTitle = isWigTubePlayerPage ? 'WigTube Player Admin Panel' : 'WiggleSearch Admin Panel';
  shellHost.innerHTML = createAdminPanelMarkup(username, panelTitle);
  while (shellHost.firstChild) {
    document.body.appendChild(shellHost.firstChild);
  }

  const shell = document.getElementById('wiggleAdminShell');
  const showBtn = document.getElementById('wiggleAdminShowBtn');
  const hideBtn = document.getElementById('wiggleAdminHideBtn');
  restoreAdminPanelPosition(shell);
  restoreAdminPanelSize(shell);
  clampAdminPanelToViewport(shell);
  makeAdminPanelDraggable(shell);
  makeAdminPanelResizable(shell);

  function setPanelHidden(hidden) {
    shell.style.display = hidden ? 'none' : 'block';
    if (showBtn) showBtn.style.display = hidden ? 'block' : 'none';
    try {
      localStorage.setItem(WIGGLE_ADMIN_PANEL_HIDDEN_KEY, hidden ? '1' : '0');
    } catch (e) {
      // Ignore storage failures
    }
  }

  if (hideBtn) {
    hideBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      saveAdminPanelPosition(shell);
      saveAdminPanelSize(shell);
      setPanelHidden(true);
    });
  }

  if (showBtn) {
    showBtn.addEventListener('click', () => {
      setPanelHidden(false);
      clampAdminPanelToViewport(shell);
    });
  }

  if (typeof ResizeObserver !== 'undefined') {
    const resizeObserver = new ResizeObserver(() => {
      clampAdminPanelToViewport(shell);
      saveAdminPanelSize(shell);
      saveAdminPanelPosition(shell);
    });
    resizeObserver.observe(shell);
  }

  const shouldStartHidden = localStorage.getItem(WIGGLE_ADMIN_PANEL_HIDDEN_KEY) === '1';
  setPanelHidden(shouldStartHidden);

  const expectedCode = ((userDoc && userDoc.adminConfirmCode) || (isTestAccount ? WIGGLE_ADMIN_DEFAULT_CODE : '') || '').trim();
  const gateStatus = document.getElementById('wiggleAdminGateStatus');
  const gateInput = document.getElementById('wiggleAdminCodeInput');
  const gateButton = document.getElementById('wiggleAdminUnlockBtn');
  const panel = document.getElementById('wiggleAdminPanel');
  const adminStatus = document.getElementById('wiggleAdminStatus');
  const userSuggestionList = document.getElementById('wiggleAdminUserSuggestions');
  const wigTubeSpecificResults = document.getElementById('wigTubeSpecificResults');
  const wigCordSpecificResults = document.getElementById('wigCordSpecificResults');
  const selectedCardByInput = {
    adminTargetUser: document.getElementById('adminSelectedUserCard'),
    wigtubeTargetUser: document.getElementById('wigtubeSelectedUserCard'),
    wigcordTargetUser: document.getElementById('wigcordSelectedUserCard')
  };

  if (!expectedCode) {
    gateStatus.textContent = 'No confirmation code is set for this account. Set users/<username>.adminConfirmCode in Firebase first.';
    gateButton.disabled = true;
    return;
  }

  const setStatus = (message, isError = false) => {
    adminStatus.style.color = isError ? '#8a1c1c' : '#173f21';
    adminStatus.style.background = isError ? '#fff1f1' : '#f2fff4';
    adminStatus.style.borderColor = isError ? '#e2bcbc' : '#b8d8be';
    adminStatus.textContent = message;
  };

  const getTarget = (id) => {
    const value = normalizeWiggleUsername(document.getElementById(id)?.value || '');
    if (!value) throw new Error('Enter a target username first.');
    return value;
  };

  const getCachedProfilePicture = (usernameValue) => {
    if (!usernameValue) return null;
    const exact = localStorage.getItem(`${WIGGLE_ADMIN_PFP_CACHE_PREFIX}${usernameValue}`);
    if (exact) return exact;
    const lower = localStorage.getItem(`${WIGGLE_ADMIN_PFP_CACHE_PREFIX}${normalizeWiggleUsername(usernameValue)}`);
    return lower || null;
  };

  const getProfilePictureForUser = async (usernameValue) => {
    const normalized = normalizeWiggleUsername(usernameValue);
    if (!normalized) return null;

    const cached = getCachedProfilePicture(normalized);
    if (cached) return cached;

    try {
      const user = await getWiggleUserDoc(normalized);
      if (user && user.profilePicture) {
        localStorage.setItem(`${WIGGLE_ADMIN_PFP_CACHE_PREFIX}${normalized}`, user.profilePicture);
        return user.profilePicture;
      }
    } catch (e) {
      // Profile pictures are non-blocking for moderation actions.
    }

    return null;
  };

  const renderSelectedUserCard = (cardElement, usernameValue, profilePicture) => {
    if (!cardElement || !usernameValue) return;

    const safeUsername = escapeHTML(usernameValue);
    const firstLetter = safeUsername.charAt(0).toUpperCase() || '?';
    const avatarMarkup = profilePicture
      ? `<img src="${escapeHTML(profilePicture)}" alt="${safeUsername} profile picture" style="width:28px;height:28px;border:1px solid #6f88ac;object-fit:cover;background:#fff;" />`
      : `<div style="width:28px;height:28px;border:1px solid #6f88ac;background:#cfe0f8;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;color:#214572;">${firstLetter}</div>`;

    cardElement.style.display = 'block';
    cardElement.innerHTML = `
      <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 8px;border:1px solid #9cb4d8;background:#edf4ff;color:#183a63;font-size:11px;">
        ${avatarMarkup}
        <div>
          <div style="font-weight:bold;line-height:1.2;">Selected user</div>
          <div style="line-height:1.2;">${safeUsername}</div>
        </div>
      </div>
    `;
  };

  const clearSelectedUserCard = (cardElement) => {
    if (!cardElement) return;
    cardElement.style.display = 'none';
    cardElement.innerHTML = '';
  };

  const refreshSelectedUserCard = async (inputId) => {
    const input = document.getElementById(inputId);
    const cardElement = selectedCardByInput[inputId];
    if (!input || !cardElement) return;

    const normalized = normalizeWiggleUsername(input.value);
    if (!normalized) {
      clearSelectedUserCard(cardElement);
      return;
    }

    const profilePicture = await getProfilePictureForUser(normalized);
    renderSelectedUserCard(cardElement, normalized, profilePicture);
  };

  const setSuggestions = (users) => {
    userSuggestionList.innerHTML = users
      .map((user) => `<option value="${user.replace(/"/g, '&quot;')}"></option>`)
      .join('');
  };

  const wireUserLookup = (inputId) => {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.setAttribute('list', 'wiggleAdminUserSuggestions');
    input.addEventListener('input', async () => {
      try {
        const users = await searchUsersByPrefix(input.value);
        setSuggestions(users);
      } catch (e) {
        // silent: suggestions are convenience-only
      }
    });
    input.addEventListener('change', () => {
      refreshSelectedUserCard(inputId);
    });
    input.addEventListener('blur', () => {
      refreshSelectedUserCard(inputId);
    });
  };

  const escapeHTML = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const renderWigTubeSpecific = (data) => {
    const { comments, videos } = data;
    if (!comments.length && !videos.length) {
      wigTubeSpecificResults.innerHTML = '<div style="color:#6b6b6b;">No matching WigTube items found.</div>';
      return;
    }

    const commentRows = comments.map((item) => `
      <div style="display:flex; gap:8px; align-items:center; margin-bottom:6px; border:1px solid #d7e5f8; padding:6px; background:#fff;">
        <div style="flex:1; min-width:0;">
          <div><strong>Comment</strong> by ${escapeHTML(item.author)} on ${escapeHTML(item.videoId)}</div>
          <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:#3d3d3d;">${escapeHTML(item.text || '(no text)')}</div>
        </div>
        <button data-action="delete-wt-comment" data-video-id="${escapeHTML(item.videoId)}" data-comment-id="${escapeHTML(item.commentId)}" style="padding:4px 8px;">Delete</button>
      </div>
    `).join('');

    const videoRows = videos.map((item) => `
      <div style="display:flex; gap:8px; align-items:center; margin-bottom:6px; border:1px solid #d7e5f8; padding:6px; background:#fff;">
        <div style="flex:1; min-width:0;">
          <div><strong>Video</strong> ${escapeHTML(item.title)}</div>
          <div style="color:#3d3d3d;">Uploader: ${escapeHTML(item.uploader)} | ID: ${escapeHTML(item.videoId)}</div>
        </div>
        <button data-action="delete-wt-video" data-video-id="${escapeHTML(item.videoId)}" style="padding:4px 8px;">Delete</button>
      </div>
    `).join('');

    wigTubeSpecificResults.innerHTML = `
      <div style="font-weight:bold; margin-bottom:6px;">Specific WigTube Matches</div>
      ${commentRows}
      ${videoRows}
    `;
  };

  const renderWigCordSpecific = (messages) => {
    if (!messages.length) {
      wigCordSpecificResults.innerHTML = '<div style="color:#6b6b6b;">No matching WigCord messages found.</div>';
      return;
    }

    wigCordSpecificResults.innerHTML = `
      <div style="font-weight:bold; margin-bottom:6px;">Specific WigCord Message Matches</div>
      ${messages.map((item) => `
        <div style="display:flex; gap:8px; align-items:center; margin-bottom:6px; border:1px solid #d7e5f8; padding:6px; background:#fff;">
          <div style="flex:1; min-width:0;">
            <div><strong>${escapeHTML(item.author)}</strong> in channel ${escapeHTML(item.channelId)}</div>
            <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:#3d3d3d;">${escapeHTML(item.content || '(empty message)')}</div>
          </div>
          <button data-action="delete-wc-message" data-channel-id="${escapeHTML(item.channelId)}" data-message-id="${escapeHTML(item.messageId)}" style="padding:4px 8px;">Delete</button>
        </div>
      `).join('')}
    `;
  };

  const doAction = async (action) => {
    try {
      setStatus('Processing...');
      await action();
    } catch (e) {
      setStatus(e.message || 'Action failed.', true);
    }
  };

  gateButton.addEventListener('click', () => {
    const inputCode = (gateInput.value || '').trim();
    if (!inputCode) {
      gateStatus.textContent = 'Please enter a confirmation code.';
      return;
    }
    if (inputCode !== expectedCode) {
      gateStatus.textContent = 'Invalid confirmation code.';
      return;
    }

    gateStatus.textContent = 'Code confirmed.';
    panel.style.display = 'block';
    document.getElementById('wiggleAdminGate').style.display = 'none';
  });

  document.getElementById('setAdminBtn').addEventListener('click', () => doAction(async () => {
    const target = getTarget('adminTargetUser');
    await updateWiggleUserDoc(target, { admin: true });
    setStatus(`Assigned admin role to ${target}.`);
  }));

  document.getElementById('removeAdminBtn').addEventListener('click', () => doAction(async () => {
    const target = getTarget('adminTargetUser');
    await updateWiggleUserDoc(target, { admin: false });
    setStatus(`Removed admin role from ${target}.`);
  }));

  document.getElementById('banSearchBtn').addEventListener('click', () => doAction(async () => {
    const target = getTarget('adminTargetUser');
    await updateWiggleUserDoc(target, { bannedFromWiggleSearch: true });
    setStatus(`Banned ${target} from WiggleSearch.`);
  }));

  document.getElementById('unbanSearchBtn').addEventListener('click', () => doAction(async () => {
    const target = getTarget('adminTargetUser');
    await updateWiggleUserDoc(target, { bannedFromWiggleSearch: false });
    setStatus(`Unbanned ${target} from WiggleSearch.`);
  }));

  document.getElementById('banCommentsBtn').addEventListener('click', () => doAction(async () => {
    const target = getTarget('wigtubeTargetUser');
    await updateWiggleUserDoc(target, { wigtubeCommentBanned: true });
    setStatus(`Banned ${target} from WigTube commenting.`);
  }));

  document.getElementById('unbanCommentsBtn').addEventListener('click', () => doAction(async () => {
    const target = getTarget('wigtubeTargetUser');
    await updateWiggleUserDoc(target, { wigtubeCommentBanned: false });
    setStatus(`Unbanned ${target} from WigTube commenting.`);
  }));

  document.getElementById('removeCommentsBtn').addEventListener('click', () => doAction(async () => {
    const target = getTarget('wigtubeTargetUser');
    const removed = await removeWigTubeCommentsByUser(target);
    setStatus(`Removed ${removed} WigTube comments/replies from ${target}.`);
  }));

  document.getElementById('deleteVideosBtn').addEventListener('click', () => doAction(async () => {
    const target = getTarget('wigtubeTargetUser');
    const removed = await deleteWigTubeVideosByUser(target);
    setStatus(`Deleted ${removed} WigTube videos from ${target}.`);
  }));

  document.getElementById('removeWigcordMessagesBtn').addEventListener('click', () => doAction(async () => {
    const target = getTarget('wigcordTargetUser');
    const removed = await removeWigCordMessagesByUser(target);
    setStatus(`Removed ${removed} WigCord messages from ${target}.`);
  }));

  document.getElementById('findWigTubeSpecificBtn').addEventListener('click', () => doAction(async () => {
    const target = getTarget('wigtubeTargetUser');
    const data = await findSpecificWigTubeItemsByPrefix(target);
    renderWigTubeSpecific(data);
    setStatus(`Loaded specific WigTube matches for prefix "${target}".`);
  }));

  document.getElementById('findWigCordSpecificBtn').addEventListener('click', () => doAction(async () => {
    const target = getTarget('wigcordTargetUser');
    const data = await findSpecificWigCordMessagesByPrefix(target);
    renderWigCordSpecific(data);
    setStatus(`Loaded specific WigCord matches for prefix "${target}".`);
  }));

  wigTubeSpecificResults.addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');

    doAction(async () => {
      if (action === 'delete-wt-comment') {
        const videoId = btn.getAttribute('data-video-id');
        const commentId = btn.getAttribute('data-comment-id');
        const deleted = await removeSpecificWigTubeComment(videoId, commentId);
        if (!deleted) throw new Error('Comment was already missing.');
        btn.closest('div[style*="display:flex"]')?.remove();
        setStatus(`Deleted specific comment ${commentId}.`);
      }

      if (action === 'delete-wt-video') {
        const videoId = btn.getAttribute('data-video-id');
        await removeSpecificWigTubeVideo(videoId);
        btn.closest('div[style*="display:flex"]')?.remove();
        setStatus(`Deleted specific video ${videoId}.`);
      }
    });
  });

  wigCordSpecificResults.addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    if (action !== 'delete-wc-message') return;

    doAction(async () => {
      const channelId = btn.getAttribute('data-channel-id');
      const messageId = btn.getAttribute('data-message-id');
      await removeSpecificWigCordMessage(channelId, messageId);
      btn.closest('div[style*="display:flex"]')?.remove();
      setStatus(`Deleted specific message ${messageId}.`);
    });
  });

  wireUserLookup('adminTargetUser');
  wireUserLookup('wigtubeTargetUser');
  wireUserLookup('wigcordTargetUser');

  refreshSelectedUserCard('adminTargetUser');
  refreshSelectedUserCard('wigtubeTargetUser');
  refreshSelectedUserCard('wigcordTargetUser');
}

function checkCode() {
  const input = document.getElementById("codeInput").value.trim().toLowerCase();
  const secret = secrets[input];
  const gif = document.getElementById("gif");
  const music = document.getElementById("music");
  const video = document.getElementById("bgVideo");
  const content = document.getElementById("content");

  if (secret) {
    // Hide input while secret is playing
    content.style.display = "none";

    // Set media sources
    video.src = secret.video;
    music.src = secret.audio;
    gif.src = secret.gif;

    // Show video and gif
    video.style.display = "block";
    gif.style.display = secret.gif ? "block" : "none";

    video.play();
    music.play();

    music.onended = () => {
      // Hide media when finished
      gif.style.display = "none";
      video.style.display = "none";
      video.pause();
      video.currentTime = 0;

      // Show input again
      content.style.display = "block";
    };
  } else {
    // XP-style error sound and dialog
    const errorsound = new Audio("assets/audio/system/error.mp3");
    errorsound.play().catch(() => {
      // Fallback if audio doesn't load
      console.log("Error sound failed to play");
    });
    
    // XP-style alert
    setTimeout(() => {
      alert("❌ Access Denied\n\nThe secret code you entered is invalid.\n\nPlease verify the code and try again.\n\nFor technical support, contact your system administrator.");
    }, 100);
  }
}

// Konami sequence logic (with buttons)
const konamiSequence = [
  "ArrowUp", "ArrowUp",
  "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight",
  "ArrowLeft", "ArrowRight"
];
let userInput = [];
let secretsActive = false;
const bInputs = document.getElementsByClassName("main-search-input");

function pressArrow(direction) {
  if (!secretsActive && document.activeElement !== bInputs[0] && document.activeElement !== bInputs[1]) {
    userInput.push(direction); 
    console.log(direction, userInput, konamiSequence);

    userInput.forEach((input, index) => {
      if (input != konamiSequence[index]) {
        userInput = [];
      }
    });
    userInput = userInput.slice(-konamiSequence.length);

    if (userInput.join() === konamiSequence.join()) {
      // Play XP startup sound
      const startupSound = new Audio("assets/audio/system/startup.mp3");
      startupSound.play().catch(() => {
        console.log("Startup sound failed to play");
      });
      
      // Reveal input box with XP-style notification
      setTimeout(() => {
        document.getElementById("content").style.display = "block";
        secretsActive = true;
      }, 200);
    }
  }
}

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp") pressArrow("ArrowUp");
  else if (event.key === "ArrowRight") pressArrow("ArrowRight");
  else if (event.key === "ArrowDown") pressArrow("ArrowDown");
  else if (event.key === "ArrowLeft") pressArrow("ArrowLeft");
});

// Page switching functionality
let tabCounter = 1; // Start counter after the initial 1 tab

function switchToPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page-content').forEach(page => {
    page.classList.remove('active');
  });
  
  // Show the requested page
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add('active');
  }
}

function createNewTabContent(tabId) {
  const newTabDiv = document.createElement('div');
  newTabDiv.id = tabId;
  newTabDiv.className = 'page-content';
  newTabDiv.innerHTML = `
    <div class="google-2003-page">
      <div class="google-2003-header">
        <div class="google-2003-topbar">
          <div class="google-2003-logo-text">WiggleSearch</div>
          <div class="google-2003-links">
            <a href="#" onclick="alert('Coming Soon!'); return false;">Advanced Search</a>
            <a href="#" onclick="alert('Coming Soon!'); return false;">Preferences</a>
            <a href="#" onclick="alert('Coming Soon!'); return false;">Language Tools</a>
            <a href="#" onclick="alert('Coming Soon!'); return false;">Search Tips</a>
          </div>
        </div>
        <div class="google-2003-search-area">
          <input type="text" class="google-2003-search-input" placeholder="">
          <button class="google-2003-search-btn">WiggleSearch</button>
        </div>
        <div class="google-2003-nav">
          <a href="#" class="google-2003-nav-link" onclick="alert('Coming Soon!'); return false;">Images</a>
          <a href="#" class="google-2003-nav-link" onclick="alert('Coming Soon!'); return false;">Groups</a>
          <a href="#" class="google-2003-nav-link" onclick="alert('Coming Soon!'); return false;">Directory</a>
          <a href="#" class="google-2003-nav-link" onclick="alert('Coming Soon!'); return false;">News</a>
        </div>
      </div>
      <div class="google-2003-results">
        <div class="google-2003-results-info">
          Searched the web for <b>COOL SITES</b>
        </div>
        <div class="google-2003-result">
          <div class="google-2003-result-header">
            <a href="#" class="google-2003-result-title" onclick="navigateToWigTube('${tabId}'); return false;">Wigtube</a>
            <span class="google-2003-sponsored">Sponsored Link</span>
          </div>
          <div class="google-2003-result-url">www.wigtube.com</div>
          <div class="google-2003-result-desc">WIGTUBEEEEEEEEEEEEEEEEEE</div>
        </div>
        <div class="google-2003-result">
          <div class="google-2003-result-header">
            <a href="#" class="google-2003-result-title" onclick="navigateToWiano('${tabId}'); return false;">Wiano - Free Online Piano</a>
            <span class="google-2003-sponsored">Sponsored Link</span>
          </div>
          <div class="google-2003-result-url">www.wiano.com</div>
          <div class="google-2003-result-desc">Play beautiful piano music right in your browser! Full keyboard support with sustain pedal. piano go weeeeeeee</div>
        </div>
        <div class="google-2003-result">
          <div class="google-2003-result-header">
            <a href="#" class="google-2003-result-title" onclick="navigateToWinesweeper('${tabId}'); return false;">Winesweeper </a>
          </div>
          <div class="google-2003-result-snippet">
             Minesweeper but wigdos touched it up a little, good luck whoever wishes to play this shitty game T_T
          </div>
          <div class="google-2003-result-meta">
            <span class="google-2003-result-url">www.Winesweeper.com/Winesweeper.html</span>
            <span class="google-2003-result-size">Vara is so going to kill me after this</span>
            <span class="google-2003-result-date">24/11/2003</span>
            <a href="#" onclick="alert('function soon'); return false;">Cached</a>
            <a href="#" onclick="alert('function goon'); return false;">Similar pages</a>
          </div>
        </div>
        <div class="google-2003-result">
          <div class="google-2003-result-header">
            <a href="#" class="google-2003-result-title" onclick="alert('ffs go goon'); return false;">placeholder</a>
          </div>
          <div class="google-2003-result-snippet">
           ...
          </div>
          <div class="google-2003-result-meta">
            <span class="google-2003-result-url">www.placeholder.com/placeholder/placeholder.html</span>
            <span class="google-2003-result-size">47k</span>
            <a href="#" onclick="alert('OI STOP IT'); return false;">Cached</a>
            <a href="#" onclick="alert('yeah yeah do it 30 times ig'); return false;">Similar pages</a>
          </div>
        </div>
      </div>
      <div class="google-2003-footer">
        <div class="google-2003-pagination">
          <span class="google-2003-logo-small">WiggleSearch</span>
          <div class="google-2003-pages">
            <span>Result Page:</span>
            <a href="#" onclick="alert('goon'); return false;">Previous</a>
            <span class="google-2003-page-current">1</span>
            <a href="#" class="google-2003-page-link" onclick="alert('I WILL TOUCH YOU'); return false;">2</a>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('appMain').appendChild(newTabDiv);
  return newTabDiv;
}

function loadPageInTab(tabId, pageType) {
  const tabContent = document.getElementById(tabId);
  if (!tabContent) return;
  
  // Update tab title
  const tabs = document.querySelectorAll('.tab');
  const activeTab = document.querySelector('.tab.active');
  if (activeTab) {
    const titleSpan = activeTab.querySelector('.title');
    const faviconImg = activeTab.querySelector('.favicon');
    // fuckass shitass iframes or sum shi
    switch(pageType) {
      case 'wiggle-search':
        titleSpan.textContent = 'Wiggle Search';
        faviconImg.src = 'assets/images/icons/32x/rBrowser.png';
        tabContent.innerHTML = `
          <div class="google-layout">
            <img src="../.././assets/images/icons/48x/rBrowser.png" draggable="false" class="logo">
            <div class="search-section">
              <div class="search-box-container">
                <input type="text" class="main-search-input" placeholder="Search...">
              </div>
              <div class="search-buttons">
                <button class="search-btn">Wiggle Search</button>
                <button class="search-btn">GAMBLING</button>
              </div>
            </div>
          </div>
        `;
        break;
      case 'wigtube':
        titleSpan.textContent = 'WigTube';
        faviconImg.src = 'assets/images/icons/48x/WigleTube.png';
        tabContent.innerHTML = `<iframe src="apps/browser/pages/wigtube.html" style="width: 100%; height: 100%; border: none;"></iframe>`;
        break;
    }
  }
  
  // Show this tab's content
  switchToPage(tabId);
}

function loadPageInTab(tabId, pageType) {
  const tabContent = document.getElementById(tabId);
  if (!tabContent) return;
  
  // Update tab title
  const tabs = document.querySelectorAll('.tab');
  const activeTab = document.querySelector('.tab.active');
  if (activeTab) {
    const titleSpan = activeTab.querySelector('.title');
    const faviconImg = activeTab.querySelector('.favicon');
    // fuckass shitass iframes or sum shi
    switch(pageType) {
      case 'wiggle-search':
        titleSpan.textContent = 'Wiggle Search';
        faviconImg.src = 'assets/images/icons/32x/rBrowser.png';
        tabContent.innerHTML = `
          <div class="google-layout">
            <img src="../.././assets/images/icons/48x/rBrowser.png" draggable="false" class="logo">
            <div class="search-section">
              <div class="search-box-container">
                <input type="text" class="main-search-input" placeholder="Search...">
              </div>
              <div class="search-buttons">
                <button class="search-btn">Wiggle Search</button>
                <button class="search-btn">GAMBLING</button>
              </div>
            </div>
          </div>
        `;
        break;
      case 'wigtube':
        titleSpan.textContent = 'WigTube';
        faviconImg.src = 'assets/images/icons/48x/WigleTube.png';
        tabContent.innerHTML = `<iframe src="apps/browser/pages/wigtube.html" style="width: 100%; height: 100%; border: none;"></iframe>`;
        break;
    }
  }
  
  // Show this tab's content
  switchToPage(tabId);
}

// beginning of the tab code
// Minimal behavior: toggle active tab, add/remove fake tabs (visual only)
(function() {
  const tabstrip = document.querySelector('.tabstrip');
  if (!tabstrip) return;
  const scroll = tabstrip.querySelector('.tabs-scroll');
  const addBtn = tabstrip.querySelector('.tab-action.add');

  function activate(tab) {
    const tabIndex = Array.from(scroll.children).indexOf(tab);
    
    // Update tab states
    tabstrip.querySelectorAll('.tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    
    // Switch to corresponding page
    const predefinedPages = ['wiggle-search'];
    let pageId;
    
    if (tabIndex < predefinedPages.length) {
      pageId = predefinedPages[tabIndex];
    } else {
      // For dynamically created tabs, use tab-X format
      pageId = `tab-${tabIndex + 1}`;
    }
    
    switchToPage(pageId);
  }

  tabstrip.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('.close');
    const tabEl = e.target.closest('.tab');
    
    if (closeBtn && tabEl) {
      const isActive = tabEl.classList.contains('active');
      const tabIndex = Array.from(scroll.children).indexOf(tabEl);
      
      // Remove corresponding page content for dynamic tabs
      if (tabIndex >= 1) { // Only for dynamically created tabs
        const pageId = `tab-${tabIndex + 1}`;
        const pageContent = document.getElementById(pageId);
        if (pageContent) {
          pageContent.remove();
        }
      }
      
      tabEl.remove();
      
      // Check if all tabs are closed - use a slight delay to ensure DOM has updated
      setTimeout(() => {
        const remainingTabs = scroll.querySelectorAll('.tab');
        console.log('Remaining tabs after close:', remainingTabs.length);
        
        if (remainingTabs.length === 0) {
          console.log('No tabs remaining, closing window...');
          // Close the WiggleSearch window by sending message to parent
          if (window.parent && window.parent !== window) {
            // We're in an iframe, send message to parent to close the window
            window.parent.postMessage({ action: 'closeWindow' }, '*');
          }
        } else if (isActive) {
          const next = scroll.querySelector('.tab');
          if (next) activate(next);
        }
      }, 0);
      
      return;
    }
    
    if (tabEl) {
      activate(tabEl);
    }
  });

  addBtn?.addEventListener('click', () => {
    tabCounter++;
    const newTabId = `tab-${tabCounter}`;
    
    const btn = document.createElement('button');
    btn.className = 'tab';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', 'false');
    btn.innerHTML = `
      <img class="favicon" src="assets/images/icons/32x/rBrowser.png" alt="" aria-hidden="true"/>
      <span class="title">New Tab</span>
      <span class="close" aria-hidden="true">✕</span>
    `;
    
    // Create corresponding page content
    createNewTabContent(newTabId);
    
    scroll.appendChild(btn);
    activate(btn);
    btn.scrollIntoView({ inline: 'end', behavior: 'smooth' });
  });
})();

// Searchable items for autocomplete
const searchableItems = [
  { name: "WigTube", url: "wigtube", keywords: ["wigtube", "video", "tube", "wig", "wt"] },
  { name: "Wiano", url: "wiano", keywords: ["wiano", "piano", "music"] },
  { name: "Winesweeper", url: "winesweeper", keywords: ["winesweeper", "minesweeper", "wine", "game"] },
  { name: "WigCord", url: "wigcord", keywords: ["wigcord", "discord", "chat", "server", "message", "cord"] },
];

// Create and manage autocomplete dropdown
function setupAutocomplete(input) {
  // Create a wrapper if the input doesn't have one
  let wrapper = input.parentElement;
  
  // For google-2003-search-input, we need to wrap it properly
  if (input.classList.contains('google-2003-search-input')) {
    // Check if already wrapped
    if (!wrapper.classList.contains('search-input-wrapper')) {
      const newWrapper = document.createElement('div');
      newWrapper.className = 'search-input-wrapper';
      newWrapper.style.cssText = 'position: relative; display: inline-block;';
      
      input.parentElement.insertBefore(newWrapper, input);
      newWrapper.appendChild(input);
      wrapper = newWrapper;
    }
  }
  
  let dropdown = wrapper.querySelector('.autocomplete-dropdown');
  
  // Create dropdown if it doesn't exist
  if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.className = 'autocomplete-dropdown';
    dropdown.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      width: 100%;
      background: white;
      border: 2px inset #ddd;
      border-top: 2px solid #0055aa;
      max-height: 180px;
      overflow-y: auto;
      display: none;
      z-index: 10000;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      margin-top: -2px;
      box-sizing: border-box;
    `;
    
    // Ensure parent has relative positioning
    if (window.getComputedStyle(wrapper).position === 'static') {
      wrapper.style.position = 'relative';
    }
    
    wrapper.appendChild(dropdown);
  }
  
  input.addEventListener('input', function() {
    const query = this.value.toLowerCase().trim();
    
    if (query.length === 0) {
      dropdown.style.display = 'none';
      dropdown.innerHTML = '';
      return;
    }
    
    const matches = searchableItems.filter(item => {
      return item.name.toLowerCase().includes(query) ||
             item.keywords.some(keyword => keyword.includes(query));
    });
    
    if (matches.length === 0) {
      dropdown.style.display = 'none';
      dropdown.innerHTML = '';
      return;
    }
    
    dropdown.innerHTML = '';
    dropdown.style.display = 'block';
    
    matches.forEach(match => {
      const item = document.createElement('div');
      item.style.cssText = `
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #e0e0e0;
        font-family: 'Tahoma', sans-serif;
        font-size: 12px;
      `;
      item.textContent = match.name;
      
      item.addEventListener('mouseenter', function() {
        this.style.background = '#0055aa';
        this.style.color = 'white';
      });
      
      item.addEventListener('mouseleave', function() {
        this.style.background = 'white';
        this.style.color = 'black';
      });
      
      item.addEventListener('click', function() {
        input.value = match.name;
        dropdown.style.display = 'none';
        
        // Trigger search
        const pageContent = input.closest('.page-content');
        if (pageContent) {
          handleWiggleSearch(match.name, pageContent.id);
        }
      });
      
      dropdown.appendChild(item);
    });
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
  
  // Handle arrow keys for navigation
  let selectedIndex = -1;
  
  input.addEventListener('keydown', function(e) {
    const items = dropdown.querySelectorAll('div');
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
      updateSelection(items, selectedIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
      updateSelection(items, selectedIndex);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      items[selectedIndex].click();
      selectedIndex = -1;
    }
  });
  
  function updateSelection(items, index) {
    items.forEach((item, i) => {
      if (i === index) {
        item.style.background = '#0055aa';
        item.style.color = 'white';
      } else {
        item.style.background = 'white';
        item.style.color = 'black';
      }
    });
  }
}

// Initialize autocomplete for all search inputs
document.addEventListener('DOMContentLoaded', function() {
  // Setup for main search input
  const mainSearchInputs = document.querySelectorAll('.main-search-input');
  mainSearchInputs.forEach(input => setupAutocomplete(input));
  
  // Setup for Google 2003 search inputs
  const google2003Inputs = document.querySelectorAll('.google-2003-search-input');
  google2003Inputs.forEach(input => setupAutocomplete(input));
});

// Observe for dynamically added search inputs
const observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    mutation.addedNodes.forEach(function(node) {
      if (node.nodeType === 1) { // Element node
        // Check for main search inputs
        const mainInputs = node.querySelectorAll ? node.querySelectorAll('.main-search-input') : [];
        mainInputs.forEach(input => setupAutocomplete(input));
        
        // Check for Google 2003 search inputs
        const googleInputs = node.querySelectorAll ? node.querySelectorAll('.google-2003-search-input') : [];
        googleInputs.forEach(input => setupAutocomplete(input));
        
        // Check if the node itself is a search input
        if (node.classList && (node.classList.contains('main-search-input') || node.classList.contains('google-2003-search-input'))) {
          setupAutocomplete(node);
        }
      }
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Handle Wiggle Search searches
document.addEventListener('click', (e) => {
  // Handle "Wiggle Search" button clicks
  if (e.target.classList.contains('search-btn') && e.target.textContent === 'Wiggle Search') {
    const pageContent = e.target.closest('.page-content');
    if (!pageContent) return;
    
    const input = pageContent.querySelector('.main-search-input');
    if (input && input.value.trim()) {
      handleWiggleSearch(input.value.trim(), pageContent.id);
    }
  }
});

// Handle Enter key in Wiggle Search inputs
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.classList.contains('main-search-input')) {
    const searchTerm = e.target.value.trim();
    const pageContent = e.target.closest('.page-content');
    
    if (searchTerm && pageContent) {
      handleWiggleSearch(searchTerm, pageContent.id);
    }
  }
});

function handleWiggleSearch(searchTerm, tabId) {
  const searchLower = searchTerm.toLowerCase();
  
  // Check searchable items
  const match = searchableItems.find(item => 
    item.name.toLowerCase() === searchLower ||
    item.keywords.includes(searchLower) ||
    item.url.toLowerCase() === searchLower
  );
  
  if (match) {
    if (match.url === 'wigtube') {
      navigateToWigTube(tabId);
    } else if (match.url === 'wiano') {
      navigateToWiano(tabId);
    } else if (match.url === 'winesweeper') {
      navigateToWinesweeper(tabId);
    } else if (match.url === 'wigcord') {
      navigateToWigCord(tabId);
    } else {
      alert(`Navigating to ${match.name}...`);
    }
  } else {
    // Perform regular search
    performSearch(searchTerm, tabId);
  }
}

function navigateToWigTube(tabId) {
  const tabContent = document.getElementById(tabId);
  if (!tabContent) return;
  
  // Find the tab index
  const allTabs = document.querySelectorAll('.tab');
  const predefinedPages = ['wiggle-search', 'new-tab'];
  let tabIndex = predefinedPages.indexOf(tabId);
  
  // If it's a dynamic tab, calculate its position
  if (tabIndex === -1) {
    tabIndex = parseInt(tabId.replace('tab-', '')) - 1;
  }
  
  const activeTab = allTabs[tabIndex];
  
  if (activeTab) {
    const titleSpan = activeTab.querySelector('.title');
    const faviconImg = activeTab.querySelector('.favicon');
    titleSpan.textContent = 'WigTube';
    faviconImg.src = 'assets/images/icons/48x/WigleTube.png';
  }
  
  // Load WigTube content
  tabContent.innerHTML = `<iframe src="apps/browser/pages/wigtube.html" style="width: 100%; height: 100%; border: none;"></iframe>`;
}

function navigateToWiano(tabId) {
  const tabContent = document.getElementById(tabId);
  if (!tabContent) return;
  
  // Find the tab index
  const allTabs = document.querySelectorAll('.tab');
  const predefinedPages = ['wiggle-search', 'new-tab'];
  let tabIndex = predefinedPages.indexOf(tabId);
  
  // If it's a dynamic tab, calculate its position
  if (tabIndex === -1) {
    tabIndex = parseInt(tabId.replace('tab-', '')) - 1;
  }
  
  const activeTab = allTabs[tabIndex];
  
  if (activeTab) {
    const titleSpan = activeTab.querySelector('.title');
    const faviconImg = activeTab.querySelector('.favicon');
    titleSpan.textContent = 'Wiano Piano';
    faviconImg.src = 'assets/images/icons/32x/wiano.png';
  }
  
  // Load Wiano content
  tabContent.innerHTML = `<iframe src="apps/wiano/wiano.html" style="width: 100%; height: 100%; border: none;"></iframe>`;
}

function navigateToWinesweeper(tabId) {
  const tabContent = document.getElementById(tabId);
  if (!tabContent) return;
  
  // Find the tab index
  const allTabs = document.querySelectorAll('.tab');
  const predefinedPages = ['wiggle-search', 'new-tab'];
  let tabIndex = predefinedPages.indexOf(tabId);
  
  // If it's a dynamic tab, calculate its position
  if (tabIndex === -1) {
    tabIndex = parseInt(tabId.replace('tab-', '')) - 1;
  }
  
  const activeTab = allTabs[tabIndex];
  
  if (activeTab) {
    const titleSpan = activeTab.querySelector('.title');
    const faviconImg = activeTab.querySelector('.favicon');
    titleSpan.textContent = 'Winesweeper';
    faviconImg.src = 'assets/images/icons/32x/winesweeper.png';
  }
  
  // Load Winesweeper content
  tabContent.innerHTML = `<iframe src="apps/games/winesweeper.html" style="width: 100%; height: 100%; border: none;"></iframe>`;
}

function loadWiggleSearchInTab(tabId) {
  // If it's the new-tab (second tab), just switch to the first tab (wiggle-search)
  if (tabId === 'new-tab') {
    const firstTab = document.querySelector('.tab');
    if (firstTab) {
      firstTab.click();
    }
    return;
  }
  
  // For dynamic tabs, load Wiggle Search content
  const tabContent = document.getElementById(tabId);
  if (!tabContent) return;
  
  // Find the tab index
  const allTabs = document.querySelectorAll('.tab');
  const predefinedPages = ['wiggle-search', 'new-tab'];
  let tabIndex = predefinedPages.indexOf(tabId);
  
  // If it's a dynamic tab, calculate its position
  if (tabIndex === -1) {
    tabIndex = parseInt(tabId.replace('tab-', '')) - 1;
  }
  
  const activeTab = allTabs[tabIndex];
  
  if (activeTab) {
    const titleSpan = activeTab.querySelector('.title');
    const faviconImg = activeTab.querySelector('.favicon');
    titleSpan.textContent = 'Wiggle Search';
    faviconImg.src = 'assets/images/icons/32x/rBrowser.png';
  }
  
  // Load Wiggle Search content
  if (window.wiggleSearchAccessDenied) {
    tabContent.innerHTML = `
      <div style="max-width: 600px; margin: 40px auto; padding: 16px; border: 2px solid #963737; background: #fff2f2; font-family: Tahoma, sans-serif;">
        <h2 style="margin: 0 0 8px; color: #7e1f1f;">Access Blocked</h2>
        <p style="margin: 0; font-size: 12px;">Your account is banned from WiggleSearch access.</p>
      </div>
    `;
    return;
  }

  tabContent.innerHTML = `
    <div class="google-layout">
      <img src="../.././assets/images/icons/48x/rBrowser.png" draggable="false" class="logo">
      <div class="search-section">
        <div class="search-box-container">
          <input type="text" class="main-search-input" placeholder="Search...">
        </div>
        <div class="search-buttons">
          <button class="search-btn">Wiggle Search</button>
          <button class="search-btn">GAMBLING</button>
        </div>
      </div>
    </div>
    <div id="content">
      <h2>Enter the Secret Code</h2>
      <input type="text" id="codeInput" placeholder="Enter code here" />
      <button onclick="checkCode()">Submit</button>
    </div>
  `;
}

function performSearch(searchTerm, tabId) {
  // This function can be expanded to handle actual search functionality
  console.log('Searching for:', searchTerm, 'in tab:', tabId);
  // For now, just show an alert or could navigate to a search results page
  alert(`Searching for: ${searchTerm}`);
}

// Address bar functionality
document.addEventListener('DOMContentLoaded', () => {
  const addressInput = document.getElementById('addressInput');
  const addressGoBtn = document.querySelector('.address-go-btn');
  
  function handleAddressBarNavigation() {
    const input = addressInput.value.trim().toLowerCase();
    
    if (!input) return;
    
    // Get current active tab
    const activeTab = document.querySelector('.tab.active');
    const tabs = document.querySelectorAll('.tab');
    const tabIndex = Array.from(tabs).indexOf(activeTab);
    
    // Determine the page ID
    const predefinedPages = ['wiggle-search', 'new-tab'];
    let pageId;
    
    if (tabIndex < predefinedPages.length) {
      pageId = predefinedPages[tabIndex];
    } else {
      pageId = `tab-${tabIndex + 1}`;
    }
    
    // Check searchable items
    const match = searchableItems.find(item => 
      item.name.toLowerCase() === input ||
      item.keywords.includes(input) ||
      item.url.toLowerCase() === input
    );
    
    if (match) {
      if (match.url === 'wigtube') {
        navigateToWigTube(pageId);
        addressInput.value = 'wigtube.com';
      } else if (match.url === 'wiano') {
        navigateToWiano(pageId);
        addressInput.value = 'wiano.com';
      } else if (match.url === 'winesweeper') {
        navigateToWinesweeper(pageId);
        addressInput.value = 'winesweeper.com';
      } else if (match.url === 'wigcord') {
        navigateToWigCord(pageId);
        addressInput.value = 'wigcord.com';
      } else {
        alert(`Navigating to ${match.name}...`);
      }
    } else {
      // For other searches or URLs
      alert(`Navigating to: ${input}`);
    }
  }
  
  // Handle Go button click
  if (addressGoBtn) {
    addressGoBtn.addEventListener('click', handleAddressBarNavigation);
  }
  
  // Handle Enter key in address bar
  if (addressInput) {
    addressInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleAddressBarNavigation();
      }
    });
  }
});

// Handle Google 2003 search button and input
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('google-2003-search-btn')) {
    const pageContent = e.target.closest('.page-content');
    if (!pageContent) return;
    
    const input = pageContent.querySelector('.google-2003-search-input');
    if (input && input.value.trim()) {
      handleGoogle2003Search(input.value.trim(), pageContent.id);
    }
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.classList.contains('google-2003-search-input')) {
    const searchTerm = e.target.value.trim();
    const pageContent = e.target.closest('.page-content');
    
    if (searchTerm && pageContent) {
      handleGoogle2003Search(searchTerm, pageContent.id);
    }
  }
});

function handleGoogle2003Search(searchTerm, tabId) {
  const searchLower = searchTerm.toLowerCase();
  
  // Check searchable items
  const match = searchableItems.find(item => 
    item.name.toLowerCase() === searchLower ||
    item.keywords.includes(searchLower) ||
    item.url.toLowerCase() === searchLower
  );
  
  if (match) {
    if (match.url === 'wigtube') {
      navigateToWigTube(tabId);
    } else if (match.url === 'wiano') {
      navigateToWiano(tabId);
    } else if (match.url === 'winesweeper') {
      navigateToWinesweeper(tabId);
    } else if (match.url === 'wigcord') {
      navigateToWigCord(tabId);
    } else {
      alert(`Navigating to ${match.name}...`);
    }
  } else {
    // Perform regular search
    alert(`Searching for: ${searchTerm}`);
  }
}

function navigateToWigCord(tabId) {
  const tabContent = document.getElementById(tabId);
  if (!tabContent) return;
  
  // Find the tab index
  const allTabs = document.querySelectorAll('.tab');
  const predefinedPages = ['wiggle-search', 'new-tab'];
  let tabIndex = predefinedPages.indexOf(tabId);
  
  if (tabIndex === -1) {
    tabIndex = parseInt(tabId.replace('tab-', '')) - 1;
  }
  
  const activeTab = allTabs[tabIndex];
  
  if (activeTab) {
    const titleSpan = activeTab.querySelector('.title');
    const faviconImg = activeTab.querySelector('.favicon');
    titleSpan.textContent = 'WigCord';
    faviconImg.src = 'assets/images/icons/32x/rBrowser.png';
  }
  
  // Load WigCord content
  tabContent.innerHTML = `<iframe src="apps/browser/pages/wigcord.html" style="width: 100%; height: 100%; border: none;" allow="autoplay; encrypted-media; fullscreen"></iframe>`;
}

document.addEventListener('DOMContentLoaded', () => {
  initializeWiggleAdminPanel().catch((error) => {
    console.error('[WiggleAdmin] Failed to initialize panel:', error);
  });
});