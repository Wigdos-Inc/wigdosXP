// Create the Grid Boxes and Store Them
let dkGridArray = [];
class DKGridBox {

    constructor(element) {
        this.element = element;
        this.filled  = false;
        this.select  = false;
        this.content = {
            img : undefined,
            text: undefined
        }
    }

    // Display Correct Information in Box
    display(img, text) {

        if (this.filled) {

            this.content.img = this.element.appendChild(document.createElement("img"));
            this.content.img.src = img;

            this.content.text = this.element.appendChild(document.createElement("p"));
            this.content.text.innerHTML = text;

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

    box.select = true;
    box.element.classList.add("activeBox");
}
function deselectAll() {

    // Deselect Previous(/all) Box(es)
    dkGridArray.forEach(r => r.forEach(b => {

        b.select = false;
        b.element.classList.remove("activeBox");
    }));
}

dkGridArray.forEach(row => row.forEach(box => {

    box.element.addEventListener("mousedown", () => {

        // Deselect Previous(/all) Box(es)
        deselectAll();

        // Select the Clicked Box
        if (box.filled) select(box);

        // Attach Selected Box to User
        userBox = box;
    });

    box.element.addEventListener("mouseup", () => {

        // Move an Entry to a different Box
        if (userBox !== undefined && userBox != box) {

            box.fill(userBox);

            deselectAll();
            select(box);

        }
    });
}));

document.addEventListener("mouseup", () => userBox = undefined);