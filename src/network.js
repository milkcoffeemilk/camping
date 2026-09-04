// PeerJS Networking Logic
let peer = null;
let conn = null; // for guest
let hostConnections = []; // for host
let isHost = false;

window.myPlayerInfo = null;
window.otherPlayerInfo = null;

function updateReadyRoomUI() {
    if (!window.myPlayerInfo || !window.otherPlayerInfo) return;
    const p1 = isHost ? window.myPlayerInfo : window.otherPlayerInfo;
    const p2 = isHost ? window.otherPlayerInfo : window.myPlayerInfo;

    document.getElementById('rr-p1-name').innerText = p1.name;
    if (p1.customAvatar) {
        document.getElementById('rr-p1-avatar').innerHTML = `<img src="${p1.customAvatar}" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid ${p1.color}; object-fit: cover; display: inline-block; vertical-align: middle;">`;
    } else {
        document.getElementById('rr-p1-avatar').style.color = p1.color;
        document.getElementById('rr-p1-avatar').innerHTML = `<i class="fas ${p1.icon}"></i>`;
    }
    
    document.getElementById('rr-p1-status').innerText = p1.isReady ? '已準備' : '設定中...';
    document.getElementById('rr-p1-card').style.borderColor = p1.isReady ? '#10B981' : 'transparent';

    document.getElementById('rr-p2-name').innerText = p2.name;
    if (p2.customAvatar) {
        document.getElementById('rr-p2-avatar').innerHTML = `<img src="${p2.customAvatar}" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid ${p2.color}; object-fit: cover; display: inline-block; vertical-align: middle;">`;
    } else {
        document.getElementById('rr-p2-avatar').style.color = p2.color;
        document.getElementById('rr-p2-avatar').innerHTML = `<i class="fas ${p2.icon}"></i>`;
    }
    
    document.getElementById('rr-p2-status').innerText = p2.isReady ? '已準備' : '設定中...';
    document.getElementById('rr-p2-card').style.borderColor = p2.isReady ? '#10B981' : 'transparent';
    
    // Check if both ready (Host only logic to start game)
    if (isHost && p1.isReady && p2.isReady) {
        setTimeout(() => {
            window.initGame([p1, p2]);
            document.getElementById('view-lobby').classList.remove('active');
            document.getElementById('view-game').classList.add('active');
            
            // Start broadcasting state
            setInterval(() => {
                const statePacket = {
                    type: 'STATE_UPDATE',
                    state: window.gameState
                };
                hostConnections.forEach(conn => conn.send(statePacket));
            }, 1000);
        }, 1000);
    }
}

function bindReadyRoomInputs() {
    const btnReady = document.getElementById('btn-ready');
    
    // Toggle input visibility based on role
    if (isHost) {
        document.getElementById('rr-p1-display').classList.add('hidden');
        document.getElementById('rr-p1-inputs').classList.remove('hidden');
    } else {
        document.getElementById('rr-p2-display').classList.add('hidden');
        document.getElementById('rr-p2-inputs').classList.remove('hidden');
    }

    const iName = document.getElementById(isHost ? 'rr-p1-input-name' : 'rr-p2-input-name');
    const iColor = document.getElementById(isHost ? 'rr-p1-input-color' : 'rr-p2-input-color');
    const iIcon = document.getElementById(isHost ? 'rr-p1-input-icon' : 'rr-p2-input-icon');
    const iCustomAvatar = document.getElementById(isHost ? 'rr-p1-input-custom-avatar' : 'rr-p2-input-custom-avatar');
    
    const sendUpdate = () => {
        if(window.myPlayerInfo.isReady) return; 
        window.myPlayerInfo.name = iName.value;
        window.myPlayerInfo.color = iColor.value;
        window.myPlayerInfo.icon = iIcon.value;
        updateReadyRoomUI();
        if (conn && !isHost) conn.send({ type: 'PLAYER_UPDATE', info: window.myPlayerInfo });
        if (isHost && hostConnections[0]) hostConnections[0].send({ type: 'PLAYER_UPDATE', info: window.myPlayerInfo });
    };

    iName.addEventListener('input', sendUpdate);
    iColor.addEventListener('change', sendUpdate);
    iIcon.addEventListener('change', () => {
        window.myPlayerInfo.customAvatar = null;
        iCustomAvatar.value = '';
        sendUpdate();
    });
    
    iCustomAvatar.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 64;
                canvas.height = 64;
                const size = Math.min(img.width, img.height);
                const x = (img.width - size) / 2;
                const y = (img.height - size) / 2;
                ctx.drawImage(img, x, y, size, size, 0, 0, 64, 64);
                window.myPlayerInfo.customAvatar = canvas.toDataURL('image/jpeg', 0.8);
                sendUpdate();
            };
            img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
    });

    btnReady.addEventListener('click', () => {
        window.myPlayerInfo.isReady = !window.myPlayerInfo.isReady;
        btnReady.innerText = window.myPlayerInfo.isReady ? '取消準備' : '準備就緒 (Ready)';
        iName.disabled = window.myPlayerInfo.isReady;
        iColor.disabled = window.myPlayerInfo.isReady;
        iIcon.disabled = window.myPlayerInfo.isReady;
        iCustomAvatar.disabled = window.myPlayerInfo.isReady;
        updateReadyRoomUI();
        if (conn && !isHost) conn.send({ type: 'PLAYER_UPDATE', info: window.myPlayerInfo });
        if (isHost && hostConnections[0]) hostConnections[0].send({ type: 'PLAYER_UPDATE', info: window.myPlayerInfo });
    });
}

