window.gameConfig = {
    upgradeBaseCost: { ore: 500, wood: 500, food: 500 }, // Multiplied by current floor
    quizReward: { ore: 20, wood: 20, food: 15 }
};

window.gameState = {
    currentFloor: 1,
    players: [],
    mapData: null,
    turnIndex: 0,
    interactionMode: 'normal',
    mergeSelection: []
};

function initGame(playersData) {
    console.log("Initializing Game... players:", playersData);
    
    gameState.players = [];
    
    // For single player fallback
    if (!playersData || typeof playersData === 'number') {
        playersData = [{ id: 'p1', name: '玩家 1', color: '#4F46E5', icon: 'fa-user' }];
    }
    
    playersData.forEach((pd, index) => {
        const p = {
            id: pd.id,
            name: pd.name,
            color: pd.color,
            icon: pd.icon || 'fa-user',
            customAvatar: pd.customAvatar || null,
            resources: { ore: 0, wood: 0, food: 0 },
            floor: 1,
            position: index === 0 ? 0 : 99,
            activeBuffs: [],
            mergedSets: [],
            movesSinceLastEvent: 0
        };
        gameState.players.push(p);
    });

    // Setup Map
    loadFloor(gameState.currentFloor);

    // Set start tile owner
    if (gameState.mapData && gameState.mapData.tiles.length > 0 && gameState.players.length > 0) {
        gameState.mapData.tiles[0].owner = gameState.players[0].id;
    }
    
    renderMap(gameState.mapData, document.getElementById('game-board'));
    placePlayersOnMap();
    
    // Start game loop (resource generation)
    setInterval(gameTick, 1000);
}

function loadFloor(floorNum) {
    gameState.mapData = generateMap(floorNum);
    const board = document.getElementById('game-board');
    
    if (gameState.players.length >= 2) {
        const lastIdx = gameState.mapData.tiles.length - 1;
        gameState.mapData.tiles[lastIdx].type = 'start';
        gameState.mapData.tiles[lastIdx].owner = gameState.players[1].id;
        
        // Ensure player object also has correct position
        gameState.players[1].position = lastIdx;
    }
    
    renderMap(gameState.mapData, board);
    updatePlayerStats();
    placePlayersOnMap();
}

function updatePlayerStats() {
    const statsContainer = document.getElementById('player-info');
    statsContainer.innerHTML = '';
    
    gameState.players.forEach(p => {
        checkFloorUpgrade(p);
        
        const card = document.createElement('div');
        card.className = 'stat-card mb-2';
        card.innerHTML = `
            <h4 style="color: ${p.color}">${p.name} (樓層: ${p.floor})</h4>
            <div class="resources mt-2">
                <div><i class="fas fa-cube"></i> 礦石: ${p.resources.ore}</div>
                <div><i class="fas fa-tree"></i> 木材: ${p.resources.wood}</div>
                <div><i class="fas fa-hamburger"></i> 食物: ${p.resources.food}</div>
            </div>
            ${p.activeBuffs.length > 0 ? `<div class="mt-2 text-sm text-yellow-400">裝備: ${p.activeBuffs.join(', ')}</div>` : ''}
        `;
        statsContainer.appendChild(card);
    });
}

function checkFloorUpgrade(player) {
    if (player.floor >= 6) return;
    
    const reqOre = window.gameConfig.upgradeBaseCost.ore * player.floor;
    const reqWood = window.gameConfig.upgradeBaseCost.wood * player.floor;
    const reqFood = window.gameConfig.upgradeBaseCost.food * player.floor;
    
    if (player.resources.ore >= reqOre && player.resources.wood >= reqWood && player.resources.food >= reqFood) {
        window.showGameMessage(player.id, `恭喜！您的資源已達標，成功升級至 ${player.floor + 1} 樓！\n消耗: ${reqOre} 礦, ${reqWood} 木, ${reqFood} 食物`);
        
        player.resources.ore -= reqOre;
        player.resources.wood -= reqWood;
        player.resources.food -= reqFood;
        
        player.floor++;
        gameState.currentFloor = player.floor;
        player.position = 0; // Reset to start
        loadFloor(gameState.currentFloor);
    }
}

