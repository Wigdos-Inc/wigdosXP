class Application {

    constructor(name, series, full, path, save = false) {

        this.name = {
            s: name[0],
            m: name[1],
            l: name[2] || name[1],
            d: name[1]
        }
        
        this.series= series;
        this.full  = full;
        this.path  = path[0] === "external" ? path[1] : (path[1] + name[0] + ".html");

        this.icon = { s: "16x", m: "32x", l: "48x" };

        this.save = save;
    }

    async getIcon() {

        if (this.series) {
            const seriesSet = GAME_ICON_MANIFEST[this.series] || EMPTY_ICON_SET;
            const specificIcon = `/assets/images/icons/games/${this.series}/${this.name.s}.png`;
            const seriesIcon = `/assets/images/icons/games/${this.series}/${this.series}.png`;

            for (const size in this.icon) {
                this.icon[size] = seriesSet.has(this.name.s)
                    ? specificIcon
                    : seriesSet.has(this.series)
                        ? seriesIcon
                        : `/assets/images/icons/${this.icon[size]}/bombs.png`;
            }

        }
        else {
            for (const size in this.icon) {
                const bucket = this.icon[size];
                const sizeSet = ICON_SIZE_MANIFEST[bucket] || EMPTY_ICON_SET;
                this.icon[size] = sizeSet.has(this.name.s)
                    ? `/assets/images/icons/${bucket}/${this.name.s}.png`
                    : `/assets/images/icons/${bucket}/bombs.png`;
            }
        }
    }
}

const EMPTY_ICON_SET = new Set();

const GAME_ICON_MANIFEST = {
    carl: new Set(['carl']),
    fnaf: new Set(['feddy1', 'feddy2', 'feddy3', 'feddy4', 'feddyPS', 'feddyUCN', 'feddyWorld']),
    jeff: new Set(['jeff', 'ggJeff']),
    ofes: new Set(['breakout', 'sublimator']),
    other: new Set(['cmd', 'gspot', 'hlf', 'pHub', 'sm64', 'su', 'wigshell']),
    ut: new Set(['dt', 'ut']),
};

