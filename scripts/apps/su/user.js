const xpBar = document.getElementById("xpBar");

for (let i=0; i < 20; i++) {

    const bar = xpBar.appendChild(document.createElement("div"));
    bar.classList.add("xpBlock");
}