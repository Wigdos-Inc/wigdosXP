// Create the Grid Boxes and Store Them
let dkGridArray = [];
class DKGridBox {

    constructor(element) {
        this.element = element;
        this.filled  = false;
        this.select  = {
            active: false,
            count : 0,
            change: false,
            old   : undefined
        }
        this.content = {
            img : undefined,
            text: undefined
        }
    }

    // Display Correct Information in Box
    display(img, text) {

        if (this.filled) {

            if (img) {
                this.content.img = this.element.appendChild(document.createElement("img"));
                this.content.img.src = img;
            }

            if (text) {
                this.content.text = this.element.appendChild(document.createElement("p"));
                this.content.text.innerHTML = text;
            }

        }
        else {
            this.content.img.remove();
            this.content.text.remove();
        }
    }

    // Fill the Box
    fill(oldBox) {

        if (!this.filled) {

            this.filled = true;
            this.display(oldBox.content.img.src, oldBox.content.text.innerHTML);

            // Empty the Old Box
            if (oldBox.filled) {

                oldBox.filled = false;
                oldBox.display();

            }

        }
    }

    change(type) {

        console.log(this.select.count);

        if (type && !this.select.change && this.select.count > 1) {

            this.select.change = true;

            this.select.old = this.content.text.innerHTML;
            this.content.text.remove();

            let input = this.element.appendChild(document.createElement("input"));
            input.type = "text";
            input.id = "input";

        }
        else if (!type) {

            let input = document.getElementById("input");
            let value = (input.value == "") ? this.select.old : input.value;

            input.remove();
            this.select.change = false;
            this.select.old = undefined;

            this.display(undefined, value);

        }
    }
}

for (let r=0; r < 5; r++) {

    // Make/Empty RowArray
    let rowArray = [];

    for (let c=0; c < 9; c++) {

        // Create Grid Box
        let box = document.getElementsByTagName("main")[0].appendChild(document.createElement("div"));
        box.classList.add("dk-grid-box");
        box.id = `${r}-${c}`;

        // Push to Row
        rowArray.push(new DKGridBox(box));
    }

    // Push Complete Row to dkGridArray
    dkGridArray.push(rowArray);
}



// Attach Starter Icons
dkGridArray[0][0].filled = true;
dkGridArray[0][0].display("../../assets/images/desktop/browser.png", "WiggleSearch");



// Box x User Interaction
let userBox;

function select(box) {

    box.select.active = true;
    box.element.classList.add("activeBox");
    box.select.count++;
}
function deselectAll(unChange) {

    // Deselect Previous(/all) Box(es)
    dkGridArray.forEach(r => r.forEach(b => {

        b.select.active = false;
        b.element.classList.remove("activeBox");

        if (unChange && b.select.change) {
            b.change(false);
            b.select.count = 0;
        }
    }));
}

dkGridArray.forEach(row => row.forEach(box => {

    box.element.addEventListener("mousedown", () => {

        // Deselect Previous(/all) Box(es)
        deselectAll(false);

        // Select the Clicked Box
        if (box.filled) select(box);

        // Attach Selected Box to User
        userBox = box;
    });

    // Move an Entry to a different Box
    box.element.addEventListener("mouseup", (event) => {

        if (userBox !== undefined && userBox != box) {

            box.fill(userBox);

            deselectAll(true);
            select(box);

        }
    });


    // Allow Renaming and Activation
    box.element.addEventListener("click", (event) => {

        if (event.target.tagName !== "INPUT") box.change(true);
        console.log(event.target.tagName);
    });
}));

// Detach Box from User
document.addEventListener("mouseup", () => userBox = undefined);