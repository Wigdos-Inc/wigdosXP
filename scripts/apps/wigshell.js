// WigShell - PowerShell-like Terminal for WigdosXP
// Command execution engine with PowerShell-style cmdlets

class WigShell {
    constructor() {
        this.output = document.getElementById('shellOutput');
        this.input = document.getElementById('shellInput');
        this.prompt = document.getElementById('shellPrompt');
        
        this.currentPath = 'C:\\WigdosXP';
        this.commandHistory = [];
        this.historyIndex = -1;
        this.variables = {};
        
        this.init();
    }

    init() {
        // Display welcome message
        this.displayWelcome();
        
        // Setup input handlers
        this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.input.focus();
        
        // Keep input focused
        document.addEventListener('click', () => this.input.focus());
    }

    displayWelcome() {
        this.addOutput(`
            <div class="welcome-banner">
                <div class="title">WigShell v1.0</div>
                <div class="version">PowerShell for WigdosXP</div>
                <br>
                Type 'help' for available commands
                <br>
                <span style="font-size: 11px; color: #90ee90;">Tip: Use 'cd My_Files' to access your file storage</span>
            </div>
        `);
    }

    handleKeyDown(e) {
        switch(e.key) {
            case 'Enter':
                e.preventDefault();
                this.executeCommand(this.input.value.trim());
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.navigateHistory(-1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.navigateHistory(1);
                break;
            case 'Tab':
                e.preventDefault();
                this.autoComplete();
                break;
            case 'c':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.input.value = '';
                }
                break;
        }
    }

    navigateHistory(direction) {
        if (this.commandHistory.length === 0) return;
        
        this.historyIndex += direction;
        
        if (this.historyIndex < 0) {
            this.historyIndex = 0;
        } else if (this.historyIndex >= this.commandHistory.length) {
            this.historyIndex = this.commandHistory.length;
            this.input.value = '';
            return;
        }
        
        this.input.value = this.commandHistory[this.historyIndex] || '';
    }

    autoComplete() {
        const partial = this.input.value.toLowerCase();
        const commands = Object.keys(this.commands);
        
        const matches = commands.filter(cmd => 
            cmd.startsWith(partial)
        );
        
        if (matches.length === 1) {
            this.input.value = matches[0];
        } else if (matches.length > 1) {
            this.addOutput(`<div class="output-info">${matches.join('  ')}</div>`);
        }
    }

    async executeCommand(commandLine) {
        if (!commandLine) return;
        
        // Add to history
        this.commandHistory.push(commandLine);
        this.historyIndex = this.commandHistory.length;
        
        // Display command
        this.addOutput(`<div class="output-command">${this.prompt.textContent} ${commandLine}</div>`);
        
        // Clear input
        this.input.value = '';
        
        // Parse command
        const parts = this.parseCommand(commandLine);
        const cmdName = parts.command;
        const args = parts.args;
        
        // Execute command
        if (this.commands[cmdName]) {
            try {
                await this.commands[cmdName].call(this, args);
            } catch (error) {
                this.addError(`Error executing ${cmdName}: ${error.message}`);
            }
        } else {
            this.addError(`Command '${cmdName}' not recognized. Type 'help' for available commands.`);
        }
        
        // Scroll to bottom
        this.output.scrollTop = this.output.scrollHeight;
    }

    parseCommand(commandLine) {
        // Basic parsing - can be extended for pipes, variables, etc.
        const parts = commandLine.trim().split(/\s+/);
        return {
            command: parts[0].toLowerCase(),
            args: parts.slice(1)
        };
    }

    addOutput(html) {
        this.output.innerHTML += html;
    }

    addText(text, className = 'output-text') {
        this.addOutput(`<div class="output-line ${className}">${text}</div>`);
    }

    addError(message) {
        this.addOutput(`<div class="output-line output-error">${message}</div>`);
    }

    addSuccess(message) {
        this.addOutput(`<div class="output-line output-success">${message}</div>`);
    }

    addWarning(message) {
        this.addOutput(`<div class="output-line output-warning">${message}</div>`);
    }

    updatePrompt() {
        this.prompt.textContent = `PS ${this.currentPath}>`;
    }

    // Firebase file management helpers
    async saveUserFile(username, path, fileData) {
        // Save to Firebase if online
        if (window.firebaseAPI && window.firebaseOnline) {
            try {
                const { db, doc, getDoc, setDoc } = window.firebaseAPI;
                const userDocRef = doc(db, 'users', username);
                const userDoc = await getDoc(userDocRef);
                
                const files = userDoc.exists() && userDoc.data().files ? userDoc.data().files : {};
                files[path] = fileData;
                
                await setDoc(userDocRef, { files }, { merge: true });
            } catch (error) {
                console.error('[WigShell] Firebase save error:', error);
                throw error;
            }
        }
        
        // Always save to localStorage as backup
        const localFiles = JSON.parse(localStorage.getItem(`userFiles_${username}`) || '{}');
        localFiles[path] = fileData;
        localStorage.setItem(`userFiles_${username}`, JSON.stringify(localFiles));
    }

    async deleteUserFile(username, path) {
        // Delete from Firebase if online
        if (window.firebaseAPI && window.firebaseOnline) {
            try {
                const { db, doc, getDoc, setDoc } = window.firebaseAPI;
                const userDocRef = doc(db, 'users', username);
                const userDoc = await getDoc(userDocRef);
                
                const files = userDoc.exists() && userDoc.data().files ? userDoc.data().files : {};
                delete files[path];
                
                await setDoc(userDocRef, { files }, { merge: true });
            } catch (error) {
                console.error('[WigShell] Firebase delete error:', error);
                throw error;
            }
        }
        
        // Always delete from localStorage
        const localFiles = JSON.parse(localStorage.getItem(`userFiles_${username}`) || '{}');
        delete localFiles[path];
        localStorage.setItem(`userFiles_${username}`, JSON.stringify(localFiles));
    }

