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

    const unassignedList = document.getElementById('unassigned-list');
    const inputField = document.getElementById('new-company-input');
    const addButton = document.getElementById('add-company-btn');
    const dropzones = document.querySelectorAll('.tier-dropzone, .panel-dropzone');

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
