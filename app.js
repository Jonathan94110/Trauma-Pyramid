document.addEventListener('DOMContentLoaded', () => {
    // ══════════════════════════════════════
    // INITIAL DATA
    // ══════════════════════════════════════
    const initialCompanies = [
        "Alien Attack", "Devil Saviour", "XTransbots",
        "ToyWorld", "Zeta Toys", "KFC Toys", "Fans Toys",
        "Dream Star Toys", "Cang Toys", "TFC Toys", "01 Studio", "Perfect Effect",
        "Mastermind Creations", "DX9 Toys", "Planet X", "Generation Toy",
        "FansProject", "MakeToys", "Transart", "Iron Factory",
        "Transform Dream Wave", "DNA Design", "Magic Square",
        "Transform Element", "Dr Wu", "Fans Hobby", "Newage"
    ];

    // Category tags for companies
    const categoryMap = {
        "Fans Toys": "MP",
        "XTransbots": "MP",
        "Zeta Toys": "MP",
        "KFC Toys": "MP",
        "DX9 Toys": "MP",
        "Fans Hobby": "MP",
        "Transform Element": "MP",
        "Generation Toy": "MP",
        "FansProject": "MP",
        "MakeToys": "MP",
        "Transart": "MP",
        "Iron Factory": "Legends",
        "Newage": "Legends",
        "Magic Square": "Legends",
        "Dr Wu": "Legends",
        "DNA Design": "3P",
        "Perfect Effect": "3P",
        "01 Studio": "3P",
        "Dream Star Toys": "3P",
        "Planet X": "3P",
        "Mastermind Creations": "3P",
        "TFC Toys": "Combiners",
        "Devil Saviour": "Combiners",
        "Cang Toys": "Combiners",
        "ToyWorld": "Combiners",
        "Alien Attack": "Misc",
        "Transform Dream Wave": "Misc",
    };

    const categoryColors = {
        "MP": { cssClass: "cat-mp", color: "#ff6b35", label: "Masterpiece" },
        "Legends": { cssClass: "cat-legends", color: "#00d4aa", label: "Legends" },
        "3P": { cssClass: "cat-3p", color: "#b026ff", label: "3rd Party" },
        "Combiners": { cssClass: "cat-combiners", color: "#ff2676", label: "Combiners" },
        "Misc": { cssClass: "cat-misc", color: "#5a5a72", label: "Miscellaneous" },
    };

    const tierConfig = [
        { tier: 1, name: 'PURE AGONY',      score: 10, color: '#ff2626', verdict: 'AVOID',   verdictClass: 'verdict-avoid' },
        { tier: 2, name: 'AGGRAVATING',      score: 8,  color: '#ff26b0', verdict: 'CAUTION', verdictClass: 'verdict-caution' },
        { tier: 3, name: 'MANAGEABLE',       score: 6,  color: '#b026ff', verdict: 'OK',      verdictClass: 'verdict-ok' },
        { tier: 4, name: 'STANDARD ISSUE',   score: 4,  color: '#26d0ff', verdict: 'DECENT',  verdictClass: 'verdict-decent' },
        { tier: 5, name: 'PALATE CLEANSERS', score: 2,  color: '#26ff8a', verdict: 'BUY',     verdictClass: 'verdict-buy' },
        { tier: 6, name: 'NOT WORTH TALKING ABOUT', score: 0, color: '#5a5a72', verdict: 'SKIP', verdictClass: 'verdict-skip' },
    ];

    const tierNames = {};
    tierConfig.forEach(c => tierNames[c.tier] = c.name);

    // ══════════════════════════════════════
    // DOM REFERENCES
    // ══════════════════════════════════════
    const unassignedList = document.getElementById('unassigned-list');
    const inputField = document.getElementById('new-company-input');
    const addButton = document.getElementById('add-company-btn');
    const resetBtn = document.getElementById('reset-btn');
    const submitBtn = document.getElementById('submit-btn');
    const backBtn = document.getElementById('back-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const fsLabel = document.getElementById('fs-label');
    const muteBtn = document.getElementById('mute-btn');
    const muteLabel = document.getElementById('mute-label');
    const muteIconOn = document.getElementById('mute-icon-on');
    const muteIconOff = document.getElementById('mute-icon-off');
    const analyticsOverlay = document.getElementById('analytics-overlay');
    const undoBtn = document.getElementById('undo-btn');
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    const episodeInput = document.getElementById('episode-input');
    const timerDisplay = document.getElementById('timer-display');
    const timerStartBtn = document.getElementById('timer-start-btn');
    const timerResetBtn = document.getElementById('timer-reset-btn');
    const hostTabsContainer = document.getElementById('host-tabs');
    const addHostBtn = document.getElementById('add-host-btn');
    const screenshotBtn = document.getElementById('screenshot-btn');
    const csvExportBtn = document.getElementById('csv-export-btn');
    const shareBtn = document.getElementById('share-btn');
    const saveEpisodeBtn = document.getElementById('save-episode-btn');
    const h2hSelect1 = document.getElementById('h2h-select-1');
    const h2hSelect2 = document.getElementById('h2h-select-2');

    let draggingItem = null;
    let itemIdCounter = 0;
    let isMuted = false;

    // ══════════════════════════════════════
    // UNDO STACK
    // ══════════════════════════════════════
    const MAX_UNDO = 20;
    let undoStack = [];

    function captureState() {
        const state = { tiers: {}, unranked: [] };
        for (let t = 1; t <= 6; t++) {
            const zone = document.querySelector(`.tier-${t} .tier-dropzone`);
            state.tiers[t] = Array.from(zone.querySelectorAll('.draggable-item')).map(el => el.dataset.name);
        }
        state.unranked = Array.from(unassignedList.querySelectorAll('.draggable-item')).map(el => el.dataset.name);
        return JSON.parse(JSON.stringify(state));
    }

    function pushUndo() {
        const state = captureState();
        undoStack.push(state);
        if (undoStack.length > MAX_UNDO) {
            undoStack.shift();
        }
        updateUndoBtn();
    }

    function popUndo() {
        if (undoStack.length === 0) return;
        const state = undoStack.pop();
        restoreFromState(state);
        updateUndoBtn();
        updatePercentages();
        saveState();
    }

    function updateUndoBtn() {
        undoBtn.disabled = undoStack.length === 0;
    }

    undoBtn.addEventListener('click', () => {
        popUndo();
        playUndoSound();
    });

    // ══════════════════════════════════════
    // MULTI-HOST MODE
    // ══════════════════════════════════════
    const MAX_HOSTS = 5;
    let hosts = [{ name: 'Host 1', state: null }];
    let activeHostIndex = 0;

    function initHosts() {
        const saved = localStorage.getItem('traumaPyramid_hosts');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    hosts = parsed;
                }
            } catch (e) { /* ignore */ }
        }
        const savedActive = localStorage.getItem('traumaPyramid_activeHost');
        if (savedActive !== null) {
            activeHostIndex = parseInt(savedActive) || 0;
            if (activeHostIndex >= hosts.length) activeHostIndex = 0;
        }
        renderHostTabs();
    }

    function saveHosts() {
        localStorage.setItem('traumaPyramid_hosts', JSON.stringify(hosts));
        localStorage.setItem('traumaPyramid_activeHost', activeHostIndex.toString());
    }

    function renderHostTabs() {
        hostTabsContainer.innerHTML = '';
        hosts.forEach((host, idx) => {
            const tab = document.createElement('button');
            tab.className = 'host-tab' + (idx === activeHostIndex ? ' active' : '');
            tab.dataset.host = idx;
            tab.textContent = host.name;
            tab.addEventListener('click', () => switchHost(idx));
            tab.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                makeHostEditable(tab, idx);
            });
            hostTabsContainer.appendChild(tab);
        });
        addHostBtn.style.display = hosts.length >= MAX_HOSTS ? 'none' : '';
    }

    function makeHostEditable(tab, idx) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'host-tab-input';
        input.value = hosts[idx].name;
        input.maxLength = 12;
        tab.textContent = '';
        tab.appendChild(input);
        input.focus();
        input.select();

        const finish = () => {
            const newName = input.value.trim() || hosts[idx].name;
            hosts[idx].name = newName;
            saveHosts();
            renderHostTabs();
        };

        input.addEventListener('blur', finish);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
            if (e.key === 'Escape') { input.value = hosts[idx].name; input.blur(); }
        });
    }

    function switchHost(idx) {
        if (idx === activeHostIndex) return;
        // Save current host state
        hosts[activeHostIndex].state = captureState();
        activeHostIndex = idx;
        // Load new host state
        if (hosts[idx].state) {
            restoreFromState(hosts[idx].state);
        } else {
            clearPyramid();
            initialCompanies.forEach(name => createDraggableItem(name, unassignedList));
        }
        undoStack = [];
        updateUndoBtn();
        updatePercentages();
        saveHosts();
        saveState();
        renderHostTabs();
    }

    addHostBtn.addEventListener('click', () => {
        if (hosts.length >= MAX_HOSTS) return;
        // Save current host
        hosts[activeHostIndex].state = captureState();
        const newIdx = hosts.length;
        hosts.push({ name: `Host ${newIdx + 1}`, state: null });
        activeHostIndex = newIdx;
        clearPyramid();
        initialCompanies.forEach(name => createDraggableItem(name, unassignedList));
        undoStack = [];
        updateUndoBtn();
        updatePercentages();
        saveHosts();
        saveState();
        renderHostTabs();
    });

    function clearPyramid() {
        for (let t = 1; t <= 6; t++) {
            const zone = document.querySelector(`.tier-${t} .tier-dropzone`);
            zone.innerHTML = '';
        }
        unassignedList.innerHTML = '';
    }

    function restoreFromState(state) {
        clearPyramid();
        (state.unranked || []).forEach(name => createDraggableItem(name, unassignedList));
        for (let t = 1; t <= 6; t++) {
            const zone = document.querySelector(`.tier-${t} .tier-dropzone`);
            (state.tiers[t] || []).forEach(name => createDraggableItem(name, zone));
        }
    }

    // ══════════════════════════════════════
    // SOUND EFFECTS (Web Audio API)
    // ══════════════════════════════════════
    let audioCtx = null;

    function getAudioCtx() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtx;
    }

    function playTierSound(tierNum) {
        if (isMuted) return;
        const ctx = getAudioCtx();
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime;
        switch (tierNum) {
            case 1: playTone(150, 'sawtooth', 0.3, 0.25, now); playTone(100, 'sawtooth', 0.3, 0.25, now + 0.12); playTone(80, 'square', 0.2, 0.3, now + 0.24); break;
            case 2: playTone(200, 'square', 0.2, 0.15, now); playTone(180, 'square', 0.2, 0.15, now + 0.1); break;
            case 3: playTone(400, 'sine', 0.15, 0.12, now); playTone(350, 'sine', 0.1, 0.1, now + 0.08); break;
            case 4: playTone(600, 'sine', 0.1, 0.06, now); break;
            case 5: playTone(523, 'sine', 0.15, 0.15, now); playTone(659, 'sine', 0.15, 0.15, now + 0.1); playTone(784, 'sine', 0.12, 0.2, now + 0.2); break;
            case 6: playTone(120, 'sine', 0.08, 0.1, now); break;
            default: playTone(500, 'sine', 0.05, 0.05, now);
        }
    }

    function playUndoSound() {
        if (isMuted) return;
        const ctx = getAudioCtx();
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime;
        playTone(600, 'sine', 0.1, 0.1, now);
        playTone(400, 'sine', 0.1, 0.1, now + 0.08);
    }

    function playTone(freq, type, volume, duration, startTime) {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
    }

    // Mute toggle
    muteBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        muteBtn.classList.toggle('muted', isMuted);
        muteLabel.textContent = isMuted ? 'SFX OFF' : 'SFX ON';
        muteIconOn.style.display = isMuted ? 'none' : '';
        muteIconOff.style.display = isMuted ? '' : 'none';
    });

    // ══════════════════════════════════════
    // TIMER
    // ══════════════════════════════════════
    const DEFAULT_TIMER_SECONDS = 120;
    let timerSeconds = DEFAULT_TIMER_SECONDS;
    let timerInterval = null;
    let timerRunning = false;

    function formatTimer(s) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
    }

    function updateTimerDisplay() {
        timerDisplay.textContent = formatTimer(timerSeconds);
        if (timerSeconds <= 0) {
            timerDisplay.classList.add('pulse');
        } else {
            timerDisplay.classList.remove('pulse');
        }
    }

    timerStartBtn.addEventListener('click', () => {
        if (timerRunning) {
            // Pause
            clearInterval(timerInterval);
            timerInterval = null;
            timerRunning = false;
            timerStartBtn.textContent = 'START';
        } else {
            // Start
            if (timerSeconds <= 0) timerSeconds = DEFAULT_TIMER_SECONDS;
            timerDisplay.classList.remove('pulse');
            timerRunning = true;
            timerStartBtn.textContent = 'PAUSE';
            timerInterval = setInterval(() => {
                timerSeconds--;
                updateTimerDisplay();
                if (timerSeconds <= 0) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                    timerRunning = false;
                    timerStartBtn.textContent = 'START';
                    timerDisplay.classList.add('pulse');
                    // Play alarm sound
                    if (!isMuted) {
                        const ctx = getAudioCtx();
                        if (ctx.state === 'suspended') ctx.resume();
                        const now = ctx.currentTime;
                        playTone(800, 'square', 0.2, 0.15, now);
                        playTone(600, 'square', 0.2, 0.15, now + 0.2);
                        playTone(800, 'square', 0.2, 0.15, now + 0.4);
                    }
                }
            }, 1000);
        }
    });

    timerResetBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        timerInterval = null;
        timerRunning = false;
        timerSeconds = DEFAULT_TIMER_SECONDS;
        timerStartBtn.textContent = 'START';
        timerDisplay.classList.remove('pulse');
        updateTimerDisplay();
    });

    updateTimerDisplay();

    // ══════════════════════════════════════
    // SEARCH / FILTER
    // ══════════════════════════════════════
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        searchClear.classList.toggle('visible', query.length > 0);
        const items = unassignedList.querySelectorAll('.draggable-item');
        items.forEach(item => {
            const name = (item.dataset.name || item.textContent).toLowerCase();
            if (query === '' || name.includes(query)) {
                item.classList.remove('hidden-by-search');
            } else {
                item.classList.add('hidden-by-search');
            }
        });
    });

    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.classList.remove('visible');
        const items = unassignedList.querySelectorAll('.draggable-item');
        items.forEach(item => item.classList.remove('hidden-by-search'));
    });

    // ══════════════════════════════════════
    // LOCALSTORAGE PERSISTENCE
    // ══════════════════════════════════════
    const STORAGE_KEY = 'traumaPyramid_state';
    const EPISODE_HISTORY_KEY = 'traumaPyramid_episodes';

    function saveState() {
        const state = captureState();
        // Also save custom companies
        const allNames = [...Object.values(state.tiers).flat(), ...state.unranked];
        state.custom = allNames.filter(name => !initialCompanies.includes(name));
        state.categories = {};
        allNames.forEach(name => {
            if (categoryMap[name]) state.categories[name] = categoryMap[name];
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        // Also save host state
        hosts[activeHostIndex].state = captureState();
        saveHosts();
    }

    function loadState() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;

        try {
            const state = JSON.parse(raw);
            if (!state.tiers || !state.unranked) return false;

            clearPyramid();

            // Restore categories for custom items
            if (state.categories) {
                Object.entries(state.categories).forEach(([name, cat]) => {
                    if (!categoryMap[name]) categoryMap[name] = cat;
                });
            }

            state.unranked.forEach(name => createDraggableItem(name, unassignedList));
            for (let t = 1; t <= 6; t++) {
                const zone = document.querySelector(`.tier-${t} .tier-dropzone`);
                (state.tiers[t] || []).forEach(name => createDraggableItem(name, zone));
            }

            updatePercentages();
            return true;
        } catch (e) {
            return false;
        }
    }

    function clearLocalState() {
        localStorage.removeItem(STORAGE_KEY);
    }

    // ══════════════════════════════════════
    // SHARE LINK (URL HASH)
    // ══════════════════════════════════════
    function loadFromHash() {
        if (!window.location.hash || window.location.hash.length < 2) return false;
        try {
            const encoded = window.location.hash.substring(1);
            const json = atob(encoded);
            const state = JSON.parse(json);
            if (!state.tiers) return false;
            clearPyramid();
            (state.unranked || []).forEach(name => createDraggableItem(name, unassignedList));
            for (let t = 1; t <= 6; t++) {
                const zone = document.querySelector(`.tier-${t} .tier-dropzone`);
                (state.tiers[t] || []).forEach(name => createDraggableItem(name, zone));
            }
            updatePercentages();
            saveState();
            // Clear hash
            history.replaceState(null, '', window.location.pathname);
            return true;
        } catch (e) {
            return false;
        }
    }

    // ══════════════════════════════════════
    // INITIALIZATION
    // ══════════════════════════════════════
    initHosts();

    let loaded = loadFromHash();
    if (!loaded) {
        loaded = loadState();
    }
    if (!loaded) {
        initialCompanies.forEach(company => {
            createDraggableItem(company, unassignedList);
        });
    }

    // ══════════════════════════════════════
    // DRAGGABLE ITEMS
    // ══════════════════════════════════════
    function createDraggableItem(name, container) {
        const item = document.createElement('div');
        item.classList.add('draggable-item');
        item.dataset.name = name;
        item.setAttribute('draggable', 'true');
        item.id = `item-${itemIdCounter++}`;

        // Category dot
        const cat = categoryMap[name];
        if (cat && categoryColors[cat]) {
            const dot = document.createElement('span');
            dot.className = 'cat-dot ' + categoryColors[cat].cssClass;
            dot.title = categoryColors[cat].label;
            item.appendChild(dot);
        }

        const textSpan = document.createElement('span');
        textSpan.textContent = name;
        item.appendChild(textSpan);

        // Drag events
        item.addEventListener('dragstart', (e) => {
            draggingItem = item;
            setTimeout(() => item.classList.add('dragging'), 0);
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', item.id);
        });

        item.addEventListener('dragend', () => {
            setTimeout(() => {
                draggingItem = null;
                item.classList.remove('dragging');
            }, 0);
        });

        // Double-click to delete from unranked panel
        item.addEventListener('dblclick', () => {
            const parent = item.parentElement;
            if (parent && parent.id === 'unassigned-list') {
                pushUndo();
                item.style.transform = 'scale(0)';
                item.style.opacity = '0';
                setTimeout(() => {
                    item.remove();
                    updatePercentages();
                    saveState();
                }, 200);
            }
        });

        container.appendChild(item);
    }

    // ══════════════════════════════════════
    // DROPZONE LOGIC
    // ══════════════════════════════════════
    function setupDropzones() {
        const dropzones = document.querySelectorAll('.tier-dropzone, .panel-dropzone');
        dropzones.forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.classList.add('drag-over');
            });

            zone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                zone.classList.remove('drag-over');
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('drag-over');
                if (draggingItem) {
                    pushUndo();
                    zone.appendChild(draggingItem);
                    updatePercentages();
                    saveState();
                    const tier = zone.closest('.tier');
                    playTierSound(tier ? parseInt(tier.dataset.tier) : 0);
                }
            });
        });
    }

    setupDropzones();

    // ══════════════════════════════════════
    // PERCENTAGES & COUNT BADGES
    // ══════════════════════════════════════
    function updatePercentages() {
        const tierDropzones = document.querySelectorAll('.tier-dropzone');
        let totalRanked = 0;
        tierDropzones.forEach(zone => {
            totalRanked += zone.querySelectorAll('.draggable-item').length;
        });

        for (let t = 1; t <= 6; t++) {
            const zone = document.querySelector(`.tier-${t} .tier-dropzone`);
            const percentEl = document.querySelector(`.tier-percent[data-tier="${t}"]`);
            const countEl = document.querySelector(`.tier-count[data-tier="${t}"]`);
            const count = zone.querySelectorAll('.draggable-item').length;

            if (totalRanked === 0) {
                if (percentEl) {
                    percentEl.textContent = '0%';
                    percentEl.classList.remove('active');
                }
            } else {
                const pct = Math.round((count / totalRanked) * 100);
                if (percentEl) {
                    percentEl.textContent = pct + '%';
                    percentEl.classList.toggle('active', pct > 0);
                }
            }

            // Count badge
            if (countEl) {
                countEl.textContent = count > 0 ? `(${count})` : '';
            }
        }
    }

    // ══════════════════════════════════════
    // RESET
    // ══════════════════════════════════════
    resetBtn.addEventListener('click', () => {
        pushUndo();
        clearPyramid();
        initialCompanies.forEach(name => createDraggableItem(name, unassignedList));
        // Also re-add any custom companies that are not initial
        const currentState = hosts[activeHostIndex].state;
        if (currentState && currentState.custom) {
            currentState.custom.forEach(name => {
                if (!initialCompanies.includes(name)) {
                    createDraggableItem(name, unassignedList);
                }
            });
        }
        updatePercentages();
        clearLocalState();
    });

    // ══════════════════════════════════════
    // FULLSCREEN
    // ══════════════════════════════════════
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    });

    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            fsLabel.textContent = 'EXIT FS';
        } else {
            fsLabel.textContent = 'FULLSCREEN';
        }
    });

    // ══════════════════════════════════════
    // ADD NEW COMPANY
    // ══════════════════════════════════════
    function addNewCompany() {
        const value = inputField.value.trim();
        if (value) {
            pushUndo();
            createDraggableItem(value, unassignedList);
            inputField.value = '';
            inputField.focus();
            saveState();
        }
    }

    addButton.addEventListener('click', addNewCompany);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addNewCompany();
        }
    });

    // ══════════════════════════════════════
    // SUBMIT & ANALYZE
    // ══════════════════════════════════════
    submitBtn.addEventListener('click', () => {
        const data = gatherData();
        if (data.totalRanked === 0) {
            showToast('Rank at least one company before analyzing!');
            return;
        }
        renderAnalytics(data);
        analyticsOverlay.classList.add('active');
    });

    backBtn.addEventListener('click', () => {
        analyticsOverlay.classList.remove('active');
    });

    // ══════════════════════════════════════
    // GATHER DATA
    // ══════════════════════════════════════
    function gatherData() {
        const tiers = {};
        let totalRanked = 0;
        const allRanked = [];

        tierConfig.forEach(cfg => {
            const zone = document.querySelector(`.tier-${cfg.tier} .tier-dropzone`);
            const items = Array.from(zone.querySelectorAll('.draggable-item')).map(el => el.dataset.name);
            tiers[cfg.tier] = items;
            totalRanked += items.length;

            const count = items.length;
            items.forEach((name, idx) => {
                let positionScore;
                if (count <= 1) {
                    positionScore = cfg.score;
                } else {
                    positionScore = cfg.score + (1.8 * (count - 1 - idx) / (count - 1)) - 0.9;
                }
                positionScore = Math.round(positionScore * 10) / 10;
                allRanked.push({
                    name,
                    tier: cfg.tier,
                    score: positionScore,
                    baseScore: cfg.score,
                    color: cfg.color,
                    verdict: cfg.verdict,
                    verdictClass: cfg.verdictClass,
                    category: categoryMap[name] || null,
                });
            });
        });

        const unrankedCount = unassignedList.querySelectorAll('.draggable-item').length;
        const avgScore = totalRanked > 0 ? (allRanked.reduce((sum, r) => sum + r.score, 0) / totalRanked).toFixed(1) : 0;

        allRanked.sort((a, b) => b.score - a.score);

        return { tiers, totalRanked, unrankedCount, avgScore, allRanked };
    }

    // Gather data for a specific host by index (reads saved host state)
    function gatherDataForHost(hostIdx) {
        const hostState = hosts[hostIdx].state;
        if (!hostState) return null;
        const tiers = {};
        let totalRanked = 0;
        const allRanked = [];

        tierConfig.forEach(cfg => {
            const items = hostState.tiers[cfg.tier] || [];
            tiers[cfg.tier] = items;
            totalRanked += items.length;
            const count = items.length;
            items.forEach((name, idx) => {
                let positionScore;
                if (count <= 1) positionScore = cfg.score;
                else positionScore = cfg.score + (1.8 * (count - 1 - idx) / (count - 1)) - 0.9;
                positionScore = Math.round(positionScore * 10) / 10;
                allRanked.push({ name, tier: cfg.tier, score: positionScore, color: cfg.color, verdict: cfg.verdict, verdictClass: cfg.verdictClass });
            });
        });

        if (totalRanked === 0) return null;
        allRanked.sort((a, b) => b.score - a.score);
        return { tiers, totalRanked, allRanked };
    }

    // ══════════════════════════════════════
    // RENDER ANALYTICS
    // ══════════════════════════════════════
    function renderAnalytics(data) {
        // Summary stats
        document.getElementById('stat-total').textContent = data.totalRanked;
        document.getElementById('stat-unranked').textContent = data.unrankedCount;
        document.getElementById('stat-avg-score').textContent = data.avgScore;

        // Tier distribution chart
        const distChart = document.getElementById('tier-distribution-chart');
        distChart.innerHTML = '';
        tierConfig.forEach(cfg => {
            const count = data.tiers[cfg.tier].length;
            const pct = data.totalRanked > 0 ? Math.round((count / data.totalRanked) * 100) : 0;
            const row = document.createElement('div');
            row.className = 'dist-row';
            row.innerHTML = `
                <span class="dist-label">${cfg.name}</span>
                <div class="dist-bar-track">
                    <div class="dist-bar-fill" style="width: ${pct}%; background: ${cfg.color};">${pct > 8 ? pct + '%' : ''}</div>
                </div>
                <span class="dist-count">${count}</span>
            `;
            distChart.appendChild(row);
        });

        // Trauma score ranking
        const rankChart = document.getElementById('trauma-ranking-chart');
        rankChart.innerHTML = '';
        const maxScore = data.allRanked.length > 0 ? data.allRanked[0].score : 10;
        data.allRanked.forEach((item, i) => {
            const pct = maxScore > 0 ? (item.score / maxScore) * 100 : 0;
            const row = document.createElement('div');
            row.className = 'rank-row';
            row.innerHTML = `
                <span class="rank-position ${i < 3 ? 'top-3' : ''}">#${i + 1}</span>
                <span class="rank-name">${item.name}</span>
                <div class="rank-bar-track">
                    <div class="rank-bar-fill" style="width: ${pct}%; background: linear-gradient(90deg, ${item.color}, ${item.color}88);"></div>
                </div>
                <span class="rank-score" style="color: ${item.color};">${item.score}</span>
            `;
            rankChart.appendChild(row);
        });

        // Danger zone (tier 1 + 2)
        const dangerList = document.getElementById('danger-list');
        const dangerEmpty = document.getElementById('danger-empty');
        dangerList.innerHTML = '';
        const dangerItems = data.allRanked.filter(r => r.tier <= 2);
        if (dangerItems.length === 0) {
            dangerEmpty.classList.add('visible');
        } else {
            dangerEmpty.classList.remove('visible');
            dangerItems.forEach(item => {
                const tag = document.createElement('span');
                tag.className = 'tag-danger';
                tag.textContent = item.name;
                dangerList.appendChild(tag);
            });
        }

        // Safe buys (tier 4 + 5 + 6)
        const safeList = document.getElementById('safe-list');
        const safeEmpty = document.getElementById('safe-empty');
        safeList.innerHTML = '';
        const safeItems = data.allRanked.filter(r => r.tier >= 4);
        if (safeItems.length === 0) {
            safeEmpty.classList.add('visible');
        } else {
            safeEmpty.classList.remove('visible');
            safeItems.forEach(item => {
                const tag = document.createElement('span');
                tag.className = 'tag-safe';
                tag.textContent = item.name;
                safeList.appendChild(tag);
            });
        }

        // Category breakdown
        renderCategoryBreakdown(data);

        // Verdict table
        const verdictContainer = document.getElementById('verdict-table');
        verdictContainer.innerHTML = '';
        data.allRanked.forEach(item => {
            const row = document.createElement('div');
            row.className = `verdict-row ${item.verdictClass}`;
            row.innerHTML = `
                <span class="verdict-name">${item.name}</span>
                <span class="verdict-badge">${item.verdict}</span>
            `;
            verdictContainer.appendChild(row);
        });

        // Head-to-Head
        renderH2HSelects(data);

        // Most Controversial (multi-host)
        renderControversial();

        // Biggest Movers
        renderMovers(data);

        // Episode History
        renderEpisodeHistory();
    }

    // ══════════════════════════════════════
    // CATEGORY BREAKDOWN
    // ══════════════════════════════════════
    function renderCategoryBreakdown(data) {
        const container = document.getElementById('category-breakdown');
        container.innerHTML = '';

        const catStats = {};
        data.allRanked.forEach(item => {
            const cat = item.category || 'Misc';
            if (!catStats[cat]) catStats[cat] = { count: 0, totalScore: 0 };
            catStats[cat].count++;
            catStats[cat].totalScore += item.score;
        });

        Object.entries(categoryColors).forEach(([key, cfg]) => {
            const stats = catStats[key];
            if (!stats) return;
            const avg = (stats.totalScore / stats.count).toFixed(1);
            const el = document.createElement('div');
            el.className = 'cat-breakdown-item';
            el.innerHTML = `
                <div class="cat-breakdown-label"><span class="cat-breakdown-dot" style="background:${cfg.color};"></span> ${cfg.label}</div>
                <div class="cat-breakdown-count">${stats.count}</div>
                <div class="cat-breakdown-avg">Avg Score: ${avg}</div>
            `;
            container.appendChild(el);
        });

        if (container.children.length === 0) {
            container.innerHTML = '<div class="empty-state visible">No ranked companies with category tags.</div>';
        }
    }

    // ══════════════════════════════════════
    // HEAD-TO-HEAD COMPARISON
    // ══════════════════════════════════════
    function renderH2HSelects(data) {
        h2hSelect1.innerHTML = '<option value="">Select Company 1</option>';
        h2hSelect2.innerHTML = '<option value="">Select Company 2</option>';
        data.allRanked.forEach(item => {
            const opt1 = document.createElement('option');
            opt1.value = item.name;
            opt1.textContent = item.name;
            h2hSelect1.appendChild(opt1);

            const opt2 = document.createElement('option');
            opt2.value = item.name;
            opt2.textContent = item.name;
            h2hSelect2.appendChild(opt2);
        });

        const updateH2H = () => {
            const name1 = h2hSelect1.value;
            const name2 = h2hSelect2.value;
            const resultDiv = document.getElementById('h2h-result');
            resultDiv.innerHTML = '';

            if (!name1 || !name2 || name1 === name2) return;

            const item1 = data.allRanked.find(r => r.name === name1);
            const item2 = data.allRanked.find(r => r.name === name2);
            if (!item1 || !item2) return;

            [item1, item2].forEach(item => {
                const card = document.createElement('div');
                card.className = 'h2h-card';
                card.innerHTML = `
                    <div class="h2h-card-name" style="color:${item.color};">${item.name}</div>
                    <div class="h2h-card-tier">${tierNames[item.tier]}</div>
                    <div class="h2h-card-score" style="color:${item.color};">${item.score}</div>
                    <span class="h2h-card-verdict" style="background:${item.color}22; color:${item.color};">${item.verdict}</span>
                `;
                resultDiv.appendChild(card);
            });

            // Episode history for these two companies
            const episodes = loadEpisodeHistory();
            if (episodes.length > 0) {
                const histDiv = document.createElement('div');
                histDiv.className = 'h2h-history';
                histDiv.innerHTML = `<div class="h2h-history-title">EPISODE HISTORY</div>`;
                const recent = episodes.slice(-5);
                recent.forEach(ep => {
                    let tier1 = '-', tier2 = '-';
                    for (let t = 1; t <= 6; t++) {
                        if (ep.tiers[t] && ep.tiers[t].includes(name1)) tier1 = 'T' + t;
                        if (ep.tiers[t] && ep.tiers[t].includes(name2)) tier2 = 'T' + t;
                    }
                    const row = document.createElement('div');
                    row.className = 'h2h-history-row';
                    row.innerHTML = `
                        <span class="h2h-history-ep">${ep.episode || 'N/A'}</span>
                        <span>${name1}: ${tier1}</span>
                        <span>|</span>
                        <span>${name2}: ${tier2}</span>
                    `;
                    histDiv.appendChild(row);
                });
                resultDiv.appendChild(histDiv);
            }
        };

        h2hSelect1.addEventListener('change', updateH2H);
        h2hSelect2.addEventListener('change', updateH2H);
    }

    // ══════════════════════════════════════
    // MOST CONTROVERSIAL (Multi-Host)
    // ══════════════════════════════════════
    function renderControversial() {
        const card = document.getElementById('controversial-card');
        const list = document.getElementById('controversial-list');
        list.innerHTML = '';

        // Save current host state before comparison
        hosts[activeHostIndex].state = captureState();

        // Gather data from all hosts that have rankings
        const hostData = [];
        hosts.forEach((host, idx) => {
            const d = (idx === activeHostIndex) ? gatherData() : gatherDataForHost(idx);
            if (d && d.totalRanked > 0) {
                hostData.push({ name: host.name, idx, data: d });
            }
        });

        if (hostData.length < 2) {
            card.style.display = 'none';
            return;
        }

        card.style.display = '';

        // For each company, find tier for each host
        const allCompanies = new Set();
        hostData.forEach(hd => {
            hd.data.allRanked.forEach(r => allCompanies.add(r.name));
        });

        const controversialItems = [];
        allCompanies.forEach(company => {
            const placements = [];
            hostData.forEach(hd => {
                const found = hd.data.allRanked.find(r => r.name === company);
                if (found) {
                    placements.push({ hostName: hd.name, tier: found.tier });
                }
            });
            if (placements.length >= 2) {
                const tiers = placements.map(p => p.tier);
                const spread = Math.max(...tiers) - Math.min(...tiers);
                if (spread > 0) {
                    controversialItems.push({ name: company, placements, spread });
                }
            }
        });

        controversialItems.sort((a, b) => b.spread - a.spread);

        if (controversialItems.length === 0) {
            list.innerHTML = '<div class="empty-state visible">All hosts agree on rankings!</div>';
            return;
        }

        controversialItems.slice(0, 10).forEach(item => {
            const row = document.createElement('div');
            row.className = 'controversial-row';
            const hostsHtml = item.placements.map(p =>
                `<span class="controversial-host-badge">${p.hostName}: T${p.tier}</span>`
            ).join('');
            row.innerHTML = `
                <span class="controversial-name">${item.name}</span>
                <div class="controversial-hosts">${hostsHtml}</div>
                <span class="controversial-spread">Spread: ${item.spread}</span>
            `;
            list.appendChild(row);
        });
    }

    // ══════════════════════════════════════
    // BIGGEST MOVERS
    // ══════════════════════════════════════
    function renderMovers(data) {
        const list = document.getElementById('movers-list');
        const empty = document.getElementById('movers-empty');
        list.innerHTML = '';

        const episodes = loadEpisodeHistory();
        if (episodes.length === 0) {
            empty.classList.add('visible');
            return;
        }

        empty.classList.remove('visible');
        const lastEp = episodes[episodes.length - 1];

        // Build lookup: company -> tier in last episode
        const lastTiers = {};
        for (let t = 1; t <= 6; t++) {
            (lastEp.tiers[t] || []).forEach(name => {
                lastTiers[name] = t;
            });
        }

        const movers = [];
        data.allRanked.forEach(item => {
            if (lastTiers[item.name] !== undefined) {
                const oldTier = lastTiers[item.name];
                const newTier = item.tier;
                if (oldTier !== newTier) {
                    movers.push({
                        name: item.name,
                        oldTier,
                        newTier,
                        diff: oldTier - newTier, // positive = moved up (less trauma number = better)
                    });
                }
            }
        });

        movers.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

        if (movers.length === 0) {
            list.innerHTML = '<div class="empty-state visible">No tier changes since last saved episode.</div>';
            return;
        }

        movers.forEach(m => {
            const isUp = m.diff > 0; // Higher tier number -> less trauma, so moving from tier 1 to tier 3 is "up" (improvement)
            const row = document.createElement('div');
            row.className = 'mover-row';
            row.innerHTML = `
                <span class="mover-arrow ${isUp ? 'up' : 'down'}">${isUp ? '\u2191' : '\u2193'}</span>
                <span class="mover-name">${m.name}</span>
                <span class="mover-detail">T${m.oldTier} \u2192 T${m.newTier}</span>
            `;
            list.appendChild(row);
        });
    }

    // ══════════════════════════════════════
    // EPISODE HISTORY
    // ══════════════════════════════════════
    function loadEpisodeHistory() {
        try {
            const raw = localStorage.getItem(EPISODE_HISTORY_KEY);
            if (!raw) return [];
            return JSON.parse(raw);
        } catch (e) { return []; }
    }

    function saveEpisodeHistory(episodes) {
        // Max 50 episodes
        while (episodes.length > 50) episodes.shift();
        localStorage.setItem(EPISODE_HISTORY_KEY, JSON.stringify(episodes));
    }

    function saveCurrentEpisode() {
        const data = gatherData();
        if (data.totalRanked === 0) {
            showToast('Rank at least one company before saving an episode!');
            return;
        }

        const ep = episodeInput.value.trim() || 'Untitled';
        const now = new Date();
        const snapshot = {
            episode: ep,
            date: now.toISOString().split('T')[0],
            timestamp: now.getTime(),
            tiers: data.tiers,
            totalRanked: data.totalRanked,
            avgScore: data.avgScore,
        };

        const episodes = loadEpisodeHistory();
        episodes.push(snapshot);
        saveEpisodeHistory(episodes);
        showToast(`Episode "${ep}" saved!`);
        renderEpisodeHistory();
    }

    function renderEpisodeHistory() {
        const list = document.getElementById('episode-history-list');
        const empty = document.getElementById('history-empty');
        list.innerHTML = '';

        const episodes = loadEpisodeHistory();
        if (episodes.length === 0) {
            empty.classList.add('visible');
            return;
        }

        empty.classList.remove('visible');

        // Show most recent first
        const reversed = [...episodes].reverse();
        reversed.forEach((ep, idx) => {
            const row = document.createElement('div');
            row.className = 'episode-history-row';
            row.innerHTML = `
                <span class="ep-hist-tag">${ep.episode}</span>
                <span class="ep-hist-date">${ep.date}</span>
                <span class="ep-hist-ranked">${ep.totalRanked} ranked</span>
                <span class="ep-hist-avg">Avg: ${ep.avgScore}</span>
            `;
            row.title = 'Click to load this episode';
            row.addEventListener('click', () => {
                loadEpisodeSnapshot(ep);
            });
            list.appendChild(row);
        });
    }

    function loadEpisodeSnapshot(ep) {
        const state = {
            tiers: ep.tiers,
            unranked: [],
        };

        // Gather all ranked names
        const ranked = new Set();
        for (let t = 1; t <= 6; t++) {
            (ep.tiers[t] || []).forEach(name => ranked.add(name));
        }

        // All known companies minus ranked = unranked
        const allKnown = new Set([...initialCompanies]);
        const currentState = captureState();
        [...Object.values(currentState.tiers).flat(), ...currentState.unranked].forEach(n => allKnown.add(n));

        allKnown.forEach(name => {
            if (!ranked.has(name)) state.unranked.push(name);
        });

        pushUndo();
        restoreFromState(state);
        updatePercentages();
        saveState();

        showToast(`Loaded episode: ${ep.episode}`);

        // Refresh analytics if open
        const data = gatherData();
        renderAnalytics(data);
    }

    saveEpisodeBtn.addEventListener('click', saveCurrentEpisode);

    // ══════════════════════════════════════
    // SCREENSHOT EXPORT
    // ══════════════════════════════════════
    screenshotBtn.addEventListener('click', () => {
        const dashboard = document.getElementById('analytics-dashboard');
        if (typeof html2canvas === 'undefined') {
            showToast('html2canvas not loaded yet. Please try again.');
            return;
        }
        showToast('Capturing screenshot...');
        html2canvas(dashboard, {
            backgroundColor: '#0a0a0f',
            scale: 2,
            useCORS: true,
            logging: false,
        }).then(canvas => {
            const link = document.createElement('a');
            const ep = episodeInput.value.trim();
            const filename = ep ? `trauma-pyramid-${ep}.png` : 'trauma-pyramid-analytics.png';
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
            showToast('Screenshot downloaded!');
        }).catch(() => {
            showToast('Screenshot failed. Try again.');
        });
    });

    // ══════════════════════════════════════
    // CSV EXPORT
    // ══════════════════════════════════════
    csvExportBtn.addEventListener('click', () => {
        const data = gatherData();
        if (data.totalRanked === 0) {
            showToast('No ranked companies to export.');
            return;
        }

        let csv = 'Rank,Company,Tier,Score,Verdict\n';
        data.allRanked.forEach((item, i) => {
            const tierName = tierNames[item.tier] || '';
            csv += `${i + 1},"${item.name}","${tierName}",${item.score},"${item.verdict}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const ep = episodeInput.value.trim();
        const filename = ep ? `trauma-pyramid-${ep}.csv` : 'trauma-pyramid-export.csv';
        link.download = filename;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
        showToast('CSV exported!');
    });

    // ══════════════════════════════════════
    // SHARE LINK
    // ══════════════════════════════════════
    shareBtn.addEventListener('click', () => {
        const state = captureState();
        try {
            const json = JSON.stringify(state);
            const encoded = btoa(json);
            const url = window.location.origin + window.location.pathname + '#' + encoded;

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(() => {
                    showToast('Share link copied to clipboard!');
                }).catch(() => {
                    fallbackCopy(url);
                });
            } else {
                fallbackCopy(url);
            }
        } catch (e) {
            showToast('Failed to generate share link.');
        }
    });

    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            showToast('Share link copied to clipboard!');
        } catch (e) {
            showToast('Could not copy link. Check console.');
            console.log('Share URL:', text);
        }
        document.body.removeChild(ta);
    }

    // ══════════════════════════════════════
    // TOAST NOTIFICATION
    // ══════════════════════════════════════
    function showToast(message) {
        // Remove any existing toast
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }
});