    async getUserFile(username, path) {
        // Try Firebase first if online
        if (window.firebaseAPI && window.firebaseOnline) {
            try {
                const { db, doc, getDoc } = window.firebaseAPI;
                const userDocRef = doc(db, 'users', username);
                const userDoc = await getDoc(userDocRef);
                
                if (userDoc.exists() && userDoc.data().files && userDoc.data().files[path]) {
                    return userDoc.data().files[path];
                }
            } catch (error) {
                console.error('[WigShell] Firebase read error:', error);
            }
        }
        
        // Fallback to localStorage
        const localFiles = JSON.parse(localStorage.getItem(`userFiles_${username}`) || '{}');
        return localFiles[path];
    }

    async listUserFiles(username, dirPath) {
        let files = {};
        
        // Try Firebase first if online
        if (window.firebaseAPI && window.firebaseOnline) {
            try {
                const { db, doc, getDoc } = window.firebaseAPI;
                const userDocRef = doc(db, 'users', username);
                const userDoc = await getDoc(userDocRef);
                
                if (userDoc.exists() && userDoc.data().files) {
                    files = userDoc.data().files;
                }
            } catch (error) {
                console.error('[WigShell] Firebase list error:', error);
            }
        }
        
        // Merge with localStorage
        const localFiles = JSON.parse(localStorage.getItem(`userFiles_${username}`) || '{}');
        files = { ...files, ...localFiles };
        
        // Filter by directory path
        const filtered = {};
        for (const [path, data] of Object.entries(files)) {
            if (path.startsWith(dirPath)) {
                const relativePath = path.substring(dirPath.length).replace(/^[\\]+/, '');
                if (!relativePath.includes('\\')) { // Only immediate children
                    filtered[relativePath] = data;
                }
            }
        }
        
        return filtered;
    }