function placePlayersOnMap() {
    // Remove all old player markers
    document.querySelectorAll('.player-marker').forEach(el => el.remove());

    gameState.players.forEach(p => {
        if (p.floor === gameState.currentFloor) {
            const tile = document.getElementById(`tile-${p.position}`);
            if (tile) {
                const marker = document.createElement('div');
                marker.className = 'player-marker';
                
                if (p.customAvatar) {
                    marker.style.border = `2px solid ${p.color}`;
                    marker.style.background = `url(${p.customAvatar}) center/cover no-repeat`;
                    // Clear default styles meant for fontawesome icons
                    marker.style.backgroundColor = 'transparent';
                    marker.innerHTML = '';
                } else {
                    marker.style.backgroundColor = p.color;
                    marker.innerHTML = `<i class="fas ${p.icon}"></i>`;
                }
                
                tile.appendChild(marker);
            }
        }
    });
    updateTileVisuals();
}

function getConnectedComponents(playerId) {
    const ownedTiles = gameState.mapData.tiles.filter(t => t.owner === playerId);
    const visited = new Set();
    const components = [];
    const config = gameState.mapData.config;

    for (let tile of ownedTiles) {
        if (!visited.has(tile.id)) {
            const comp = [];
            const queue = [tile.id];
            visited.add(tile.id);
            
            while (queue.length > 0) {
                const curr = queue.shift();
                comp.push(curr);
                
                const currRow = Math.floor(curr / config.cols);
                const currCol = curr % config.cols;

                const neighbors = [
                    [currRow - 1, currCol], [currRow + 1, currCol],
                    [currRow, currCol - 1], [currRow, currCol + 1]
                ];

                for (let [nr, nc] of neighbors) {
                    if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols) {
                        const nId = nr * config.cols + nc;
                        if (!visited.has(nId)) {
                            const nTile = gameState.mapData.tiles[nId];
                            if (nTile && nTile.owner === playerId) {
                                visited.add(nId);
                                queue.push(nId);
                            }
                        }
                    }
                }
            }
            components.push(comp);
        }
    }
    return components;
}

window.executeMerge = function(player) {
    // Legacy function, no longer used. See startMergeSelect instead.
};

window.startMergeSelect = function(player) {
    window.gameState.interactionMode = 'merge_select';
    window.gameState.mergeSelection = [];
    document.getElementById('merge-control-panel').classList.remove('hidden');
    updateTileVisuals();
};

window.cancelMerge = function() {
    window.gameState.interactionMode = 'normal';
    window.gameState.mergeSelection = [];
    document.getElementById('merge-control-panel').classList.add('hidden');
    updateTileVisuals();
};

window.confirmMerge = function(playerId = 'p1') {
    const p = window.gameState.players.find(x => x.id === playerId);
    const selection = window.gameState.mergeSelection;
    const config = window.gameState.mapData.config;
    
    if (selection.length < 4) {
        window.showGameMessage(playerId, "合併失敗：至少需要選取 2x2 (4格) 的範圍！");
        return;
    }
    
    // Check if it's a perfect square (2x2, 3x3, etc.)
    const root = Math.sqrt(selection.length);
    if (!Number.isInteger(root)) {
        window.showGameMessage(playerId, "合併失敗：選取範圍必須是完美的正方形 (例如 2x2, 3x3)！");
        return;
    }
    
    // Find boundaries
    let minR = Infinity, maxR = -Infinity;
    let minC = Infinity, maxC = -Infinity;
    
    for (let id of selection) {
        const r = Math.floor(id / config.cols);
        const c = id % config.cols;
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
    }
    
    // Check dimensions match the root
    if (maxR - minR + 1 !== root || maxC - minC + 1 !== root) {
        window.showGameMessage(playerId, "合併失敗：選取的格子形狀不符！必須是一個完整的正方形區域。");
        return;
    }
    
    // Verification passed!
    p.mergedSets.push([...selection]);
    window.showGameMessage(playerId, "合併成功！領地已升級為 3D 結構，資源產出獲得加成！");
    
    window.cancelMerge(); // Resets mode and updates visuals
};

