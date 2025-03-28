// Load Application Window
application("c4");
document.getElementsByClassName("appMainBottomBar")[0].remove();
document.getElementsByClassName("appMainTopBar")[0].remove();



/* Variables */

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

            // Store User Code
            for (let i=0; i < 15; i++) {
    
                if (this.numbers[i].innerHTML) quiz.uCode[i] ? quiz.uCode[i] = this.numbers[i].innerHTML : quiz.uCode += this.numbers[i].innerHTML;
            }

            // Digit Correction
            if (digit == 11) digit = 0;
            else if (digit == 12) digit = 11;

            // Digit Handling
            if (digit < 10) {

                // Insert Digit
                this.numbers[quiz.index].innerHTML = digit;

            }
            else if (digit == 10) {

                // Remove Timer
                clearTimeout(quiz.timer);

                // Return to Previous Question (or show Results)
                if (quiz.completionCheck()) quiz.index = (quiz.index == 0 ? 15 : quiz.index - 1);
                else quiz.index = (quiz.index == 0 ? 14 : quiz.index - 1);
                quiz.display();

            }
            else if (digit == 11) {

                // Remove Timer
                clearTimeout(quiz.timer);

                // Continue to Next Question (or show Results)
                if (quiz.completionCheck()) quiz.index = (quiz.index == 14 ? 15 : quiz.index + 1)
                else quiz.index = (quiz.index == 14 ? 0 : quiz.index + 1);
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

        yestes:
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
    },

    results: function() {

        let correct = 0;

        for (let i=0; i < quiz.code.length; i++) {

            if (quiz.uCode[i] == quiz.code[i]) correct++;
        }

        // Lock Answer Boxes
        for (let i = 0; i < 4; i++) {

            if (!quiz.finished) element.sticky.aBox.multi.input[i].checked = false;
        }

        // Remove Answer Boxes
        element.sticky.aBox.multi.element.style.display = "none";
        element.sticky.aBox.open.style.display = "none";
        element.sticky.aBox.output.style.display = "none";

        // Display Result
        element.sticky.qBox.innerHTML = "You finished!";
        element.sticky.aBox.element.innerHTML = 
        `
            Results: <br/><br/>

            Defusal Code: ${quiz.code} <br/>
            Your Code: ${quiz.uCode} <br/><br/>

            Correct: ${correct}/${quiz.code.length}
        `;
    }
}

// Quiz Info
const quiz = {
    finished: false,
    index   : 0,
    timer   : null,

    code    : "",
    uCode   : "",

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
                ["yes", "yes", "no", "yes"],
                ["yes", "no", "yes", "yes"],
                ["yes", "no", "yes", "yes"],
                ["no","yes", "yes",  "yes"],
                ["yes", "yes", "no", "yes"],
                ["yes", "no", "yes", "yes"],
                ["yes", "yes", "yes", "no"],
                ["yes", "yes", "no", "yes"],
                ["yes", "yes", "yes", "no"],
                ["no", "yes", "yes", "yes"]
            ],
            correct: [2, 1, 1, 0, 2, 1, 3, 2, 3, 0],
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
        open : {
            correct:
            [
                "incorrect",
                "incorrect",
                "incorrect",
                "incorrect",
                "incorrect"
            ],
            input  : [null, null, null, null, null],
            output : [null, null, null, null, null],
            pOutput: [null, null, null, null, null]
        }
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
            else {

                this.answers.open.output[i-10] = digit;

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

                    if (!quiz.finished) element.sticky.aBox.multi.input[i2].checked = false;
                }

                element.sticky.aBox.multi.input[i].checked = true;

                // Store User Input
                this.answers.multi.input[this.index] = i;
            });
        }


        // Open Answer Typing Recognition
        element.sticky.aBox.open.addEventListener("keydown", () => {

            // Remove Previous Timer
            clearTimeout(this.timer);

            // Start Timer for Validation
            this.timer = setTimeout(() => {

                // Store Input & Answer without Spaces
                const input = element.sticky.aBox.open.value.replaceAll(" ", "");
                const cAnswer = this.answers.open.correct[this.index-10].replaceAll(" ", "");
                let correct = {
                    full : cAnswer.length,
                    total: 0,

                    calc : function() {

                        return Math.round(this.total / this.full * 100);
                    }
                };

                console.log(input);

                if (input != "") {

                    // Validate Answer
                    for (let i=0; i < input.length; i++) {

                        if (cAnswer[i] && input[i] == cAnswer[i]) correct.total++;
                    }

                    // Store & Display Digit
                    console.log(correct.calc());
                    const digit = `Digit: ${correct.calc() >= 80 ? this.answers.open.output[this.index-10] : Math.floor(Math.random() * 10)}`;
                    element.sticky.aBox.output.innerHTML = digit;

                    // Store User Answer & Received Digit
                    this.answers.open.input[this.index-10] = element.sticky.aBox.open.value;
                    this.answers.open.pOutput[this.index-10] = digit;

                }
            }, 1000);
        });
    },
        
    display: function() {

        // If the Quiz isn't finished yet
        if (this.index < 15) {

            // Highlight Active Digit Box
            for (let i=0; i < element.bomb.numbers.length; i++) element.bomb.numbers[i].classList.remove("highlight");
            element.bomb.numbers[this.index].classList.add("highlight");

            element.sticky.qnr.innerHTML = this.index+1;
            element.sticky.qBox.innerHTML = `<strong>${this.question[this.index]}</strong>`;

            // Empty Digit Output
            element.sticky.aBox.output.innerHTML = "Digit: ";

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
                if (this.answers.multi.input[this.index]) {

                    element.sticky.aBox.multi.input[this.answers.multi.input[this.index]].checked = true;
                    element.sticky.aBox.output.innerHTML = `Digit: ${this.answers.multi.output[this.index][this.answers.multi.input[this.index]]}`;

                }

            }
            else {

                element.sticky.aBox.multi.element.style.display = "none";
                element.sticky.aBox.open.style.display = "unset";


                // Empty/Refill the Textarea & Output
                element.sticky.aBox.open.value = this.answers.open.input[this.index-10] ? this.answers.open.input[this.index-10] : "";
                if (this.answers.open.pOutput[this.index-10]) element.sticky.aBox.output.innerHTML = this.answers.open.pOutput[this.index-10];

            }

        }
        else element.results();
    },

    completionCheck: function() {

        // AI (Needs to be replaced)
        return Array.from(element.bomb.numbers)
                .slice(0, 15)
                .every(digitBox => digitBox.innerHTML.trim() !== "");
    }
}



element.bomb.ini();
quiz.ini();
quiz.display();


document.addEventListener("keydown", (event) => {

    switch (event.key) {
        case "1": element.bomb.insert(1); break;
        case "2": element.bomb.insert(2); break;
        case "3": element.bomb.insert(3); break;
        case "4": element.bomb.insert(4); break;
        case "5": element.bomb.insert(5); break;
        case "6": element.bomb.insert(6); break;
        case "7": element.bomb.insert(7); break;
        case "8": element.bomb.insert(8); break;
        case "9": element.bomb.insert(9); break;
        case "0": element.bomb.insert(0); break;
        
        case "ArrowLeft": element.bomb.insert(10); break;
        case "ArrowRight": element.bomb.insert(12); break;
    
        default:
            break;
    }
});