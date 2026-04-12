document.addEventListener('DOMContentLoaded', () => {
    // Initial dataset of companies
    const initialCompanies = [
        "Alien Attack", "Devil Saviour", "XTransbots",
        "ToyWorld", "Zeta Toys", "KFC Toys", "Fans Toys",
        "Dream Star Toys", "Cang Toys", "TFC Toys", "01 Studio", "Perfect Effect",
        "Mastermind Creations", "DX9 Toys", "Planet X", "Generation Toy",
        "FansProject", "MakeToys", "Transart", "Iron Factory",
        "Transform Dream Wave", "DNA Design", "Magic Square",
        "Transform Element", "Dr Wu", "Fans Hobby", "Newage"
    ];

    const tierConfig = [
        { tier: 1, name: 'PURE AGONY',      score: 10, color: '#ff2626', verdict: 'AVOID',   verdictClass: 'verdict-avoid' },
        { tier: 2, name: 'AGGRAVATING',      score: 8,  color: '#ff26b0', verdict: 'CAUTION', verdictClass: 'verdict-caution' },
        { tier: 3, name: 'MANAGEABLE',       score: 6,  color: '#b026ff', verdict: 'OK',      verdictClass: 'verdict-ok' },
        { tier: 4, name: 'STANDARD ISSUE',   score: 4,  color: '#26d0ff', verdict: 'DECENT',  verdictClass: 'verdict-decent' },
        { tier: 5, name: 'PALATE CLEANSERS', score: 2,  color: '#26ff8a', verdict: 'BUY',     verdictClass: 'verdict-buy' },
        { tier: 6, name: 'NOT WORTH TALKING ABOUT', score: 0, color: '#5a5a72', verdict: 'SKIP', verdictClass: 'verdict-skip' },
    ];

    const unassignedList = document.getElementById('unassigned-list');
    const inputField = document.getElementById('new-company-input');
    const addButton = document.getElementById('add-company-btn');
    const dropzones = document.querySelectorAll('.tier-dropzone, .panel-dropzone');
    const resetBtn = document.getElementById('reset-btn');
    const submitBtn = document.getElementById('submit-btn');
    const backBtn = document.getElementById('back-btn');
    const analyticsOverlay = document.getElementById('analytics-overlay');

    let draggingItem = null;
    let itemIdCounter = 0;

    // Initialize list
    initialCompanies.forEach(company => {
        createDraggableItem(company, unassignedList);
    });

    // Create a new draggable item
    function createDraggableItem(text, container) {
        const item = document.createElement('div');
        item.classList.add('draggable-item');
        item.textContent = text;
        item.setAttribute('draggable', 'true');
        item.id = `item-${itemIdCounter++}`;

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

        // Delete behavior: Double click to easily remove it when it's in the side panel
        item.addEventListener('dblclick', () => {
            const parent = item.parentElement;
            if (parent.id === 'unassigned-list') {
                item.style.transform = 'scale(0)';
                item.style.opacity = '0';
                setTimeout(() => {
                    item.remove();
                    updatePercentages();
                }, 200);
            }
        });

        container.appendChild(item);
    }

    // Dropzone logic
    dropzones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zonaHoverStyle(zone, true);
        });

        zone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            zonaHoverStyle(zone, false);
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zonaHoverStyle(zone, false);
            if (draggingItem) {
                zone.appendChild(draggingItem);
                updatePercentages();
            }
        });
    });

    function zonaHoverStyle(zone, active) {
        if (active) {
            zone.classList.add('drag-over');
        } else {
            zone.classList.remove('drag-over');
        }
    }

    // Update tier percentages based on ranked items
    function updatePercentages() {
        const tierDropzones = document.querySelectorAll('.tier-dropzone');
        let totalRanked = 0;
        tierDropzones.forEach(zone => {
            totalRanked += zone.querySelectorAll('.draggable-item').length;
        });

        document.querySelectorAll('.tier').forEach(tier => {
            const zone = tier.querySelector('.tier-dropzone');
            const percentEl = tier.querySelector('.tier-percent');
            const count = zone.querySelectorAll('.draggable-item').length;

            if (totalRanked === 0) {
                percentEl.textContent = '0%';
                percentEl.classList.remove('active');
            } else {
                const pct = Math.round((count / totalRanked) * 100);
                percentEl.textContent = pct + '%';
                percentEl.classList.toggle('active', pct > 0);
            }
        });
    }

    // ──────────────────────────────────────
    // RESET — move everything back to unranked
    // ──────────────────────────────────────
    resetBtn.addEventListener('click', () => {
        document.querySelectorAll('.tier-dropzone .draggable-item').forEach(item => {
            unassignedList.appendChild(item);
        });
        updatePercentages();
    });

    // ──────────────────────────────────────
    // SUBMIT & ANALYZE
    // ──────────────────────────────────────
    submitBtn.addEventListener('click', () => {
        const data = gatherData();
        if (data.totalRanked === 0) {
            alert('Rank at least one company before analyzing!');
            return;
        }
        renderAnalytics(data);
        analyticsOverlay.classList.add('active');
    });

    backBtn.addEventListener('click', () => {
        analyticsOverlay.classList.remove('active');
    });

    // Gather all ranking data
    function gatherData() {
        const tiers = {};
        let totalRanked = 0;
        const allRanked = [];

        tierConfig.forEach(cfg => {
            const zone = document.querySelector(`.tier-${cfg.tier} .tier-dropzone`);
            const items = Array.from(zone.querySelectorAll('.draggable-item')).map(el => el.textContent);
            tiers[cfg.tier] = items;
            totalRanked += items.length;

            items.forEach(name => {
                allRanked.push({ name, tier: cfg.tier, score: cfg.score, color: cfg.color, verdict: cfg.verdict, verdictClass: cfg.verdictClass });
            });
        });

        const unrankedCount = unassignedList.querySelectorAll('.draggable-item').length;
        const avgScore = totalRanked > 0 ? (allRanked.reduce((sum, r) => sum + r.score, 0) / totalRanked).toFixed(1) : 0;

        // Sort by score descending (most traumatic first)
        allRanked.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

        return { tiers, totalRanked, unrankedCount, avgScore, allRanked };
    }

    // Render all analytics views
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
        const maxScore = 10;
        data.allRanked.forEach((item, i) => {
            const pct = (item.score / maxScore) * 100;
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

        // Safe buys (tier 5 + 6)
        const safeList = document.getElementById('safe-list');
        const safeEmpty = document.getElementById('safe-empty');
        safeList.innerHTML = '';
        const safeItems = data.allRanked.filter(r => r.tier >= 5);
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
    }

    // Add entirely new company
    function addNewCompany() {
        const value = inputField.value.trim();
        if (value) {
            createDraggableItem(value, unassignedList);
            inputField.value = '';
            inputField.focus();
        }
    }

    addButton.addEventListener('click', addNewCompany);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addNewCompany();
        }
    });
});
