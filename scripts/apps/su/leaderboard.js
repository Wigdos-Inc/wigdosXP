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

        // Sort by level descending
        entries.sort((a, b) => (b.data.level || 0) - (a.data.level || 0));

        // Render rows
        entries.forEach(({ username, data }) => {
            const row = table.insertRow();
            // Level, xp, gold, runtime, tasksCompleted calculation
            const level = data.level || "";
            const xp = data.xp ?? "";
            const gold = data.gold ?? "";
            const runtime = timer(data.time || 0);
            const tasksCompleted = Array.isArray(data.tasks?.all)
                ? data.tasks.all.filter(t => t.progress >= t.condition).length
                : 0;
            row.insertCell().textContent = username;
            row.insertCell().textContent = level;
            row.insertCell().textContent = xp;
            row.insertCell().textContent = gold;
            row.insertCell().textContent = runtime;
            row.insertCell().textContent = tasksCompleted;
        });
    } catch (err) {
        console.error("Error loading leaderboard:", err);
    }
}
function timer(data) {

    let rawr = data;
    sessionStorage.setItem("timer", "data");
    let h = Math.floor(rawr / 3600);
    let m = Math.floor((rawr % 3600) / 60);
    let s = rawr % 60;
    if (h < 10) h = `0${h}`;
    if (m < 10) m = `0${m}`;
    if (s < 10) s = `0${s}`;
    return `${h}:${m}:${s}`;
}

window.addEventListener("dbReady", () => {
    loadLeaderboard();
    setInterval(loadLeaderboard, 1000);
});