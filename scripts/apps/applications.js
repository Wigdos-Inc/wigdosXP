class Application {

    constructor(id, title, series, full, path) {

        this.id    = id;
        this.title = title;
        this.dName = title;
        this.series= series;
        this.full  = full;
        this.path  = (path[0] == "external" ? path[1] : (path[1] + id + ".html"));

        this.icon  = {
            s: `assets/images/icons/16x/${id}.png` || `assets/images/icons/games/${series}/${id}.png`,
            m: `assets/images/icons/32x/${id}.png` || `assets/images/icons/games/${series}/${id}.png`,
            l: `assets/images/icons/48x/${id}.png` || `assets/images/icons/games/${series}/${id}.png`
        }
    }
}





// Create Supported Applications

/*
Template: 
- ID (shortname; string)
- TITLE (display name; string)
- SERIES (game series/other/empty; string)
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
        "",
        true, 
        ["internal", "apps/browser/"]
    ),

    fBrowser: new Application(
        "fBrowser", 
        "Wiglefari", 
        "",
        true, 
        ["internal", "apps/browser/"]
    ),



    /* BUILT-IN */
    notes: new Application(
        "notes", 
        "Notepad", 
        "",
        false, 
        ["internal", "apps/"]
    ),

    bin  : new Application(
        "bin", 
        "Recycling Bin", 
        "",
        false, 
        ["internal", "apps/"]
    ),

    files: new Application(
        "files", 
        "File Explorer", 
        "",
        false, 
        ["internal", "apps/"]
    ),



    /* EXTERNAL */
    feddy1: new Application(
        "feddy1", 
        "FNAF 1", 
        "fnaf",
        true, 
        ["external", "https://danie-glr.github.io/wigdos_games/1/"]
    ),

    feddy2  : new Application(
        "feddy2", 
        "FNAF 2", 
        "fnaf",
        true, 
        ["external", "https://danie-glr.github.io/wigdos_games/2/"]
    ),

    feddy3: new Application(
        "feddy3", 
        "FNAF 3", 
        "fnaf",
        true, 
        ["external", "https://danie-glr.github.io/wigdos_games/3/"]
    ),

    feddy4: new Application(
        "feddy4", 
        "FNAF 4", 
        "fnaf",
        true, 
        ["external", "https://danie-glr.github.io/wigdos_games/4/"]
    ),

    feddyWorld: new Application(
        "feddyWorld", 
        "FNAF World", 
        "fnaf",
        true, 
        ["external", "https://danie-glr.github.io/wigdos_games/4/"]
    ),

    feddyPS: new Application(
        "feddyPS", 
        "FNAF PS", 
        "fnaf",
        true, 
        ["external", "https://danie-glr.github.io/feddy_ps6/"]
    ),

    feddyUCN: new Application(
        "feddyUCN", 
        "FNAF UCN", 
        "fnaf",
        true, 
        ["external", "https://danie-glr.github.io/wigdos_games/ucn/"]
    ),

    ut: new Application(
        "ut", 
        "Undertale", 
        "other",
        true, 
        ["external", "https://michaeld1b.github.io/Undertale-HTML/"]
    ),

    sm64: new Application(
        "sm64", 
        "SM64", 
        "other",
        true, 
        ["external", "https://danie-glr.github.io/wigdos_mayro/sm64/mario.html"]
    ),



    /* UNIQUE */
    bombs: new Application(
        "bombs", 
        "Wigsplosionator", 
        "",
        true, 
        ["internal", "apps/bombs/"]
    )
}