// Navigation
const urls = ["user", "leaderboard", "shop"];
urls.forEach((url, index) => document.getElementsByClassName("option")[index].onclick = () => location.href = `apps/su/${url}.html`);