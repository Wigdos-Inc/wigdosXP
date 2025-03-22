/* Time Stuff */

const timeBox = document.getElementById("tbTimeBox");
const baseClock = setInterval(() => update("tbClock"), 1000);

function update(type) {

    // Store the Current Time
    const cDate = new Date;
    const cTime = {
        hours  : (cDate.getHours() < 10 ? "0" : "") + cDate.getHours(),
        minutes: (cDate.getMinutes() < 10 ? "0" : "") + cDate.getMinutes()
    }

    // Display the Current Time
    if (type == "tbClock") timeBox.innerHTML = `${cTime.hours}:${cTime.minutes}`;
}
update("tbClock");


timeBox.addEventListener("click", () => {

    // Expanded Time Stuff
});