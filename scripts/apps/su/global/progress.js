// Receive Data from Message
window.addEventListener("message", (event) => {

    if (event.data.type == "save" && event.ports && event.ports[0]) {
        suDB("store", window.suData);
        event.ports[0].postMessage({ status: "success" });
    }
    else if (event.data.taskData) {
        const data = JSON.parse(event.data.taskData);
        taskProg(data.taskType, data.prog, data.src);
    }
});

function taskProg(type, prog, target, override) {

    const overVar = override;

    window.suData.tasks.all.forEach((task, index) => {

        if (type == task.type && target == task.target && task.active) {

            // Add progress to Stored Progress
            task.progress += prog;

            if (task.progress >= task.condition) {

                // Add XP & Gold
                window.suData.xp += task.reward.xp;
                window.suData.gold += task.reward.gold; 

                // (Store) Mini Reward
                if (typeof elements !== "undefined") glow(elements.stats.gold);
                else sessionStorage.setItem("goldUp", true);
                console.log("Task Complete: " + task.reward.xp + "XP", `${getUser()}: ${window.suData.xp}/100 XP`, task.reward.gold + " G");

                // Complete/Reset the Task
                if (!task.repeat) window.suData.tasks.all.splice(index, 1);
                else task.progress = 0;

                // Store to DB & Display if no Levelup
                if (window.suData.xp < 100 && !overVar) {
                    suDB("store", window.suData);
                }

            }

        }
    });

    // Handle Level Up
    while (window.suData.xp >= 100) {

        console.log("Levelup!");

        window.suData.xp -= 100;
        window.suData.level++;

        if (window.suData.xp < 100) {

            // (Store) Mini Reward
            if (typeof elements !== "undefined") glow(elements.stats.lvl);
            else sessionStorage.setItem("lvlUp", true);

            // Store to DB
            if (!overVar) suDB("store", window.suData);

        }
        
    }
    
    window.dispatchEvent(new Event("dataUpdate"));
    localStorage.setItem("suData", JSON.stringify(window.suData));
}




function glow(element) {

    element.style.transition = "all 0.5s";
    element.style.color = "gold";
    element.style.textShadow = "0 0 10px white";

    setTimeout(() => {

        element.style.color = "whitesmoke";
        element.style.textShadow = "none";

        element.addEventListener("transitionend", () => element.style.transition = "none");
    }, 1000);
}