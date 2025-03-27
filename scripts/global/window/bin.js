function bin(appContentBox) {

    appContentBox.classList.add("filesBox");

    // Store Box Content
    const itemInfo = {
        images: 
        [
            "../../assets/images/icons/32x/creature.png",
            "../../assets/images/icons/32x/files.png",
            "../../assets/images/icons/32x/files.png"
        ],

        text  :
        [
            "Let's Play A Game.exe",
            "Bomb Instructions",
            "Credits"
        ],

        action:
        [
            () => creature(),
            () => console.log("click"),
            () => console.log("click")
        ]
    }


    let filesItems = [];
    let prevItem;
    for (let i=0; i < 3; i++) {

        const filesItem = appContentBox.appendChild(document.createElement("div"));
        filesItem.classList.add("filesItem");

        // Create and Assign Content to Box
        let item = {
            parent: filesItem,
            image : filesItem.appendChild(document.createElement("img")),
            text  : filesItem.appendChild(document.createElement("p")),
            action: itemInfo.action[i],
            index : i,

            select: {
                count : 0,
                change: false,
                old   : undefined
            },

            change: function(type) {

                if (type && !this.select.change && this.select.count > 1) {

                    this.select.change = true;

                    // Store Previous Name
                    this.select.old = this.text.innerHTML;
                    this.text.remove();

                    // Create Input Field for Renaming
                    this.text = filesItem.appendChild(document.createElement("input"));
                    this.text.type = "text";
                    this.text.class = "appInput";
                    this.text.value = this.select.old;

                    // Renaming Finalizes when Pressing Enter
                    this.text.addEventListener("keydown", (event) => {

                        if (event.key === "Enter") this.change(false);
                    });

                }
                else if (!type && this.select.change) {

                    let value = (this.text.value == "") ? this.select.old : this.text.value;

                    this.text.remove();
                    this.select.change = false;
                    this.select.old = undefined;
                    this.select.count = 0;

                    this.text = filesItem.appendChild(document.createElement("p"));
                    this.text.innerHTML = value;

                }
            }
        }
        item.image.src = itemInfo.images[i];
        item.text.innerHTML = itemInfo.text[i];

        
        // Renaming and Activation Detection
        let prevClick = {};
        filesItem.addEventListener("click", (event) => {

            if (prevItem && !prevItem.parent.contains(event.target)) {
                prevItem.select.count = 0;
                prevItem.parent.classList.remove("filesItemSelected");
            }
            
            filesItem.classList.add("filesItemSelected");
            prevItem = item;

            // Renaming
            item.select.count++;
            if (event.target.tagName == "P") item.change(true);

            // Activation
            const cTime = Date.now();
            const pTime = prevClick[i];

            if (pTime && (cTime - pTime) < 500 && event.target !== item.text) item.action();

            prevClick[i] = cTime;
        });

        document.addEventListener("mousedown", (event) => {

            if (event.target !== item.text) item.change(false);
            if (prevItem && event.target !== prevItem.parent) prevItem.parent.classList.remove("filesItemSelected"); 
        });

        document.addEventListener("keydown", (event) => {

            if (event.key === "Enter") item.change(false);
        });

        filesItems.push(item);
    }

    return appContentBox;
}