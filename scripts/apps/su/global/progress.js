window.addEventListener("dataReady", () => {

    // Receive Data from Message
    window.addEventListener("message", (event) => {

        const messageData = {
            type: event.data.type,
            prog: event.data.prog,
            src : event.data.origin
        }

        taskProg(messageData.type, messageData.prog, messageData.src);
    })

    function taskProg(type, prog, target) {

        const tasks = window.suData.tasks;

        tasks.forEach((task, index) => {

            if (type == task.type && target == task.target) {

                // Add progress to Stored Progress
                task.progress += prog;

                if (task.progress > task.condition) {

                    // Complete the Task
                    window.suData.tasks[index].xp += task.reward;
                    window.suData.tasks[index] = undefined;

                }

            }
        });
    }

    function finish(task) {


    }
});