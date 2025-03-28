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
        aBox : document.getElementById("stickyAbox"),
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
    index: 0,

    question: 
    [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15"
    ],

    answers: {
        multi: 
        [
            [1,2,3,4],
            [1,2,3,4],
            [1,2,3,4],
            [1,2,3,4],
            [1,2,3,4],
            [1,2,3,4],
            [1,2,3,4],
            [1,2,3,4],
            [1,2,3,4],
            [1,2,3,4]
        ],
        open :
        [
            "correct",
            "correct",
            "correct",
            "correct",
            "correct"
        ]
    },
        
    display: function() {

        // Highlight Active Digit Box
        for (let i=0; i < element.bomb.numbers.length; i++) element.bomb.numbers[i].classList.remove("highlight");
        element.bomb.numbers[this.index].classList.add("highlight");

        element.sticky.qnr.innerHTML = this.index+1;
        element.sticky.qBox.innerHTML = this.question[this.index];

        if (this.index < 10) {

            document.getElementById("openAnswerBox").style.display = "none";
            document.getElementById("multiAnswerBox").style.display = "unset";

            // Display Multiple Choice Answers
            for (let i=0; i < 4; i++) {

                // Display Answers
                document.getElementById(`l${i}`).innerHTML = this.answers.multi[this.index][i];

                // Make sure only one can be checked at a time
                document.getElementsByClassName("answers")[i].onclick = () => {

                    for (let i2 = 0; i2 < 4; i2++) {

                        document.getElementsByClassName("answers")[i2].selected = false;
                    }

                    document.getElementsByClassName("answers")[i].selected = true;
                }
            }

        }
        else {

            document.getElementById("multiAnswerBox").style.display = "none";
            document.getElementById("openAnswerBox").style.display = "unset";

            // Empty the textarea
            document.getElementById("openAnswerBox").innerHTML = "";

        }
    }
}



element.bomb.ini();
quiz.display();