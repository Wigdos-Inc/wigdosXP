// Load Application Window
application("c4");
document.getElementsByClassName("appMainBottomBar")[0].remove();
document.getElementsByClassName("appMainTopBar")[0].remove();



/* Variables */

let cQuestion;

// HTML Elements
const element = {
    main  : document.getElementById("content"),

    bomb  : {
        numberBox: document.getElementById("numberBox"),
        numbers  : document.getElementsByClassName("digits"),

        buttonBox: document.getElementById("buttonBox"),
        buttons  : document.getElementsByClassName("buttons"),

        ini      : function() {

            // Register Button Presses
            for (let i=0; i < this.buttons.length; i++) this.buttons[i].addEventListener("click", () => this.insert(i+1));
        },

        insert   : function(digit) {

            // Digit Correction
            if (digit == 11) digit = 0;
            else if (digit == 12) digit = 11;

            // Digit Handling
            if (digit < 10) {

                // Insert Digit
                this.numbers[quiz.index].innerHTML = digit;

            }
            else if (digit == 10) {

                // Return to Previous Question
                quiz.index = (quiz.index == 0 ? 14 : quiz.index - 1);
                quiz.display();

            }
            else if (digit == 11) {

                // Continue to Next Question
                quiz.index = (quiz.index == 14 ? 0 : quiz.index + 1);
                quiz.display();

            }
            
        }
    },

    sticky: {
        pBox : document.getElementById("stickyBox"),
        qBox : document.getElementById("stickyQbox"),
        aBox : {
            element: document.getElementById("stickyAbox"),
            multi  : {
                element: document.getElementById("multiAnswerBox"),
                labels : document.getElementsByTagName("label"),
                input  : document.getElementsByClassName("answers")
            },
            open   : document.getElementById("openAnswerBox"),
            output : document.getElementById("digitOutput")
        },
        nBox : document.getElementById("stickyNbox"),
        qnr  : document.getElementById("qnr"),

        notes:
        [
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            ""
        ]
    }
}

// Quiz Info
const quiz = {
    index   : 0,

    code    : "",

    question: 
    [
        "is a fish a soup?",
        "is a fish a soup?",
        "is a fish a soup?",
        "is a fish a soup?",
        "is a fish a soup?",
        "is a fish a soup?",
        "is a fish a soup?",
        "is a fish a soup?",
        "is a fish a soup?",
        "is a fish a soup?",
        "is a fish a soup?",
        "is a fish a soup?",
        "is a fish a soup?",
        "is a fish a soup?",
        "is a fish a soup?"
    ],

    answers: {
        multi:  {
            option: [
                ["no", "no", "yes", "no"],
                ["no", "yes", "no", "no"],
                ["no", "yes", "no", "no"],
                ["yes","no", "no",  "no"],
                ["no", "no", "yes", "no"],
                ["no", "no", "yes", "no"],
                ["no", "yes", "no", "no"],
                ["no", "no", "no", "yes"],
                ["no", "no", "yes", "no"],
                ["no", "no", "no", "yes"]
            ],
            correct: [2, 1, 1, 0, 2, 1, 3, 2, 3],
            output :
            [
                [0,0,0,0],
                [0,0,0,0],
                [0,0,0,0],
                [0,0,0,0],
                [0,0,0,0],
                [0,0,0,0],
                [0,0,0,0],
                [0,0,0,0],
                [0,0,0,0],
                [0,0,0,0]
            ],
            input  : [null, null, null, null, null, null, null, null, null, null]
        },
        open :
        [
            "incorrect",
            "incorrect",
            "incorrect",
            "incorrect",
            "incorrect"
        ]
    },

    ini    : function() {

        // Generate a Correct Defusal Code
        for (let i=0; i < 15; i++) {

            // Create Correct Code
            const digit = Math.floor(Math.random() * 10);
            this.code += digit;
            
            if (i < 10) {

                for (let i2=0; i2 < 4; i2++) {

                    // Insert Wrong Digits
                    this.answers.multi.output[i][i2] = Math.floor(Math.random() * 10);
                }

                // Insert Single Correct Digit per Question
                this.answers.multi.output[i][this.answers.multi.correct[i]] = digit;

            }
        }

        console.log(this.code);


        // Multi-Choice Question Answer Recognition
        for (let i=0; i < 4; i++) {

            element.sticky.aBox.multi.input[i].addEventListener("click", () => {

                // Display Output if Checked
                if (element.sticky.aBox.multi.input[i].checked) element.sticky.aBox.output.innerHTML = `Digit: ${this.answers.multi.output[this.index][i]}`;

                // Make sure only one can be checked at a time
                for (let i2 = 0; i2 < 4; i2++) {

                    element.sticky.aBox.multi.input[i2].checked = false;
                }

                element.sticky.aBox.multi.input[i].checked = true;

                // Store User Input
                this.answers.multi.input[this.index] = i;
            });
        }


        // Prepare Open Answer Typing Recognition
        element.sticky.aBox.open.addEventListener("keydown", () => undefined)
    },
        
    display: function() {

        // Highlight Active Digit Box
        for (let i=0; i < element.bomb.numbers.length; i++) element.bomb.numbers[i].classList.remove("highlight");
        element.bomb.numbers[this.index].classList.add("highlight");

        element.sticky.qnr.innerHTML = this.index+1;
        element.sticky.qBox.innerHTML = `<strong>${this.question[this.index]}</strong>`;

        if (this.index < 10) {

            element.sticky.aBox.open.style.display = "none";
            element.sticky.aBox.multi.element.style.display = "unset";

            // Display Multiple Choice Answers
            for (let i=0; i < 4; i++) {

                // Uncheck Boxes
                element.sticky.aBox.multi.input[i].checked = false;

                // Display Answers
                element.sticky.aBox.multi.labels[i].innerHTML = this.answers.multi.option[this.index][i] + this.answers.multi.output[this.index][i];
            }

            // Check previously Checked Box
            if (this.answers.multi.input[this.index]) element.sticky.aBox.multi.input[null]

        }
        else {

            element.sticky.aBox.multi.element.style.display = "none";
            element.sticky.aBox.open.style.display = "unset";


            // Empty the textarea
            element.sticky.aBox.open.innerHTML = "";

        }
    }
}



element.bomb.ini();
quiz.ini();
quiz.display();