function gameTick() {
    gameState.players.forEach(p => {
        let totalOre = 0;
        let totalWood = 0;
        let totalFood = 0;
        
        const ownedTiles = gameState.mapData.tiles.filter(t => t.owner === p.id);
        
        ownedTiles.forEach(tile => {
            let multiplier = 1;
            for (let set of p.mergedSets) {
                if (set.includes(tile.id)) {
                    multiplier = 1 + (set.length - 1) * 0.2;
                    break;
                }
            }
            const baseGain = 2; 
            totalOre += Math.floor(baseGain * multiplier);
            totalWood += Math.floor(baseGain * multiplier);
            totalFood += Math.floor(baseGain * multiplier);
        });
        
        if (totalOre > 0 || totalWood > 0 || totalFood > 0) {
            p.resources.ore += totalOre;
            p.resources.wood += totalWood;
            p.resources.food += totalFood;
            
            if (p.id === 'p1' && window.updatePlayerStats) {
                // Actually update for all players visually
                window.updatePlayerStats();
            }
        }
    });
}

function updateTileVisuals() {
    const config = gameState.mapData.config;
    const tiles = gameState.mapData.tiles;
    const p1 = gameState.players[0]; 
    if (!p1) return;
    
    // Clear old classes
    document.querySelectorAll('.tile').forEach(el => {
        el.classList.remove('tile-owned', 'merged-active', 'conn-top', 'conn-bottom', 'conn-left', 'conn-right', 'tile-selected');
        // Reset dynamic styles
        el.style.backgroundColor = '';
        el.style.borderColor = '';
    });

    tiles.forEach(tile => {
        const el = document.getElementById(`tile-${tile.id}`);
        if (!el) return;
        
        if (gameState.interactionMode === 'merge_select' && gameState.mergeSelection.includes(tile.id)) {
            el.classList.add('tile-selected');
        }

        if (tile.owner) {
            el.classList.add('tile-owned');
            
            const ownerObj = gameState.players.find(x => x.id === tile.owner);
            if (ownerObj) {
                // Add some transparency to the background color (Hex + Opacity)
                el.style.backgroundColor = ownerObj.color + '40'; // ~25% opacity
                el.style.borderColor = ownerObj.color;
            }
            
            let myMergedSet = null;
            if (tile.owner === p1.id && p1.mergedSets) {
                for (let set of p1.mergedSets) {
                    if (set.includes(tile.id)) {
                        myMergedSet = set;
                        break;
                    }
                }
            }
            
            if (myMergedSet) {
                el.classList.add('merged-active');
                
                const r = Math.floor(tile.id / config.cols);
                const c = tile.id % config.cols;

                if (r > 0 && myMergedSet.includes(tile.id - config.cols)) el.classList.add('conn-top');
                if (r < config.rows - 1 && myMergedSet.includes(tile.id + config.cols)) el.classList.add('conn-bottom');
                if (c > 0 && myMergedSet.includes(tile.id - 1)) el.classList.add('conn-left');
                if (c < config.cols - 1 && myMergedSet.includes(tile.id + 1)) el.classList.add('conn-right');
            }
        }
    });
}

// Grid Adjacency Check
function isAdjacentToOwned(playerId, targetId) {
    const config = gameState.mapData.config;
    const tiles = gameState.mapData.tiles;
    
    const targetRow = Math.floor(targetId / config.cols);
    const targetCol = targetId % config.cols;

    // Check if player owns any tile, or use the start tile (id 0) as a base if they own nothing
    let baseTiles = tiles.filter(t => t.owner === playerId);
    if (baseTiles.length === 0) {
        baseTiles = [tiles[0]];
    }

    for (let tile of baseTiles) {
        const oRow = Math.floor(tile.id / config.cols);
        const oCol = tile.id % config.cols;
        const dist = Math.abs(oRow - targetRow) + Math.abs(oCol - targetCol);
        if (dist === 1) return true;
    }
    
    // Also check player's current position just in case
    const playerPos = gameState.players.find(p => p.id === playerId)?.position;
    if (playerPos !== undefined) {
        const pRow = Math.floor(playerPos / config.cols);
        const pCol = playerPos % config.cols;
        if (Math.abs(pRow - targetRow) + Math.abs(pCol - targetCol) === 1) return true;
    }

    return false;
}

