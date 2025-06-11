class Application {

    constructor(name, series, full, path, save) {

        this.name = {
            s: name[0],
            m: name[1],
            l: name[2] || name[1],
            d: name[1]
        }
        
        this.series= series;
        this.full  = full;
        this.path  = (path[0] == "external" ? path[1] : (path[1] + name[0] + ".html"));

        this.icon = {
            s: !series ? `assets/images/icons/16x/${name[0]}.png` : `assets/images/icons/games/${series}/${name[0]}.png`,
            m: !series ? `assets/images/icons/32x/${name[0]}.png` : `assets/images/icons/games/${series}/${name[0]}.png`,
            l: !series ? `assets/images/icons/48x/${name[0]}.png` : `assets/images/icons/games/${series}/${name[0]}.png`
        }

        this.save = save;
    }
}





// Create Supported Applications

/*
Template: 
- ID (shortname, displayname, fullname (if applicable); array)
- SERIES (game series/other/empty; string)
- FULL (fullscreen; boolean)
- PATH (internal/external, file path/url; array)
*/

// Note: First Contructor Parameter must match Object Property Key
// Example: rBrowser is both the Property Key, and the first Parameter. Which makes it the app's ID

const applications = {

    /* BROWSER */
    rBrowser: new Application(
        ["rBrowser", "WiggleSearch"], 
        "",
        true, 
        ["internal", "apps/browser/"]
    ),

    fBrowser: new Application(
        ["fBrowser", "WigleFari"], 
        "",
        true, 
        ["internal", "apps/browser/"]
    ),



    /* BUILT-IN */
    notes: new Application(
        ["notes", "Notepad"],
        "",
        false,
        ["internal", "apps/"]
    ),

    bin  : new Application(
        ["bin", "Recycling Bin"], 
        "",
        false, 
        ["internal", "apps/"]
    ),

    files: new Application(
        ["files", "File Explorer"], 
        "",
        false, 
        ["internal", "apps/"]
    ),



    /* EXTERNAL */
    feddy1: new Application(
        ["feddy1", "FNAF 1", "Five Nights at Freddy's"],
        "fnaf",
        true, 
        ["external", "https://danie-glr.github.io/wigdos_games/1/"]
    ),

    feddy2  : new Application(
        ["feddy2", "FNAF 2", "Five Nights at Freddy's 2"],
        "fnaf",
        true, 
        ["external", "https://danie-glr.github.io/wigdos_games/2/"]
    ),

    feddy3: new Application(
        ["feddy3", "FNAF 3", "Five Nights at Freddy's 3"],
        "fnaf",
        true, 
        ["external", "https://danie-glr.github.io/wigdos_games/3/"]
    ),

    feddy4: new Application(
        ["feddy4", "FNAF 4", "Five Nights at Freddy's 4"],
        "fnaf",
        true, 
        ["external", "https://danie-glr.github.io/wigdos_games/4/"]
    ),

    feddyWorld: new Application(
        ["feddyWorld", "FNAF World"], 
        "fnaf",
        true, 
        ["external", "https://danie-glr.github.io/wigdos_games/4/"]
    ),

    feddyPS: new Application(
        ["feddyPS", "FNAF PS", "FNAF: Pizzeria Simulator"], 
        "fnaf",
        true, 
        ["external", "https://danie-glr.github.io/feddy_ps6/"]
    ),

    feddyUCN: new Application(
        ["feddyUCN", "FNAF UCN", "FNAF: Ultimate Custom Night"], 
        "fnaf",
        true, 
        ["external", "https://danie-glr.github.io/wigdos_games/ucn/"]
    ),

    ut: new Application(
        ["ut", "Undertale"],
        "other",
        true, 
        ["external", "https://michaeld1b.github.io/Undertale-HTML/"],
        true
    ),

    sm64: new Application(
        ["sm64", "Mario 64", "Super Mario 64"],
        "other",
        true, 
        ["external", "https://danie-glr.github.io/wigdos_mayro/sm64/mario.html"]
    ),



    /* UNIQUE */
    bombs: new Application(
        ["creature", "Wigsplosionator"],
        "",
        true, 
        ["internal", "apps/bombs/"]
    )
}