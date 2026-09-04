// Event Configuration (Can be tweaked easily)
const EventConfig = {
    baseProbability: 0.05,        // 5% chance on first move
    probabilityIncrease: 0.03,    // +3% chance for every move without an event
    maxProbability: 0.50          // Cap the maximum chance at 50%
};

// Placeholder events
const eventList = [
    { name: "運氣爆棚", description: "在路上撿到了 100 礦石！", effect: (p) => p.resources.ore += 100 },
    { name: "資源流失", description: "不小心掉進坑洞，損失了 50 食物。", effect: (p) => p.resources.food = Math.max(0, p.resources.food - 50) },
    { name: "靈光一閃", description: "突然領悟了數學的奧秘，獲得 20 數學積分。", effect: (p) => p.scores.math += 20 },
];

function checkAndTriggerEvent(player) {
    if (typeof player.movesSinceLastEvent === 'undefined') {
        player.movesSinceLastEvent = 0;
    }

    const currentProb = Math.min(
        EventConfig.baseProbability + (player.movesSinceLastEvent * EventConfig.probabilityIncrease),
        EventConfig.maxProbability
    );

    const rand = Math.random();
    if (rand < currentProb) {
        // Trigger Event
        const randomEvent = eventList[Math.floor(Math.random() * eventList.length)];
        
        // Execute effect
        randomEvent.effect(player);
        
        // Reset counter
        player.movesSinceLastEvent = 0;
        
        return randomEvent;
    } else {
        // No event, increase counter
        player.movesSinceLastEvent++;
        return null;
    }
}
