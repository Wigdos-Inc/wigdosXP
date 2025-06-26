async function loadLeaderboard() {
    // Access Firebase API when called
    const { db, collection, getDocs } = window.firebaseAPI;
    const colRef = collection(db, "game_saves");
    try {
        const snapshot = await getDocs(colRef);
        const table = document.getElementById("leaderboard");
        // Remove old rows except header
        table.querySelectorAll("tr:not(#userStats)").forEach(r => r.remove());

        // Build entries array
        const entries = [];
        snapshot.forEach(doc => {
            const suString = doc.data().su;
            if (!suString) return;
            let data;
            try { data = JSON.parse(suString); }
            catch { return; }
            entries.push({ username: doc.id, data });
        });

        // Sort entries based on current sortConfig
        if (sortConfig.key) {
            entries.sort((a, b) => {
                let aval, bval;
                switch (sortConfig.key) {
                    case 'username':
                        aval = a.username.toLowerCase();
                        bval = b.username.toLowerCase();
                        return sortConfig.asc ? aval.localeCompare(bval) : bval.localeCompare(aval);
                    case 'time':
                        aval = a.data.time || 0;
                        bval = b.data.time || 0;
                        break;
                    case 'tasksCompleted':
                        aval = Array.isArray(a.data.tasks?.all) ? a.data.tasks.all.filter(t => t.progress >= t.condition).length : 0;
                        bval = Array.isArray(b.data.tasks?.all) ? b.data.tasks.all.filter(t => t.progress >= t.condition).length : 0;
                        break;
                    default:
                        aval = a.data[sortConfig.key] || 0;
                        bval = b.data[sortConfig.key] || 0;
                }
                return sortConfig.asc ? aval - bval : bval - aval;
            });
        }

        // Render rows
        entries.forEach(({ username, data }, idx) => {
            const row = table.insertRow();
            // Insert place number
            row.insertCell().textContent = idx + 1;
            // Level, xp, gold, runtime, tasksCompleted calculation
            const level = data.level || "";
            const xp = data.xp ?? "";
            const gold = data.gold ?? "";
            const runtime = timeFormat(data.time || 0);
            const tasksCompleted = Array.isArray(data.tasks?.all)
                ? data.tasks.all.filter(t => t.progress >= t.condition).length
                : 0;
            row.insertCell().textContent = username.toUpperCase();
            row.insertCell().textContent = level;
            row.insertCell().textContent = xp;
            row.insertCell().textContent = gold;
            const timeCell = row.insertCell();
            row.insertCell().textContent = tasksCompleted;

            timeCell.textContent = runtime;
            if (username == getUser()) window.addEventListener("timerUpdate", () => timeCell.textContent = timeFormat(window.suData.time));
        });
    } catch (err) {
        console.error("Error loading leaderboard:", err);
    }
}

// Global sort configuration
const sortConfig = { key: 'level', asc: false };

// Attach header click listeners once DOM is ready
function setupSorting() {
    const table = document.getElementById('leaderboard');
    // First column '#' is non-sortable
    const keys = [null, 'username', 'level', 'xp', 'gold', 'time', 'tasksCompleted'];
    table.querySelectorAll('tr#userStats th').forEach((th, i) => {
        const key = keys[i];
        if (!key) return;
        th.style.cursor = 'pointer';
        th.addEventListener('click', () => {
            if (sortConfig.key === key) {
                sortConfig.asc = !sortConfig.asc;
            } else {
                sortConfig.key = key;
                // default descending for numeric fields, ascending for username
                sortConfig.asc = (key === 'username');
            }
            loadLeaderboard();
        });
    });
}

// Initialize on DB ready
window.addEventListener('dbReady', () => {
    setupSorting();
    loadLeaderboard();
});