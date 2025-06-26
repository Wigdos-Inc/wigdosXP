// Receive Data from Message
window.addEventListener("message", (event) => {

    const data = JSON.parse(event.data.taskData);

    console.log(data.taskType, data.prog, data.src);
    taskProg(data.taskType, data.prog, data.src);
})

function taskProg(type, prog, target) {

    console.log(window.suData.xp, window.suData.gold);

    window.suData.tasks.all.forEach(task => {

        if (type == task.type && target == task.target && task.active) {

            // Add progress to Stored Progress
            task.progress += prog;

            if (task.progress >= task.condition) {

                // Add XP & Gold
                window.suData.xp += task.reward.xp;
                window.suData.gold += task.reward.gold;
                console.log("Task Complete: " + task.reward.xp + "XP", `${getUser()}: ${window.suData.xp}/100 XP`);
                console.log(task.reward.gold + " G");

                // Complete/Reset the Task
                if (!task.repeat) task = undefined;
                else task.progress = 0;

                // Store to DB & Display if no Levelup
                if (window.suData.xp < 100) {
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

            const lvlText = elements.stats.lvl;

            lvlText.style.transition = "all 0.5s";
            lvlText.style.color = "gold";
            lvlText.style.textShadow = "0 0 5px white";

            setTimeout(() => {

                lvlText.style.color = "whitesmoke";
                lvlText.style.textShadow = "none";

                lvlText.addEventListener("transitionend", () => lvlText.style.transition = "none");
            }, 3000);

            // Store to DB
            suDB("store", window.suData);

        }
        
    }
    
    window.dispatchEvent(new Event("dataUpdate"));
}