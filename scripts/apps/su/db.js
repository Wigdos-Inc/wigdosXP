try {
    
}
catch {
    playerrorSound();
    console.error("DB Connection Failed");

    document.body.style.pointerEvents = "none";
    window.alert("Error: Singular Upgrading is not available at this time. <br/> Please try again later.");
}



async function store() {}