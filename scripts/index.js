let dkGridSetup = {
    collection: document.getElementsByClassName("dk-grid-box"),
    array     : [],

    push: function() {

        this.array = [];

        for (let i=0; i < dkGridSetup.collection.length; i++) this.array.push(this.collection[i]);
    }
}


let DKGridArray = [[],[]];
class DKGridClass {

    constructor() {
        this.filled = false;
        this.select = false;
        this.image  = {
            element: undefined,
            source : undefined
        }
        this.text   = undefined;
    }
}