    // Command Definitions
    commands = {
        'help': function(args) {
            if (args.length > 0) {
                const cmdName = args[0];
                if (this.commandHelp[cmdName]) {
                    this.addOutput(this.commandHelp[cmdName]);
                } else {
                    this.addError(`No help found for '${cmdName}'`);
                }
            } else {
                this.addOutput(`
                    <div class="output-header">Available Commands:</div>
                    <div class="output-table">
                        <div class="output-table-row">
                            <div class="output-table-cell output-table-header">Command</div>
                            <div class="output-table-cell output-table-header">Description</div>
                        </div>
                        <div class="output-table-row">
                            <div class="output-table-cell output-property">help</div>
                            <div class="output-table-cell">Display help information</div>
                        </div>
                        <div class="output-table-row">
                            <div class="output-table-cell output-property">clear/cls</div>
                            <div class="output-table-cell">Clear the terminal screen</div>
                        </div>
                        <div class="output-table-row">
                            <div class="output-table-cell output-property">echo</div>
                            <div class="output-table-cell">Display text</div>
                        </div>
                        <div class="output-table-row">
                            <div class="output-table-cell output-property">date/time</div>
                            <div class="output-table-cell">Show current date and time</div>
                        </div>
                        <div class="output-table-row">
                            <div class="output-table-cell output-property">pwd</div>
                            <div class="output-table-cell">Show current directory</div>
                        </div>
                        <div class="output-table-row">
                            <div class="output-table-cell output-property">cd</div>
                            <div class="output-table-cell">Change directory</div>
                        </div>
                        <div class="output-table-row">
                            <div class="output-table-cell output-property">ls/dir/apps</div>
                            <div class="output-table-cell">List WigdosXP applications</div>
                        </div>
                        <div class="output-table-row">
                            <div class="output-table-cell output-property">start/open/run</div>
                            <div class="output-table-cell">Launch an application</div>
                        </div>
                        <div class="output-table-row">
                            <div class="output-table-cell output-property">whoami/user</div>
                            <div class="output-table-cell">Show current user info</div>
                        </div>
                        <div class="output-table-row">
                            <div class="output-table-cell output-property">vars</div>
                            <div class="output-table-cell">Display defined variables</div>
                        </div>
                        <div class="output-table-row">
                            <div class="output-table-cell output-property">history</div>
                            <div class="output-table-cell">Show command history</div>
                        </div>
                        <div class="output-table-row">
                            <div class="output-table-cell output-property">version</div>
                            <div class="output-table-cell">Show WigShell version</div>
                        </div>
                        <div class="output-table-row">
                            <div class="output-table-cell output-property">hostname</div>
                            <div class="output-table-cell">Show system hostname</div>
                        </div>
                        <div class="output-table-row">
                            <div class="output-table-cell output-property">color</div>
                            <div class="output-table-cell">Test color output types</div>
                        </div>
                        <div class="output-table-row">
                            <div class="output-table-cell output-property">set/get/unset</div>
                            <div class="output-table-cell">Manage variables</div>
                        </div>
                        <div class="output-table-row">
                            <div class="output-table-cell output-property">calc/math</div>
                            <div class="output-table-cell">Calculate expressions</div>
                        </div>
                        <div class="output-table-row">
                            <div class="output-table-cell output-property">random/rand</div>
                            <div class="output-table-cell">Generate random numbers</div>
                        </div>
                        <div class="output-table-row">
                            <div class="output-table-cell output-property">ping/ipconfig</div>
                            <div class="output-table-cell">Network commands</div>
                        </div>
                        <div class="output-table-row">
                            <div class="output-table-cell output-property">sysinfo/uptime</div>
                            <div class="output-table-cell">System information</div>
                        </div>
                        <div class="output-table-row">
                            <div class="output-table-cell output-property">commands</div>
                            <div class="output-table-cell">List all commands</div>
                        </div>
                        <div class="output-table-row">
                            <div class="output-table-cell output-property">about/info</div>
                            <div class="output-table-cell">About WigShell</div>
                        </div>
                        <div class="output-table-row">
                            <div class="output-table-cell output-property">write-file</div>
                            <div class="output-table-cell">Write content to a file</div>
                        </div>
                    </div>
                    <br>
                    <div class="output-info">Commands are case-insensitive</div>
                    <div class="output-info">Type 'help [command]' for detailed info</div>
                    <div class="output-info">Type 'commands' to see all 80+ commands</div>
                `);
            }
        },

        'clear': function(args) {
            this.output.innerHTML = '';
        },

        'cls': function(args) {
            this.commands['clear'].call(this, args);
        },

        'echo': function(args) {
            const text = args.join(' ');
            this.addText(text);
        },

        'date': function(args) {
            const now = new Date();
            const formatted = now.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            this.addText(formatted);
        },

        'time': function(args) {
            this.commands['date'].call(this, args);
        },

        'pwd': function(args) {
            this.addText(this.currentPath);
            
            // Also show if this is a user files directory
            if (this.currentPath.includes('My_Files') || this.currentPath.includes('Users')) {
                this.addText('(User files directory)', 'output-info');
            }
        },

        'cd': function(args) {
            if (args.length === 0) {
                // Go to home directory
                this.currentPath = 'C:\\WigdosXP';
                this.updatePrompt();
                return;
            }
            
            const path = args[0];
            
            // Handle relative paths
            if (path === '..') {
                const parts = this.currentPath.split('\\');
                if (parts.length > 2) {
                    parts.pop();
                    this.currentPath = parts.join('\\');
                }
            } else if (path === '~' || path === '/') {
                this.currentPath = 'C:\\WigdosXP';
            } else if (path.startsWith('C:\\') || path.startsWith('C:/')) {
                this.currentPath = path.replace(/\//g, '\\');
            } else {
                // Relative path
                this.currentPath = this.currentPath + '\\' + path.replace(/\//g, '\\');
            }
            
            this.updatePrompt();
        },

        'apps': function(args) {
            // Check if applications object exists
            if (typeof applications === 'undefined') {
                this.addError('Applications not loaded');
                return;
            }

            this.addOutput('<div class="output-header">Installed WigdosXP Applications:</div>');
            this.addOutput('<div class="output-table">');
            this.addOutput(`
                <div class="output-table-row">
                    <div class="output-table-cell output-table-header">ID</div>
                    <div class="output-table-cell output-table-header">Name</div>
                    <div class="output-table-cell output-table-header">Type</div>
                </div>
            `);

            for (const [key, app] of Object.entries(applications)) {
                this.addOutput(`
                    <div class="output-table-row">
                        <div class="output-table-cell output-property">${key}</div>
                        <div class="output-table-cell output-value">${app.name.m}</div>
                        <div class="output-table-cell">${app.series || 'System'}</div>
                    </div>
                `);
            }

            this.addOutput('</div>');
        },

        'ls': function(args) {
            // If we're in a user directory or My_Files, list files by default
            const inUserDir = this.currentPath.includes('My_Files') || 
                            this.currentPath.includes('Users') || 
                            args.includes('-f') || 
                            args.includes('--files');
            
            if (inUserDir) {
                this.commands['ls-files'].call(this, args.filter(a => a !== '-f' && a !== '--files'));
            } else if (args.includes('-a') || args.includes('--apps')) {
                this.commands['apps'].call(this, args.filter(a => a !== '-a' && a !== '--apps'));
            } else {
                // Default to files
                this.commands['ls-files'].call(this, args);
            }
        },

        'ls-files': async function(args) {
            const username = (typeof user !== 'undefined' && user.username) ? user.username : localStorage.getItem('username') || 'guest';
            
            try {
                const files = await this.listUserFiles(username, this.currentPath);
                
                if (Object.keys(files).length === 0) {
                    this.addText('Empty directory');
                    return;
                }
                
                this.addOutput('<div class="output-header">Files and Folders:</div>');
                this.addOutput('<div class="output-table">');
                this.addOutput(`
                    <div class="output-table-row">
                        <div class="output-table-cell output-table-header">Type</div>
                        <div class="output-table-cell output-table-header">Name</div>
                        <div class="output-table-cell output-table-header">Size</div>
                    </div>
                `);
                
                for (const [name, data] of Object.entries(files)) {
                    const type = data.type === 'folder' ? '[DIR]' : '[FILE]';
                    const size = data.type === 'file' ? (data.size || 0) + ' bytes' : '-';
                    this.addOutput(`
                        <div class="output-table-row">
                            <div class="output-table-cell">${type}</div>
                            <div class="output-table-cell output-property">${name}</div>
                            <div class="output-table-cell output-value">${size}</div>
                        </div>
                    `);
                }
                
                this.addOutput('</div>');
            } catch (error) {
                this.addError(`ls-files: ${error.message}`);
            }
        },

        'dir': function(args) {
            this.commands['ls'].call(this, args);
        },

        'start': function(args) {
            if (args.length === 0) {
                this.addError('start: Missing application ID');
                this.addText('Usage: start [appId]');
                this.addText('Example: start rBrowser');
                return;
            }

            const appId = args[0];

            // Check if applications object exists
            if (typeof applications === 'undefined') {
                this.addError('Applications not loaded');
                return;
            }

            if (applications[appId]) {
                this.addSuccess(`Launching ${applications[appId].name.m}...`);
                
                // Use the global openWindow function if available
                if (typeof openWindow === 'function') {
                    openWindow(appId);
                } else {
                    this.addError('Window manager not available');
                }
            } else {
                this.addError(`Application '${appId}' not found`);
                this.addText('Use apps to see available applications');
            }
        },

        'open': function(args) {
            this.commands['start'].call(this, args);
        },

        'run': function(args) {
            this.commands['start'].call(this, args);
        },

        'whoami': function(args) {
            // Check if global user object exists
            if (typeof user !== 'undefined') {
                this.addOutput('<div class="output-header">Current User Information:</div>');
                this.addOutput(`<div class="output-property">Username:</div><div class="output-value">${user.username || 'Guest'}</div>`);
                if (user.email) {
                    this.addOutput(`<div class="output-property">Email:</div><div class="output-value">${user.email}</div>`);
                }
            } else {
                this.addText('Guest');
            }
        },

        'user': function(args) {
            this.commands['whoami'].call(this, args);
        },

        'vars': function(args) {
            if (Object.keys(this.variables).length === 0) {
                this.addText('No variables defined');
                return;
            }

            this.addOutput('<div class="output-header">Defined Variables:</div>');
            for (const [key, value] of Object.entries(this.variables)) {
                this.addOutput(`<div class="output-property">$${key}:</div><div class="output-value">${value}</div>`);
            }
        },

        'history': function(args) {
            if (this.commandHistory.length === 0) {
                this.addText('No command history');
                return;
            }

            this.addOutput('<div class="output-header">Command History:</div>');
            this.commandHistory.forEach((cmd, index) => {
                this.addText(`${index + 1}  ${cmd}`);
            });
        },

        'version': function(args) {
            this.addText('WigShell v1.0');
            this.addText('PowerShell for WigdosXP');
        },

        'hostname': function(args) {
            this.addText('WigdosXP');
        },

        'color': function(args) {
            this.addOutput('<div class="output-header">Color Test:</div>');
            this.addSuccess('Success message (green)');
            this.addError('Error message (red)');
            this.addWarning('Warning message (orange)');
            this.addText('Normal text (white)', 'output-info');
            this.addOutput('<div class="output-property">Property name (cyan)</div>');
            this.addOutput('<div class="output-value">Value (light green)</div>');
        },

        // Variable management
        'set': function(args) {
            if (args.length < 2) {
                this.addError('set: Usage: set [variable] [value]');
                return;
            }
            const varName = args[0].replace('$', '');
            const value = args.slice(1).join(' ');
            this.variables[varName] = value;
            this.addSuccess(`Variable $${varName} set to: ${value}`);
        },

        'get': function(args) {
            if (args.length === 0) {
                this.commands['vars'].call(this, args);
                return;
            }
            const varName = args[0].replace('$', '');
            if (this.variables[varName] !== undefined) {
                this.addText(this.variables[varName]);
            } else {
                this.addError(`Variable $${varName} not found`);
            }
        },

        'unset': function(args) {
            if (args.length === 0) {
                this.addError('unset: Missing variable name');
                return;
            }
            const varName = args[0].replace('$', '');
            if (this.variables[varName] !== undefined) {
                delete this.variables[varName];
                this.addSuccess(`Variable $${varName} removed`);
            } else {
                this.addError(`Variable $${varName} not found`);
            }
        },

        // System information
        'sysinfo': function(args) {
            this.addOutput('<div class="output-header">System Information:</div>');
            this.addOutput('<div class="output-property">OS:</div><div class="output-value">WigdosXP</div>');
            this.addOutput('<div class="output-property">Hostname:</div><div class="output-value">WigdosXP</div>');
            this.addOutput('<div class="output-property">Shell:</div><div class="output-value">WigShell v1.0</div>');
            this.addOutput('<div class="output-property">User Agent:</div><div class="output-value">' + navigator.userAgent + '</div>');
            this.addOutput('<div class="output-property">Language:</div><div class="output-value">' + navigator.language + '</div>');
            this.addOutput('<div class="output-property">Platform:</div><div class="output-value">' + navigator.platform + '</div>');
        },

        'uptime': function(args) {
            const uptime = performance.now();
            const seconds = Math.floor(uptime / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            this.addText(`Session uptime: ${hours}h ${minutes % 60}m ${seconds % 60}s`);
        },

        // Process/App management
        'ps': function(args) {
            this.commands['apps'].call(this, args);
        },

        'kill': function(args) {
            if (args.length === 0) {
                this.addError('kill: Missing window ID or app name');
                return;
            }
            this.addWarning('kill: Command not implemented - use window close button');
        },

        // Math operations
        'calc': function(args) {
            if (args.length === 0) {
                this.addError('calc: Missing expression');
                this.addText('Usage: calc [expression]');
                this.addText('Example: calc 5 + 3 * 2');
                return;
            }
            try {
                const expression = args.join(' ');
                // Basic safety check
                if (/[^0-9+\-*/(). ]/.test(expression)) {
                    this.addError('calc: Invalid characters in expression');
                    return;
                }
                const result = eval(expression);
                this.addText(`${expression} = ${result}`);
            } catch (error) {
                this.addError(`calc: ${error.message}`);
            }
        },

        'math': function(args) {
            this.commands['calc'].call(this, args);
        },

        // Random number
        'random': function(args) {
            let min = 0, max = 100;
            if (args.length === 1) {
                max = parseInt(args[0]);
            } else if (args.length >= 2) {
                min = parseInt(args[0]);
                max = parseInt(args[1]);
            }
            const random = Math.floor(Math.random() * (max - min + 1)) + min;
            this.addText(random.toString());
        },

        'rand': function(args) {
            this.commands['random'].call(this, args);
        },

        // String operations
        'reverse': function(args) {
            const text = args.join(' ');
            this.addText(text.split('').reverse().join(''));
        },

        'upper': function(args) {
            const text = args.join(' ');
            this.addText(text.toUpperCase());
        },

        'lower': function(args) {
            const text = args.join(' ');
            this.addText(text.toLowerCase());
        },

        'length': function(args) {
            const text = args.join(' ');
            this.addText(`Length: ${text.length} characters`);
        },

        // Network simulation
        'ping': function(args) {
            if (args.length === 0) {
                this.addError('ping: Missing host');
                return;
            }
            const host = args[0];
            this.addText(`Pinging ${host}...`);
            this.addSuccess(`Reply from ${host}: bytes=32 time=12ms TTL=64`);
            this.addSuccess(`Reply from ${host}: bytes=32 time=15ms TTL=64`);
            this.addSuccess(`Reply from ${host}: bytes=32 time=11ms TTL=64`);
            this.addSuccess(`Reply from ${host}: bytes=32 time=13ms TTL=64`);
        },

        'ipconfig': function(args) {
            this.addOutput('<div class="output-header">Network Configuration:</div>');
            this.addOutput('<div class="output-property">Host:</div><div class="output-value">WigdosXP</div>');
            this.addOutput('<div class="output-property">IPv4:</div><div class="output-value">192.168.1.100</div>');
            this.addOutput('<div class="output-property">Subnet:</div><div class="output-value">255.255.255.0</div>');
            this.addOutput('<div class="output-property">Gateway:</div><div class="output-value">192.168.1.1</div>');
            this.addOutput('<div class="output-property">DNS:</div><div class="output-value">8.8.8.8</div>');
        },

        'netstat': function(args) {
            this.addOutput('<div class="output-header">Active Connections:</div>');
            this.addText('Proto  Local Address          Foreign Address        State');
            this.addText('TCP    192.168.1.100:443      52.84.12.23:443       ESTABLISHED');
            this.addText('TCP    192.168.1.100:80       93.184.216.34:80      ESTABLISHED');
            this.addText('UDP    192.168.1.100:53       *:*                   LISTENING');
        },

        // Text output
        'print': function(args) {
            this.commands['echo'].call(this, args);
        },

        'write': function(args) {
            this.commands['echo'].call(this, args);
        },

        // File operations with Firebase integration
        'touch': async function(args) {
            if (args.length === 0) {
                this.addError('touch: Missing filename');
                return;
            }
            const filename = args.join(' ');
            const username = (typeof user !== 'undefined' && user.username) ? user.username : localStorage.getItem('username') || 'guest';
            const path = this.currentPath + '\\' + filename;
            
            try {
                await this.saveUserFile(username, path, {
                    type: 'file',
                    content: '',
                    size: 0,
                    created: Date.now(),
                    modified: Date.now()
                });
                this.addSuccess(`Created: ${filename}`);
            } catch (error) {
                this.addError(`touch: ${error.message}`);
            }
        },

        'mkdir': async function(args) {
            if (args.length === 0) {
                this.addError('mkdir: Missing directory name');
                return;
            }
            const dirname = args.join(' ');
            const username = (typeof user !== 'undefined' && user.username) ? user.username : localStorage.getItem('username') || 'guest';
            const path = this.currentPath + '\\' + dirname;
            
            try {
                await this.saveUserFile(username, path, {
                    type: 'folder',
                    created: Date.now()
                });
                this.addSuccess(`Created directory: ${dirname}`);
            } catch (error) {
                this.addError(`mkdir: ${error.message}`);
            }
        },

        'rm': async function(args) {
            if (args.length === 0) {
                this.addError('rm: Missing filename');
                return;
            }
            const filename = args.join(' ');
            const username = (typeof user !== 'undefined' && user.username) ? user.username : localStorage.getItem('username') || 'guest';
            const path = this.currentPath + '\\' + filename;
            
            try {
                await this.deleteUserFile(username, path);
                this.addSuccess(`Removed: ${filename}`);
            } catch (error) {
                this.addError(`rm: ${error.message}`);
            }
        },

        'mv': async function(args) {
            if (args.length < 2) {
                this.addError('mv: Usage: mv [source] [destination]');
                return;
            }
            const username = (typeof user !== 'undefined' && user.username) ? user.username : localStorage.getItem('username') || 'guest';
            const sourcePath = this.currentPath + '\\' + args[0];
            const destPath = this.currentPath + '\\' + args[1];
            
            try {
                const fileData = await this.getUserFile(username, sourcePath);
                if (fileData) {
                    await this.saveUserFile(username, destPath, fileData);
                    await this.deleteUserFile(username, sourcePath);
                    this.addSuccess(`Moved ${args[0]} to ${args[1]}`);
                } else {
                    this.addError(`mv: ${args[0]} not found`);
                }
            } catch (error) {
                this.addError(`mv: ${error.message}`);
            }
        },

        'write-file': async function(args) {
            if (args.length < 2) {
                this.addError('write-file: Usage: write-file [filename] [content]');
                return;
            }
            const filename = args[0];
            const content = args.slice(1).join(' ');
            const username = (typeof user !== 'undefined' && user.username) ? user.username : localStorage.getItem('username') || 'guest';
            const path = this.currentPath + '\\' + filename;
            
            try {
                await this.saveUserFile(username, path, {
                    type: 'file',
                    content: content,
                    size: content.length,
                    created: Date.now(),
                    modified: Date.now()
                });
                this.addSuccess(`Wrote ${content.length} characters to ${filename}`);
            } catch (error) {
                this.addError(`write-file: ${error.message}`);
            }
        },

        'cp': async function(args) {
            if (args.length < 2) {
                this.addError('cp: Usage: cp [source] [destination]');
                return;
            }
            const username = (typeof user !== 'undefined' && user.username) ? user.username : localStorage.getItem('username') || 'guest';
            const sourcePath = this.currentPath + '\\' + args[0];
            const destPath = this.currentPath + '\\' + args[1];
            
            try {
                const fileData = await this.getUserFile(username, sourcePath);
                if (fileData) {
                    const copyData = { ...fileData, created: Date.now(), modified: Date.now() };
                    await this.saveUserFile(username, destPath, copyData);
                    this.addSuccess(`Copied ${args[0]} to ${args[1]}`);
                } else {
                    this.addError(`cp: ${args[0]} not found`);
                }
            } catch (error) {
                this.addError(`cp: ${error.message}`);
            }
        },

        'cat': async function(args) {
            if (args.length === 0) {
                this.addError('cat: Missing filename');
                return;
            }
            const filename = args[0];
            const username = (typeof user !== 'undefined' && user.username) ? user.username : localStorage.getItem('username') || 'guest';
            const path = this.currentPath + '\\' + filename;
            
            try {
                const fileData = await this.getUserFile(username, path);
                if (fileData && fileData.type === 'file') {
                    this.addText(fileData.content || '[Empty file]');
                } else {
                    this.addError(`cat: ${filename} is not a file or does not exist`);
                }
            } catch (error) {
                this.addError(`cat: ${error.message}`);
            }
        },

        // System commands
        'exit': function(args) {
            this.addSuccess('Closing WigShell...');
            setTimeout(() => {
                if (typeof window.parent !== 'undefined' && window.parent.closeWindow) {
                    window.parent.closeWindow();
                } else {
                    this.addWarning('Cannot close window automatically');
                }
            }, 500);
        },

        'quit': function(args) {
            this.commands['exit'].call(this, args);
        },

        'restart': function(args) {
            this.addSuccess('Restarting WigShell...');
            setTimeout(() => {
                window.location.reload();
            }, 500);
        },

        'reload': function(args) {
            this.commands['restart'].call(this, args);
        },

        // Search
        'find': function(args) {
            if (args.length === 0) {
                this.addError('find: Missing search term');
                return;
            }
            const term = args.join(' ');
            this.addText(`Searching for: ${term}`);
            this.addWarning('find: Command not fully implemented');
        },

        'grep': function(args) {
            this.commands['find'].call(this, args);
        },

        'search': function(args) {
            this.commands['find'].call(this, args);
        },

        // Sleep/Wait
        'sleep': function(args) {
            const seconds = args.length > 0 ? parseInt(args[0]) : 1;
            this.addText(`Sleeping for ${seconds} second(s)...`);
            setTimeout(() => {
                this.addSuccess('Done');
            }, seconds * 1000);
        },

        'wait': function(args) {
            this.commands['sleep'].call(this, args);
        },

        // Comparison
        'diff': function(args) {
            if (args.length < 2) {
                this.addError('diff: Usage: diff [string1] [string2]');
                return;
            }
            if (args[0] === args[1]) {
                this.addSuccess('Strings are identical');
            } else {
                this.addText('Strings are different');
            }
        },

        'compare': function(args) {
            this.commands['diff'].call(this, args);
        },

        // Count
        'count': function(args) {
            if (args.length === 0) {
                this.addText('Count: 0');
                return;
            }
            this.addText(`Count: ${args.length} items`);
            args.forEach((item, index) => {
                this.addText(`  ${index + 1}. ${item}`);
            });
        },

        'wc': function(args) {
            const text = args.join(' ');
            const words = text.split(/\s+/).filter(w => w.length > 0);
            const chars = text.length;
            this.addText(`Words: ${words.length}  Characters: ${chars}`);
        },

        // Environment
        'env': function(args) {
            this.addOutput('<div class="output-header">Environment Variables:</div>');
            this.addOutput('<div class="output-property">PATH:</div><div class="output-value">C:\\WigdosXP\\System32</div>');
            this.addOutput('<div class="output-property">HOME:</div><div class="output-value">C:\\WigdosXP\\Users\\' + (typeof user !== 'undefined' ? user.username : 'Guest') + '</div>');
            this.addOutput('<div class="output-property">SHELL:</div><div class="output-value">WigShell</div>');
            this.addOutput('<div class="output-property">TEMP:</div><div class="output-value">C:\\WigdosXP\\Temp</div>');
        },

        'path': function(args) {
            this.addText('C:\\WigdosXP\\System32');
            this.addText('C:\\WigdosXP\\Apps');
            this.addText('C:\\WigdosXP\\Users\\' + (typeof user !== 'undefined' ? user.username : 'Guest'));
        },

        // Aliases
        'alias': function(args) {
            this.addOutput('<div class="output-header">Common Aliases:</div>');
            this.addText('cls = clear');
            this.addText('ls = dir = apps');
            this.addText('start = open = run');
            this.addText('whoami = user');
            this.addText('calc = math');
            this.addText('random = rand');
            this.addText('print = write = echo');
            this.addText('quit = exit');
            this.addText('reload = restart');
            this.addText('grep = find = search');
            this.addText('wait = sleep');
            this.addText('compare = diff');
        },

        // Tree view
        'tree': async function(args) {
            const username = (typeof user !== 'undefined' && user.username) ? user.username : localStorage.getItem('username') || 'guest';
            
            this.addText(this.currentPath);
            
            // Check if we're in a user files directory
            if (this.currentPath.includes('My_Files') || this.currentPath.includes('Users')) {
                try {
                    const files = await this.listUserFiles(username, this.currentPath);
                    const entries = Object.entries(files);
                    
                    if (entries.length === 0) {
                        this.addText('└── (empty)');
                        return;
                    }
                    
                    entries.forEach(([name, data], index) => {
                        const isLast = index === entries.length - 1;
                        const prefix = isLast ? '└── ' : '├── ';
                        const type = data.type === 'folder' ? '📁 ' : '📄 ';
                        this.addText(prefix + type + name);
                    });
                } catch (error) {
                    this.addError(`tree: ${error.message}`);
                }
            } else {
                // Static tree for system directories
                this.addText('├── Apps');
                this.addText('│   ├── Browser');
                this.addText('│   ├── Files');
                this.addText('│   ├── Games');
                this.addText('│   └── Terminal');
                this.addText('├── System32');
                this.addText('├── Users');
                this.addText('│   └── ' + username);
                this.addText('├── My_Files');
                this.addText('└── Temp');
            }
        },

        // Commands list
        'commands': function(args) {
            const cmdList = Object.keys(this.commands).sort();
            this.addOutput('<div class="output-header">All Available Commands (' + cmdList.length + '):</div>');
            let output = '';
            for (let i = 0; i < cmdList.length; i += 5) {
                const row = cmdList.slice(i, i + 5);
                output += '<div class="output-text">' + row.map(cmd => cmd.padEnd(15, ' ')).join('') + '</div>';
            }
            this.addOutput(output);
            this.addText('');
            this.addText('Type "help [command]" for more info');
        },

        // About
        'about': function(args) {
            this.addOutput('<div class="output-header">About WigShell:</div>');
            this.addText('WigShell v1.0 - PowerShell for WigdosXP');
            this.addText('A terminal emulator with PowerShell-like features');
            this.addText('');
            this.addText('Features:');
            this.addText('  • 80+ built-in commands');
            this.addText('  • Case-insensitive command execution');
            this.addText('  • Command history (Up/Down arrows)');
            this.addText('  • Tab completion');
            this.addText('  • Variable management');
            this.addText('  • WigdosXP application integration');
            this.addText('');
            this.addText('Type "help" for available commands');
        },

        'info': function(args) {
            this.commands['about'].call(this, args);
        }
    };

    commandHelp = {
        'help': '<div class="output-text"><strong>help</strong><br>Displays help information about commands.<br>Usage: help [command-name]</div>',
        'clear': '<div class="output-text"><strong>clear</strong> (alias: cls)<br>Clears the terminal screen.</div>',
        'cls': '<div class="output-text"><strong>cls</strong> (alias: clear)<br>Clears the terminal screen.</div>',
        'echo': '<div class="output-text"><strong>echo</strong> (alias: print, write)<br>Displays text.<br>Usage: echo [text]</div>',
        'date': '<div class="output-text"><strong>date</strong> (alias: time)<br>Shows the current date and time.</div>',
        'time': '<div class="output-text"><strong>time</strong> (alias: date)<br>Shows the current date and time.</div>',
        'pwd': '<div class="output-text"><strong>pwd</strong><br>Shows the current directory path.</div>',
        'cd': '<div class="output-text"><strong>cd</strong><br>Changes the current directory.<br>Usage: cd [path]<br>Examples: cd .., cd ~, cd Apps, cd My_Files<br>Use cd without arguments to return to home (C:\\WigdosXP)</div>'
        'apps': '<div class="output-text"><strong>apps</strong> (alias: ps)<br>Lists all installed WigdosXP applications.</div>'
        'ls': '<div class="output-text"><strong>ls</strong> (alias: dir)<br>Lists files in current directory.<br>Use ls -a or ls --apps to list applications instead.</div>'
        'dir': '<div class="output-text"><strong>dir</strong> (alias: apps, ls)<br>Lists all installed WigdosXP applications.</div>',
        'start': '<div class="output-text"><strong>start</strong> (alias: open, run)<br>Launches a WigdosXP application.<br>Usage: start [appId]<br>Example: start rBrowser</div>',
        'open': '<div class="output-text"><strong>open</strong> (alias: start, run)<br>Launches a WigdosXP application.<br>Usage: open [appId]</div>',
        'run': '<div class="output-text"><strong>run</strong> (alias: start, open)<br>Launches a WigdosXP application.<br>Usage: run [appId]</div>',
        'whoami': '<div class="output-text"><strong>whoami</strong> (alias: user)<br>Shows information about the current user.</div>',
        'user': '<div class="output-text"><strong>user</strong> (alias: whoami)<br>Shows information about the current user.</div>',
        'vars': '<div class="output-text"><strong>vars</strong><br>Displays all defined variables.</div>',
        'history': '<div class="output-text"><strong>history</strong><br>Shows command history for this session.</div>',
        'version': '<div class="output-text"><strong>version</strong><br>Shows WigShell version information.</div>',
        'hostname': '<div class="output-text"><strong>hostname</strong><br>Shows the system hostname.</div>',
        'color': '<div class="output-text"><strong>color</strong><br>Tests all available color output types.</div>',
        'set': '<div class="output-text"><strong>set</strong><br>Create or update a variable.<br>Usage: set [name] [value]<br>Example: set myvar hello world</div>',
        'get': '<div class="output-text"><strong>get</strong><br>Display a variable value.<br>Usage: get [name]<br>Example: get myvar</div>',
        'unset': '<div class="output-text"><strong>unset</strong><br>Remove a variable.<br>Usage: unset [name]</div>',
        'calc': '<div class="output-text"><strong>calc</strong> (alias: math)<br>Calculate mathematical expressions.<br>Usage: calc [expression]<br>Example: calc 5 + 3 * 2</div>',
        'math': '<div class="output-text"><strong>math</strong> (alias: calc)<br>Calculate mathematical expressions.</div>',
        'random': '<div class="output-text"><strong>random</strong> (alias: rand)<br>Generate a random number.<br>Usage: random [max] or random [min] [max]</div>',
        'rand': '<div class="output-text"><strong>rand</strong> (alias: random)<br>Generate a random number.</div>',
        'sysinfo': '<div class="output-text"><strong>sysinfo</strong><br>Display system information.</div>',
        'uptime': '<div class="output-text"><strong>uptime</strong><br>Show session uptime.</div>',
        'ping': '<div class="output-text"><strong>ping</strong><br>Test network connectivity.<br>Usage: ping [host]</div>',
        'ipconfig': '<div class="output-text"><strong>ipconfig</strong><br>Display network configuration.</div>',
        'netstat': '<div class="output-text"><strong>netstat</strong><br>Display network connections.</div>',
        'touch': '<div class="output-text"><strong>touch</strong><br>Create a file.<br>Usage: touch [filename]<br>Files are saved to your user account.</div>',
        'mkdir': '<div class="output-text"><strong>mkdir</strong><br>Create a directory.<br>Usage: mkdir [dirname]<br>Folders are saved to your user account.</div>',
        'rm': '<div class="output-text"><strong>rm</strong><br>Remove a file.<br>Usage: rm [filename]</div>',
        'mv': '<div class="output-text"><strong>mv</strong><br>Move/rename a file.<br>Usage: mv [source] [dest]</div>',
        'cp': '<div class="output-text"><strong>cp</strong><br>Copy a file.<br>Usage: cp [source] [dest]</div>',
        'cat': '<div class="output-text"><strong>cat</strong><br>Display file contents.<br>Usage: cat [filename]</div>',
        'write-file': '<div class="output-text"><strong>write-file</strong><br>Write content to a file.<br>Usage: write-file [filename] [content]<br>Example: write-file hello.txt Hello World!</div>',
        'exit': '<div class="output-text"><strong>exit</strong> (alias: quit)<br>Close WigShell.</div>',
        'quit': '<div class="output-text"><strong>quit</strong> (alias: exit)<br>Close WigShell.</div>',
        'restart': '<div class="output-text"><strong>restart</strong> (alias: reload)<br>Restart WigShell.</div>',
        'reload': '<div class="output-text"><strong>reload</strong> (alias: restart)<br>Restart WigShell.</div>',
        'find': '<div class="output-text"><strong>find</strong> (alias: grep, search)<br>Search for text.<br>Usage: find [term]</div>',
        'grep': '<div class="output-text"><strong>grep</strong> (alias: find, search)<br>Search for text.</div>',
        'search': '<div class="output-text"><strong>search</strong> (alias: find, grep)<br>Search for text.</div>',
        'sleep': '<div class="output-text"><strong>sleep</strong> (alias: wait)<br>Pause for seconds.<br>Usage: sleep [seconds]</div>',
        'wait': '<div class="output-text"><strong>wait</strong> (alias: sleep)<br>Pause for seconds.</div>',
        'diff': '<div class="output-text"><strong>diff</strong> (alias: compare)<br>Compare two strings.<br>Usage: diff [string1] [string2]</div>',
        'compare': '<div class="output-text"><strong>compare</strong> (alias: diff)<br>Compare two strings.</div>',
        'count': '<div class="output-text"><strong>count</strong><br>Count items.<br>Usage: count [item1] [item2] ...</div>',
        'wc': '<div class="output-text"><strong>wc</strong><br>Count words and characters.<br>Usage: wc [text]</div>',
        'env': '<div class="output-text"><strong>env</strong><br>Display environment variables.</div>',
        'path': '<div class="output-text"><strong>path</strong><br>Display PATH variable.</div>',
        'alias': '<div class="output-text"><strong>alias</strong><br>Show command aliases.</div>',
        'tree': '<div class="output-text"><strong>tree</strong><br>Display directory tree structure.</div>',
        'commands': '<div class="output-text"><strong>commands</strong><br>List all available commands.</div>',
        'about': '<div class="output-text"><strong>about</strong> (alias: info)<br>Show information about WigShell.</div>',
        'info': '<div class="output-text"><strong>info</strong> (alias: about)<br>Show information about WigShell.</div>',
        'upper': '<div class="output-text"><strong>upper</strong><br>Convert text to uppercase.<br>Usage: upper [text]</div>',
        'lower': '<div class="output-text"><strong>lower</strong><br>Convert text to lowercase.<br>Usage: lower [text]</div>',
        'reverse': '<div class="output-text"><strong>reverse</strong><br>Reverse text.<br>Usage: reverse [text]</div>',
        'length': '<div class="output-text"><strong>length</strong><br>Get text length.<br>Usage: length [text]</div>',
        'ps': '<div class="output-text"><strong>ps</strong><br>List running processes (apps).</div>',
        'kill': '<div class="output-text"><strong>kill</strong><br>Terminate a process.<br>Usage: kill [id]</div>',
        'print': '<div class="output-text"><strong>print</strong> (alias: echo, write)<br>Display text.</div>',
        'write': '<div class="output-text"><strong>write</strong> (alias: echo, print)<br>Display text.</div>'
    };
}

// Initialize when document is ready
window.addEventListener('load', () => {
    window.wigShell = new WigShell();
});
