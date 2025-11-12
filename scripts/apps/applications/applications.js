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





// Create Supported ApplicationsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA

/*
Template: 
- NAME (shortname, displayname, fullname (if applicable); array)
- SERIES (game series/other/""; string) (for icons)
- FULL (fullscreen; boolean)
- PATH (internal/external, file path/url; array)
- SAVE (saving functionality; boolean)
*/

// Note: First Value must match Object Property Key
// Example: rBrowser is both the Property Key, and the first Value. Which makes it the app's ID
// Breaks code if different

const applications = {

    /* BROWSER */
    rBrowser: new Application(
        ["rBrowser", "WiggleSearch"], 
        "",
        true, 
        ["internal", "apps/browser/"],
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
    gspot: new Application(
        ["gspot", "GameSpot"], 
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
        ["external", "https://MichaelD1B.github.io/fnafworld"]
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
        ["external", "https://wigdos-inc.github.io/Undertale-HTML/"],
        true
    ),

    dt: new Application(
        ["dt", "Deltarune"],
        "other",
        true, 
        ["external", "https://wigdos-inc.github.io/Deltarune-HTML/"],
        true
    ),

    sm64: new Application(
        ["sm64", "Mario 64", "Super Mario 64"],
        "other",
        true, 
        ["external", "https://danie-glr.github.io/wigdos_mayro/sm64/mario.html"]
    ),

    hlf: new Application(
        ["hlf", "Half-Life"],
        "other",
        true,
        ["external", "https://102462-p.github.io/repo0.github.io/"]
    ),



    /* SPECIAL */
    bombs: new Application(
        ["bombs", "Wigsplosionator"],
        "",
        true, 
        ["internal", "apps/bombs/"]
    ),
    su: new Application(
        ["su", "Singular Upgrading"],
        "other",
        true, 
        ["internal", "apps/su/"],
        true
    ),
    breakout: new Application(
        ["breakout", "Breakout"],
        "other",
        false,
        ["internal", "apps/games/"]
    ),
    sublimator: new Application(
        ["sublimator", "Sublimator"],
        "other",
        false,
        ["internal", "apps/games/"]
    ),
    jeff: new Application(
        ["jeff", "Super Jeff"],
        "other",
        true,
        ["external", "https://102462-p.github.io/repo0.github.io/superjeff/"]
    ),
    pHub: new Application(
        ["pHub", "PokeHub"],
        "other",
        true,
        ["external", "https://wigdos-inc.github.io/PokeHub/"]
    )
}



/* SU Data Tracking */
function handleSuMessage(event) {
    // Basic validation
    if (!event || !event.data || typeof event.data.type !== 'string') return;

    // Only handle taskUpdate messages here
    if (event.data.type !== 'taskUpdate') return;

    // Iterate windows and forward message to any SU app iframe that exists
    windows.object.forEach(appWin => {
        if (!appWin) return;
        if (appWin.app && appWin.app.name && appWin.app.name.s === 'su' && appWin.iframe && appWin.iframe.contentWindow) {
            try {
                appWin.iframe.contentWindow.postMessage({ type: event.data.type, taskData: event.data.taskData }, '*');
            } catch (err) {
                console.warn('Failed to postMessage to SU iframe', err);
            }
        }
    });
}

window.addEventListener('message', handleSuMessage);

// Export for ES6 modules
export { Application, applications };

// Expose globally for backward compatibility
window.Application = Application;
window.applications = applications;