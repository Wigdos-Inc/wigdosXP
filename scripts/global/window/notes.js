function notes(appContentBox) {

    appContentBox.classList.add("notesBox");

    const inputField = appContentBox.appendChild(document.createElement("textarea")); inputField.classList.add("notesField");

    return appContentBox;
}