const ICON_SIZE_MANIFEST = {
    '16x': new Set(['bin', 'bombs', 'fBrowser', 'files', 'gspot', 'notes', 'rBrowser', 'save-editor', 'screen', 'wigshell']),
    '32x': new Set(['WigleTube', 'bombs', 'fBrowser', 'files', 'gspot', 'notes', 'power', 'rBrowser', 'restart', 'save-editor', 'wiano', 'wigshell', 'winesweeper']),
    '48x': new Set(['WigleTube', 'bin', 'bombs', 'fBrowser', 'files', 'gspot', 'notes', 'rBrowser', 'save-editor', 'wigshell']),
};





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
    saveEditor: new Application(
        ["save-editor", "Wigdos Save Editor"], 
        "",
        false, 
        ["internal", "apps/save-editor/"],
    ),

    wigshell: new Application(
        ["wigshell", "WigShell"],
        "other",
        false,
        ["internal", "/apps/"]
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

    // Undertale Series
    ut: new Application(
        ["ut", "Undertale"],
        "ut",
        true, 
        ["external", "https://wigdos-inc.github.io/Undertale-HTML/"],
        true
    ),

    dt: new Application(
        ["dt", "Deltarune"],
        "ut",
        true, 
        ["external", "https://wigdos-inc.github.io/Deltarune-HTML/"],
        true
    ),
    
    // s102462
    hlf: new Application(
        ["hlf", "Half-Life"],
        "other",
        true,
        ["external", "https://wigdos-inc.github.io/102462_wigDos/halflife/"]
    ),

    sm64: new Application(
        ["sm64", "Mario 64", "Super Mario 64"],
        "other",
        true, 
        ["external", "https://danie-glr.github.io/wigdos_mayro/sm64/mario.html"],
        true
    ),

    carl2D: new Application(
        ["carl2D", "Carl 2D", "Carl the Urgent Slug Urchin 2D"],
        "other",
        true,
        ["external", "https://wigdos-inc.github.io/Internal-Games/slop/carl2D/"],
    ),
   
    uh: new Application(
        ["uh", "ultrahill", "ultrakill autistic little brother"],
        "other",
        true,
        ["external", "https://danie-glr.github.io/ultrahill/"],
    ),
       
    bk: new Application(
        ["bk", "banjo", "Banjo-Kazooie"],
        "other",
        true,
        ["external", "https://wigdos-inc.github.io/102462_wigDos/64emulator/index.html?game=bk"],
    ),

    cbfd: new Application(
        ["cbfd", "conker", "Conker's Bad Fur Day"],
        "other",
        true,
        ["external", "https://wigdos-inc.github.io/102462_wigDos/64emulator/index.html?game=cbfd"],
    ),

        dk: new Application(
        ["dk", "donkey kong", "Donkey Kong 64"],
        "other",
        true,
        ["external", "https://wigdos-inc.github.io/102462_wigDos/64emulator/index.html?game=dk"],
    ),

      dkr: new Application(
        ["dkr", "Diddy kong racing", "Diddy Kong Racing"],
        "other",
        true,
        ["external", "https://wigdos-inc.github.io/102462_wigDos/64emulator/index.html?game=dkr"],
    ),

     zoot: new Application(
        ["zoot", "Zoot", "Zoot"],
        "other",
        true,
        ["external", "https://wigdos-inc.github.io/102462_wigDos/64emulator/index.html?game=zoot"],
    ),

     mp3: new Application(
        ["mp3", "MP3", "MP3 (not the file extension)"],
        "other",
        true,
        ["external", "https://wigdos-inc.github.io/102462_wigDos/64emulator/index.html?game=mp3"],
    ),

    ys: new Application(
        ["ys", "YS", "Yoshi story (stupid ass dino)"],
        "other",
        true,
        ["external", "https://wigdos-inc.github.io/102462_wigDos/64emulator/index.html?game=ys"],
    ),
    /* INTERNAL-GAMES (Repository) */
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
    
    // OFES Games
    breakout: new Application(
        ["breakout", "Breakout"],
        "ofes",
        false,
        ["internal", "apps/games/"]
    ),
    
    sublimator: new Application(
        ["sublimator", "Sublimator"],
        "ofes",
        false,
        ["internal", "apps/games/"]
    ),
    
    // Super Jeff
    jeff: new Application(
        ["jeff", "Super Jeff"],
        "jeff",
        true,
        ["external", "https://wigdos-inc.github.io/102462_wigDos/superjeff/"]
    ),
    
    ggJeff: new Application(
        ["ggJeff", "Super Jeff 2 Galaxy Jeff"],
        "jeff",
        true,
        ["external", "https://wigdos-inc.github.io/102462_wigDos/galaxyjeff/"]
    ),
    
    kJeff: new Application(
        ["kJeff", "Super Jeff Kart (& Carl is here)"],
        "jeff",
        true,
        ["external", "https://wigdos-inc.github.io/102462_wigDos/SuperJeffCart/"]
    ),
    
    oddJeff: new Application(
        ["oddJeff", "Super Jeff 3 Super Odyssey"],
        "jeff",
        true,
        ["external", "https://wigdos-inc.github.io/102462_wigDos/SuperJeffOdyssey/"]
    ),

    // Carl the Urgent Slug Urchin
    carl2D: new Application(
        ["carl2D", "Carl 2D", "Carl the Urgent Slug Urchin 2D"],
        "carl",
        true,
        ["external", "https://wigdos-inc.github.io/SloppyCarlGames/carlGames/carl2D/"],
    ),
    
    // Stu102871
    pHub: new Application(
        ["pHub", "PokeHub"],
        "other",
        true,
        ["external", "https://wigdos-inc.github.io/PokeHub/"]
    ),


    /* SAPPS (Repository) */
    cmd: new Application(
        ["cmd", "Terminal"],
        "other",
        true,
        ["external", "https://wigdos-inc.github.io/102462_wigDos/WdosCMD/wingDosCMD.html"]
    ),
    
    wEngine: new Application(
        ["wEngine", "Wiggy Engine"],
        "other",
        true,
        ["external", "https://wigdos-inc.github.io/102462_wigDos/WiggyEngine"]
    )
};

// Async Wrapper (cuz this file ain't a module)
(async () => {
    
    // Load Icons
    for (const app of Object.values(applications)) await app.getIcon();

    // Expose applications globally for Start Menu and other systems
    window.applications = applications;

    // Notify other modules that the applications registry is ready
    window.dispatchEvent(new Event('apps-ready'));
})();



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