window.handleTileClick = function(tileId, playerId = 'p1') {
    const p = gameState.players.find(x => x.id === playerId);
    const targetTile = gameState.mapData.tiles[tileId];
    
    if (!p || !targetTile) return;

    if (gameState.interactionMode === 'merge_select') {
        if (targetTile.owner !== playerId) {
            window.showGameMessage(playerId, "只能選取您自己的領地！");
            return;
        }
        const selIdx = gameState.mergeSelection.indexOf(tileId);
        if (selIdx > -1) {
            gameState.mergeSelection.splice(selIdx, 1); // Deselect
        } else {
            gameState.mergeSelection.push(tileId); // Select
        }
        updateTileVisuals();
        return;
    }

    if (targetTile.owner === playerId || targetTile.type === 'start') {
        p.position = tileId;
        placePlayersOnMap();
        return;
    }

    if (isAdjacentToOwned(playerId, tileId)) {
        if (targetTile.owner !== playerId && targetTile.type !== 'start') {
            const costOre = targetTile.cost ? targetTile.cost.ore : 50;
            const costWood = targetTile.cost ? targetTile.cost.wood : 50;
            
            if (p.resources.ore >= costOre && p.resources.wood >= costWood) {
                p.resources.ore -= costOre;
                p.resources.wood -= costWood;
                targetTile.owner = playerId;
                p.position = tileId;
                
                const board = document.getElementById('game-board');
                renderMap(gameState.mapData, board);
                placePlayersOnMap();
                
                checkRandomMoveEvent(p);
                updatePlayerStats();
                
                if (targetTile.type !== 'property') {
                    checkTileEvent(p, targetTile); // Trigger event if any
                }
            } else {
                window.showGameMessage(playerId, `資源不足！佔領該領地需要 ${costOre} 礦石與 ${costWood} 木材。`);
                return;
            }
        } else {
            p.position = tileId;
            placePlayersOnMap();
            checkRandomMoveEvent(p);
            updatePlayerStats();
            if (targetTile.type !== 'property' && targetTile.type !== 'start') {
                checkTileEvent(p, targetTile);
            }
        }
    } else {
        window.showGameMessage(playerId, "只能移動到自己領地相鄰的一格內！");
    }
};

function checkRandomMoveEvent(player) {
    if (typeof checkAndTriggerEvent === 'function') {
        const eventTriggered = checkAndTriggerEvent(player);
        if (eventTriggered) {
            window.showGameMessage(player.id, `【突發事件】${eventTriggered.name}！\n${eventTriggered.description}`);
        }
    }
}

function checkTileEvent(player, tile) {
    if (tile.type === 'tax') {
        window.showGameMessage(player.id, "遭遇稅務局！扣除 20 礦石與木材。");
        player.resources.ore = Math.max(0, player.resources.ore - 20);
        player.resources.wood = Math.max(0, player.resources.wood - 20);
        updatePlayerStats();
    }
}

