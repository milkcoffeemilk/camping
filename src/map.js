// Map configurations per floor
const floorConfigs = {
    1: { rows: 5, cols: 6 }, // 30 tiles
    2: { rows: 5, cols: 5 }, // 25 tiles
    3: { rows: 4, cols: 5 }, // 20 tiles
    4: { rows: 4, cols: 4 }, // 16 tiles
    5: { rows: 3, cols: 4 }, // 12 tiles
    6: { rows: 3, cols: 3 }  // 9 tiles
};

const tileTypes = [
    { type: 'property', weight: 90 },
    { type: 'tax', weight: 10 }
];

function generateMap(floor) {
    const config = floorConfigs[floor];
    if (!config) return null;

    const totalTiles = config.rows * config.cols;
    const tiles = [];

    for (let i = 0; i < totalTiles; i++) {
        if (i === 0) {
            tiles.push({ id: i, type: 'start', owner: null });
            continue;
        }

        // Randomly pick a tile type based on weight
        const rand = Math.random() * 100;
        let cumulativeWeight = 0;
        let selectedType = 'property';

        for (const t of tileTypes) {
            cumulativeWeight += t.weight;
            if (rand <= cumulativeWeight) {
                selectedType = t.type;
                break;
            }
        }

        let costOre = 0;
        let costWood = 0;
        if (selectedType === 'property') {
            costOre = Math.floor(Math.random() * 30) + 10;
            costWood = Math.floor(Math.random() * 20) + 5;
        }

        tiles.push({
            id: i,
            type: selectedType,
            owner: null,
            level: 1,
            cost: { ore: costOre, wood: costWood }
        });
    }

    return {
        floor: floor,
        config: config,
        tiles: tiles
    };
}

function renderMap(mapData, containerElement) {
    containerElement.innerHTML = '';
    
    // Set CSS grid template
    containerElement.style.gridTemplateColumns = `repeat(${mapData.config.cols}, 1fr)`;
    containerElement.style.gridTemplateRows = `repeat(${mapData.config.rows}, 1fr)`;

    mapData.tiles.forEach(tile => {
        const tileEl = document.createElement('div');
        tileEl.className = `tile glass-panel tile-${tile.type}`;
        tileEl.id = `tile-${tile.id}`;
        
        let icon = '';
        switch(tile.type) {
            case 'start': icon = '<i class="fas fa-flag-checkered text-yellow-400"></i>'; break;
            case 'property': icon = '<i class="fas fa-home"></i>'; break;
            case 'tax': icon = '<i class="fas fa-coins text-yellow-600"></i>'; break;
        }

        tileEl.style.cursor = 'pointer';
        tileEl.dataset.id = tile.id;
        
        tileEl.onclick = () => {
            if(window.sendTileClick) window.sendTileClick(tile.id);
        };

        let costHtml = '';
        let ownerHtml = '';
        if (!tile.owner) {
            if (tile.type === 'property') {
                costHtml = `<div class="tile-cost"><i class="fas fa-cube text-blue-400"></i>${tile.cost.ore} <i class="fas fa-tree text-green-400"></i>${tile.cost.wood}</div>`;
                ownerHtml = '<div class="tile-owner">無主之地</div>';
            }
        } else {
            const p = window.gameState && window.gameState.players ? window.gameState.players.find(x => x.id === tile.owner) : null;
            if (p) {
                ownerHtml = `<div class="tile-owner" style="color: ${p.color}; font-weight: bold; text-shadow: 0 0 5px rgba(0,0,0,0.8);">${p.name}</div>`;
            }
        }

        tileEl.innerHTML = `
            <div class="tile-content" style="pointer-events: none;">
                <span class="tile-id">${tile.id}</span>
                <div class="tile-icon">${icon}</div>
                ${costHtml}
                ${ownerHtml}
            </div>
        `;
        containerElement.appendChild(tileEl);
    });
}