window.initNetworkAsHost = function() {
    isHost = true;
    window.myPlayerInfo = { id: 'p1', name: '玩家 1', color: '#4F46E5', icon: 'fa-user', isReady: false };
    window.otherPlayerInfo = { id: 'p2', name: '等待加入...', color: '#EF4444', icon: 'fa-user', isReady: false };
    
    // Generate a random 6-digit room code
    const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    peer = new Peer(roomCode);
    
    peer.on('open', (id) => {
        document.getElementById('lobby-main').classList.add('hidden');
        document.getElementById('lobby-waiting').classList.remove('hidden');
        document.getElementById('waiting-room-code').innerText = id;
    });

    peer.on('connection', (c) => {
        hostConnections.push(c);
        
        c.on('open', () => {
            if (hostConnections.length === 1) {
                document.getElementById('lobby-waiting').classList.add('hidden');
                document.getElementById('lobby-ready-room').classList.remove('hidden');
                bindReadyRoomInputs();
                updateReadyRoomUI();
                
                c.send({ type: 'LOBBY_STATE', hostInfo: window.myPlayerInfo });
            }
        });

        c.on('data', (data) => {
            if (data.type === 'TILE_CLICK') {
                window.handleTileClick(data.tileId, data.playerId);
            } else if (data.type === 'PLAYER_UPDATE') {
                window.otherPlayerInfo = data.info;
                updateReadyRoomUI();
            }
        });
    });
};

window.initNetworkAsGuest = function(roomId) {
    isHost = false;
    window.myPlayerInfo = { id: 'p2', name: '玩家 2', color: '#EF4444', icon: 'fa-user', isReady: false };
    window.otherPlayerInfo = { id: 'p1', name: '玩家 1', color: '#4F46E5', icon: 'fa-user', isReady: false };
    peer = new Peer();
    
    peer.on('open', (id) => {
        conn = peer.connect(roomId);
        
        conn.on('open', () => {
            document.getElementById('lobby-main').classList.add('hidden');
            document.getElementById('lobby-waiting').classList.remove('hidden');
            document.getElementById('waiting-room-code').innerText = "連線中...";
            
            conn.on('data', (data) => {
                if (data.type === 'LOBBY_STATE') {
                    window.otherPlayerInfo = data.hostInfo;
                    document.getElementById('lobby-waiting').classList.add('hidden');
                    document.getElementById('lobby-ready-room').classList.remove('hidden');
                    bindReadyRoomInputs();
                    updateReadyRoomUI();
                } else if (data.type === 'PLAYER_UPDATE') {
                    window.otherPlayerInfo = data.info;
                    updateReadyRoomUI();
                } else if (data.type === 'STATE_UPDATE') {
                    if (!document.getElementById('view-game').classList.contains('active')) {
                        document.getElementById('view-lobby').classList.remove('active');
                        document.getElementById('view-game').classList.add('active');
                    }
                    window.gameState = data.state;
                    
                    const board = document.getElementById('game-board');
                    if (board.children.length === 0 || window.gameState.currentFloor !== window.lastRenderedFloor) {
                        window.renderMap(window.gameState.mapData, board);
                        window.lastRenderedFloor = window.gameState.currentFloor;
                    }
                    window.placePlayersOnMap();
                    window.updateTileVisuals();
                    window.updatePlayerStats();
                } else if (data.type === 'SHOW_MESSAGE' && data.targetPlayer === window.myPlayerInfo.id) {
                    alert(data.message);
                }
            });
        });
        
        conn.on('error', (err) => {
            alert("連線失敗: " + err);
        });
    });
};

window.showGameMessage = function(playerId, msg) {
    if (window.myPlayerInfo && window.myPlayerInfo.id === playerId) {
        alert(msg);
    } else if (typeof isHost !== 'undefined' && isHost) {
        if (typeof hostConnections !== 'undefined' && hostConnections.length > 0) {
            hostConnections[0].send({ type: 'SHOW_MESSAGE', message: msg, targetPlayer: playerId });
        }
    }
};

// Override handleTileClick wrapper for networking
window.sendTileClick = function(tileId) {
    if (isHost || !conn) {
        // Single player or Host
        window.handleTileClick(tileId, 'p1'); // Hardcoded p1 for now, can expand later
    } else {
        // Guest sends action
        conn.send({
            type: 'TILE_CLICK',
            tileId: tileId,
            playerId: 'p2' // Hardcoded p2 for now
        });
    }
};