window.openPhysicsQuiz = function() {
    if (window.physicsSessionCount >= 20) {
        document.getElementById('modal-quiz').classList.add('hidden');
        return;
    }
    
    if (window.physicsSessionCount === 0 || !window.physicsSessionGains) {
        window.physicsSessionGains = { ore: 0, wood: 0, food: 0 };
        const msgEl = document.getElementById('quiz-msg');
        if (msgEl) msgEl.innerText = '準備好開始挑戰！';
    }
    
    if (typeof getRandomQuiz !== 'function') return;
    const quiz = getRandomQuiz();
    if (quiz) {
        gameState.currentQuiz = quiz;
        
        document.getElementById('quiz-counter').innerText = `第 ${window.physicsSessionCount + 1}/20 題`;
        document.getElementById('quiz-title').innerText = `[${quiz.subject}] ${quiz.title}`;
        document.getElementById('quiz-question').innerText = quiz.question;
        document.getElementById('opt-a').innerText = `A. ${quiz.optionA}`;
        document.getElementById('opt-b').innerText = `B. ${quiz.optionB}`;
        document.getElementById('opt-c').innerText = `C. ${quiz.optionC}`;
        document.getElementById('opt-d').innerText = `D. ${quiz.optionD}`;
        document.getElementById('modal-quiz').classList.remove('hidden');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const btnConfirmMerge = document.getElementById('btn-confirm-merge');
    if (btnConfirmMerge) btnConfirmMerge.addEventListener('click', () => window.confirmMerge('p1'));
    
    const btnCancelMerge = document.getElementById('btn-cancel-merge');
    if (btnCancelMerge) btnCancelMerge.addEventListener('click', window.cancelMerge);

    const btnOpenPhysics = document.getElementById('btn-open-physics');
    if(btnOpenPhysics) {
        btnOpenPhysics.addEventListener('click', () => {
            window.physicsSessionCount = 0;
            window.openPhysicsQuiz();
        });
    }

    const btnOpenShop = document.getElementById('btn-open-shop');
    if(btnOpenShop) {
        btnOpenShop.addEventListener('click', () => {
            if(window.openShopModal) window.openShopModal();
        });
    }

    const btnCloseShop = document.getElementById('btn-close-shop');
    if(btnCloseShop) {
        btnCloseShop.addEventListener('click', () => {
            document.getElementById('modal-shop').classList.add('hidden');
        });
    }

    document.querySelectorAll('.btn-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (typeof checkAnswer !== 'function') return;
            const selectedOpt = e.target.getAttribute('data-option');
            const isCorrect = checkAnswer(gameState.currentQuiz, selectedOpt);
            
            const p = gameState.players[0]; 
            const msgEl = document.getElementById('quiz-msg');
            
            if (isCorrect) {
                const gOre = window.gameConfig.quizReward.ore;
                const gWood = window.gameConfig.quizReward.wood;
                const gFood = window.gameConfig.quizReward.food;
                
                p.resources.ore += gOre;
                p.resources.wood += gWood;
                p.resources.food += gFood;
                
                window.physicsSessionGains.ore += gOre;
                window.physicsSessionGains.wood += gWood;
                window.physicsSessionGains.food += gFood;
                
                if (msgEl) {
                    msgEl.style.color = '#10B981';
                    msgEl.innerText = `答對了！獲得 礦石+${gOre} 木材+${gWood} 食物+${gFood}`;
                }
                
                updatePlayerStats();
                
                document.querySelectorAll('.btn-option').forEach(b => b.disabled = true);
                window.physicsSessionCount++;
                
                setTimeout(() => {
                    document.querySelectorAll('.btn-option').forEach(b => b.disabled = false);
                    if (window.physicsSessionCount >= 20) {
                        if (msgEl) msgEl.innerText = '恭喜！已完成 20 題精神時光屋挑戰！';
                        setTimeout(() => {
                            document.getElementById('modal-quiz').classList.add('hidden');
                        }, 1000);
                    } else {
                        window.openPhysicsQuiz(); 
                    }
                }, 400);
            } else {
                const shieldIdx = p.activeBuffs.indexOf('shield');
                if (shieldIdx > -1) {
                    p.activeBuffs.splice(shieldIdx, 1);
                    if (msgEl) {
                        msgEl.style.color = '#60A5FA';
                        msgEl.innerText = '答錯了！但安全氣囊卡抵擋了懲罰。';
                    }
                } else {
                    const lOre = 10;
                    const lWood = 10;
                    
                    p.resources.ore = Math.max(0, p.resources.ore - lOre);
                    p.resources.wood = Math.max(0, p.resources.wood - lWood);
                    p.resources.food = Math.max(0, p.resources.food - 10);
                    
                    window.physicsSessionGains.ore -= lOre;
                    window.physicsSessionGains.wood -= lWood;
                    window.physicsSessionGains.food -= 10;
                    
                    if (msgEl) {
                        msgEl.style.color = '#EF4444';
                        msgEl.innerText = `答錯了！扣除 礦石-${lOre} 木材-${lWood} 食物-10`;
                    }
                }
                updatePlayerStats();
                
                document.querySelectorAll('.btn-option').forEach(b => b.disabled = true);
                window.physicsSessionCount++;
                
                setTimeout(() => {
                    document.querySelectorAll('.btn-option').forEach(b => b.disabled = false);
                    if (window.physicsSessionCount >= 20) {
                        if (msgEl) {
                            msgEl.style.color = '#FBBF24';
                            msgEl.innerText = '挑戰結束！已完成 20 題。';
                        }
                        setTimeout(() => {
                            document.getElementById('modal-quiz').classList.add('hidden');
                        }, 1000);
                    } else {
                        window.openPhysicsQuiz();
                    }
                }, 400);
            }
        });
    });

    document.getElementById('btn-leave-quiz')?.addEventListener('click', () => {
        document.getElementById('modal-quiz').classList.add('hidden');
    });
});
