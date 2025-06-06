class Application {

    constructor(id, title, full, path) {

        this.id    = id;
        this.title = title;
        this.full  = full;
        this.path  = (path[0] == "external" ? path[1] : (path[1] + title + ".html"));

        this.icon  = {
            s: `assets/images/icons/16x/${id}.png`,
            m: `assets/images/icons/32x/${id}.png`,
            l: `assets/images/icons/48x/${id}.png`
        }
    }

    start() {

        const window = new AppWindow(this);
        window.create();
    }
}





// Create Supported Applications

/*
Template: 
- ID (shortname; string)
- TITLE (display name; string)
- FULL (fullscreen; boolean)
- PATH (internal/external, file path/url; array)
*/

// Note: First Contructor Parameter must match Object Property Key
// Example: rBrowser is both the Property Key, and the first Parameter. Which makes it the app's ID

const applications = {

    /* BROWSER */
    rBrowser: new Application(
        "rBrowser", 
        "WiggleSearch", 
        true, 
        ["internal", "apps/browser/"]
    ),

    fBrowser: new Application(
        "fBrowser", 
        "Wiglefari", 
        true, 
        ["internal", "apps/browser/"]
    ),



    /* BUILT-IN */
    notes: new Application(
        "notes", 
        "Notepad", 
        false, 
        ["internal", "apps/"]
    ),

    bin  : new Application(
        "bin", 
        "Recycling Bin", 
        false, 
        ["internal", "apps/"]
    ),

    files: new Application(
        "files", 
        "File Explorer", 
        false, 
        ["internal", "apps/"]
    ),



    /* EXTERNAL */
    feddy1: new Application(
        "feddy1", 
        "FNAF 1", 
        true, 
        ["external", "https://danie-glr.github.io/wigdos_games/1/"]
    ),

    feddy2  : new Application(
        "feddy2", 
        "FNAF 2", 
        true, 
        ["external", "https://danie-glr.github.io/wigdos_games/2/"]
    ),

    feddy3: new Application(
        "feddy3", 
        "FNAF 3", 
        true, 
        ["external", "https://danie-glr.github.io/wigdos_games/3/"]
    ),

    feddy4: new Application(
        "feddy4", 
        "FNAF 4", 
        true, 
        ["external", "https://danie-glr.github.io/wigdos_games/4/"]
    ),

    feddyWorld: new Application(
        "feddyWorld", 
        "FNAF World", 
        true, 
        ["external", "https://danie-glr.github.io/wigdos_games/4/"]
    ),

    feddyPS: new Application(
        "feddyPS", 
        "FNAF PS", 
        true, 
        ["external", "https://danie-glr.github.io/feddy_ps6/"]
    ),

    feddyUCN: new Application(
        "feddyUCN", 
        "FNAF UCN", 
        true, 
        ["external", "https://danie-glr.github.io/wigdos_games/ucn/"]
    ),

    ut      : new Application(
        "ut", 
        "Undertale", 
        true, 
        ["external", "https://michaeld1b.github.io/Undertale-HTML/"]
    ),

    sm64    : new Application(
        "sm64", 
        "SM64", 
        true, 
        ["external", "https://danie-glr.github.io/wigdos_mayro/sm64/mario.html"]
    ),



    /* UNIQUE */
    bombs: new Application(
        "bombs", 
        "Wigsplosionator", 
        true, 
        ["internal", "apps/bombs/"]
    )
}



// Tracking Desktop Grid Space
let amount = {
    cr: 0,
    cc: 0,
    tr: dkGridArray.length,
    tc: dkGridArray[0].length
}

// Attach Apps to Desktop
for (const app in applications) {

    dkGridArray
}