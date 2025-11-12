// Receive Data from Message (named handler with basic validation)
function handleProgressMessage(event) {
    if (!event || !event.data) return;

    // Basic origin check (allow same-origin or messages from iframes without strict origin)
    try {
        if (event.origin && event.origin !== window.location.origin) {
            // If you have a known set of allowed origins, check against them here.
            // For now, ignore cross-origin messages that don't contain expected structure.
            if (!event.data.type && !event.data.taskData) return;
        }
    } catch (err) {
        // Ignore origin check failures
    }

    if (event.data.type === "save" && event.ports && event.ports[0]) {
        suDB("store", window.suData);
        event.ports[0].postMessage({ status: "success" });
    } else if (event.data.taskData) {
        try {
            const data = JSON.parse(event.data.taskData);
            taskProg(data.taskType, data.prog, data.src);
        } catch (err) {
            console.warn('Invalid taskData in progress message', err);
        }
    }
}

window.addEventListener('message', handleProgressMessage);

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
                else localStorage.setItem("goldUp", true);
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
            else localStorage.setItem("lvlUp", true);

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