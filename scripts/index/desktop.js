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
            this.content.img.src = `../../assets/images/desktop/${img}`;

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

            if (oldBox) oldBox.empty();

            this.filled = true;
            this.display("browser.png", "WiggleSearch");

        }
    }

    empty() {

        if (this.filled) {

            this.filled = false;
            this.display();

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

// Display Browser Icon for Testing
dkGridArray[0][0].fill();