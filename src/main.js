document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const btnSettings = document.getElementById('btn-settings');
    const modalSettings = document.getElementById('modal-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const btnSinglePlayer = document.getElementById('btn-singleplayer');
    const btnHost = document.getElementById('btn-host');
    const btnJoin = document.getElementById('btn-join');
    const inputRoomCode = document.getElementById('input-room-code');
    const viewLobby = document.getElementById('view-lobby');
    const viewGame = document.getElementById('view-game');

    // CSV to JS Tool Elements
    const csvUpload = document.getElementById('csv-upload');
    const csvOutput = document.getElementById('csv-output');
    const btnCopyJs = document.getElementById('btn-copy-js');

    // Toggle Settings Modal
    btnSettings.addEventListener('click', () => {
        modalSettings.classList.remove('hidden');
    });

    btnCloseSettings.addEventListener('click', () => {
        modalSettings.classList.add('hidden');
    });

    // Start Single Player Game
    btnSinglePlayer.addEventListener('click', () => {
        viewLobby.classList.remove('active');
        viewGame.classList.add('active');
        if (typeof initGame === 'function') initGame();
    });

    // Host Multiplayer Game
    btnHost.addEventListener('click', () => {
        if (window.initNetworkAsHost) window.initNetworkAsHost();
    });

    // Join Multiplayer Game
    btnJoin.addEventListener('click', () => {
        const code = inputRoomCode.value.trim();
        if (code && window.initNetworkAsGuest) {
            window.initNetworkAsGuest(code);
        } else {
            alert('請輸入有效的房號！');
        }
    });

    // CSV to JS Logic
    csvUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const csvText = event.target.result;
            const lines = csvText.split('\n').filter(line => line.trim() !== '');
            if (lines.length < 2) return;

            // Assume first line is header
            const headers = lines[0].split(',').map(h => h.trim());
            const questions = [];

            for (let i = 1; i < lines.length; i++) {
                // simple split by comma, ignoring quotes for basic implementation
                const values = lines[i].split(',').map(v => v.trim());
                if(values.length >= headers.length) {
                    const qObj = {};
                    headers.forEach((header, index) => {
                        qObj[header] = values[index];
                    });
                    questions.push(qObj);
                }
            }

            const jsContent = `export const quizData = ${JSON.stringify(questions, null, 4)};`;
            csvOutput.value = jsContent;
        };
        reader.readAsText(file);
    });

    btnCopyJs.addEventListener('click', () => {
        if (!csvOutput.value) return;
        csvOutput.select();
        document.execCommand('copy');
        
        const originalText = btnCopyJs.innerHTML;
        btnCopyJs.innerHTML = '<i class="fas fa-check"></i> 已複製';
        setTimeout(() => {
            btnCopyJs.innerHTML = originalText;
        }, 2000);
    });
});
