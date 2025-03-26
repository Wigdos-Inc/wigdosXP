window.onload = () => {

    if (!sessionStorage.getItem("loaded") && !document.title.includes("Desktop")) index();
}