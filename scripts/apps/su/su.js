// Navigation
const urls = ["user", "leaderboard", "shop"];
urls.forEach((url, index) => document.getElementsByClassName("option")[index].onclick = () => navigate("0, -100vh", `apps/su/${url}.html`));