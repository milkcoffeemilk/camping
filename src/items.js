const shopItems = [
    { id: 'mergeCard', name: '領地合併卡', description: '立即將目前所有相鄰的領地永久合併，啟動立體防護罩與資源複利！', cost: { ore: 200, wood: 200 }, icon: 'fa-object-group', color: '#8B5CF6' },
    { id: 'doubleMove', name: '雙倍衝刺卡', description: '裝備後，下一題答對時移動效果翻倍。', cost: { ore: 150, wood: 0 }, icon: 'fa-bolt', color: '#FBBF24' },
    { id: 'shield', name: '安全氣囊卡', description: '裝備後，下一題答錯時可抵擋一次懲罰。', cost: { ore: 0, wood: 200 }, icon: 'fa-shield-alt', color: '#60A5FA' },
    { id: 'trap', name: '干擾卡', description: '立即發動，隨機指定一名對手倒退 1 格。', cost: { ore: 300, wood: 300 }, icon: 'fa-skull', color: '#F87171' }
];

function getHighestScoreSubject(player) {
    let max = -1;
    let subject = '';
    for (const [key, value] of Object.entries(player.scores)) {
        if (value > max) {
            max = value;
            subject = key;
        }
    }
    return { subject, score: max };
}

window.openShopModal = function() {
    const p1 = window.gameState.players[0]; // Assuming local player is p1
    if(!p1) return;

    const container = document.getElementById('shop-items-container');
    container.innerHTML = ''; // clear old

    shopItems.forEach(item => {
        let costStr = [];
        if (item.cost.ore) costStr.push(`${item.cost.ore} 礦`);
        if (item.cost.wood) costStr.push(`${item.cost.wood} 木`);
        
        const canAfford = p1.resources.ore >= (item.cost.ore || 0) && p1.resources.wood >= (item.cost.wood || 0);
        
        const div = document.createElement('div');
        div.className = 'glass-panel';
        div.style.padding = '1rem';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        
        div.innerHTML = `
            <div style="display:flex; gap: 1rem; align-items: center;">
                <div style="font-size: 2rem; color: ${item.color}; width: 40px; text-align: center;">
                    <i class="fas ${item.icon}"></i>
                </div>
                <div>
                    <h4 style="color: ${item.color}; margin-bottom: 0.25rem;">${item.name}</h4>
                    <p class="text-sm text-muted">${item.description}</p>
                </div>
            </div>
            <div style="text-align: right; min-width: 100px;">
                <div class="text-yellow-400 font-bold mb-1" style="font-size: 0.9rem;">${costStr.join(' + ')}</div>
                <button class="btn ${canAfford ? 'primary-btn' : 'secondary-btn'}" 
                        ${!canAfford ? 'disabled' : ''}
                        onclick="buyItem(window.gameState.players[0], '${item.id}')">
                    ${canAfford ? '購買' : '資源不足'}
                </button>
            </div>
        `;
        container.appendChild(div);
    });

    document.getElementById('modal-shop').classList.remove('hidden');
}

function buyItem(player, itemId) {
    const item = shopItems.find(i => i.id === itemId);
    const reqOre = item.cost.ore || 0;
    const reqWood = item.cost.wood || 0;

    if (player.resources.ore >= reqOre && player.resources.wood >= reqWood) {
        player.resources.ore -= reqOre;
        player.resources.wood -= reqWood;
        
        if (itemId === 'mergeCard') {
            if (window.startMergeSelect) window.startMergeSelect(player);
            window.showGameMessage(player.id, `成功裝備 ${item.name}！請在地圖上圈選要合併的領地。`);
            document.getElementById('modal-shop').classList.add('hidden');
        } else {
            player.activeBuffs.push(itemId);
            window.showGameMessage(player.id, `成功購買 ${item.name}！`);
        }
        
        if (window.updatePlayerStats) window.updatePlayerStats();
        openShopModal(); // Refresh UI
    } else {
        window.showGameMessage(player.id, '資源不足！');
    }
}
