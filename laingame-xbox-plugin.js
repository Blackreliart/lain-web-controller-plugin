// ==UserScript==
// @name         Universal Xbox Controller Mapper with Connect Button
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Simulates keyboard inputs using an Xbox controller with a manual connect button
// @author       User
// @match        *://*/*
// @grant        none
// @run-at       document-start
// @allFrames    true
// ==/UserScript==

(function() {
    'use strict';

    // Xbox Button Mapping based on default keyboard layout
    const MAPPING = {
        0: { name: 'A (Confirm)', key: 'x', code: 'KeyX', keyCode: 88 },
        1: { name: 'B (Back)', key: 'z', code: 'KeyZ', keyCode: 90 },
        2: { name: 'X (Node Info)', key: 's', code: 'KeyS', keyCode: 83 },
        3: { name: 'Y (Menu)', key: 'd', code: 'KeyD', keyCode: 68 },
        4: { name: 'LB (Rotate L)', key: 'w', code: 'KeyW', keyCode: 87 },
        5: { name: 'RB (Rotate R)', key: 'r', code: 'KeyR', keyCode: 82 },
        6: { name: 'LT (Level Sel)', key: 'e', code: 'KeyE', keyCode: 69 },
        7: { name: 'RT (Look U/D)', key: 'q', code: 'KeyQ', keyCode: 81 },
        8: { name: 'Select (Menu)', key: 'c', code: 'KeyC', keyCode: 67 },
        9: { name: 'Start (Proceed)', key: 'v', code: 'KeyV', keyCode: 86 },
        12: { name: 'D-Pad Up', key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 },
        13: { name: 'D-Pad Down', key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 },
        14: { name: 'D-Pad Left', key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 },
        15: { name: 'D-Pad Right', key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 }
    };

    const STICK_THRESHOLD = 0.5;
    let lastState = {};
    let uiElements = {};
    let isActivated = false;

    // --- CREATE UI ASSISTANT ---
    function createUI() {
        if (!document.body || document.getElementById('gamepad-assistant-ui')) return;

        const container = document.createElement('div');
        container.id = 'gamepad-assistant-ui';
        container.style = `
            position: fixed; top: 10px; left: 10px; background: rgba(15, 15, 15, 0.95);
            color: #fff; font-family: 'Courier New', monospace; font-size: 11px; padding: 12px;
            border-radius: 6px; border: 2px solid #00ff66; z-index: 999999;
            box-shadow: 0 0 15px rgba(0,255,102,0.3); width: 230px; box-sizing: border-box;
        `;

        const title = document.createElement('div');
        title.innerHTML = '<strong>🎮 LAIN CONTROLLER API</strong>';
        title.style = 'border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 8px; color: #00ff66; text-align:center;';
        container.appendChild(title);

        // ACTIVATION BUTTON
        const btn = document.createElement('button');
        btn.id = 'gp-connect-btn';
        btn.innerText = '🔌 ACTIVATE CONTROLLER';
        btn.style = `
            width: 100%; padding: 8px; background: #00ff66; color: #000; font-weight: bold;
            border: none; border-radius: 4px; cursor: pointer; margin-bottom: 8px;
            font-family: monospace; font-size: 11px; box-shadow: 0 0 8px #00ff66;
        `;

        // Click event wakes up the Gamepad API
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            isActivated = true;
            // Force gamepad polling
            if (navigator.getGamepads) navigator.getGamepads();
            btn.innerText = '⚡ API ACTIVE (Press Button!)';
            btn.style.background = '#222';
            btn.style.color = '#00ff66';
            btn.style.border = '1px solid #00ff66';
            btn.style.boxShadow = 'none';
            // Set focus to the game canvas
            const canvas = document.querySelector('canvas');
            if (canvas) canvas.focus();
        });
        container.appendChild(btn);

        const status = document.createElement('div');
        status.id = 'gp-status';
        status.innerHTML = 'Status: <span style="color: #ff4d4d; font-weight:bold;">Awaiting Activation</span>';
        container.appendChild(status);

        const btnList = document.createElement('div');
        btnList.id = 'gp-buttons';
        btnList.style = 'margin-top: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 3px;';
        container.appendChild(btnList);

        for (let btnIndex in MAPPING) {
            const btnIndicator = document.createElement('div');
            btnIndicator.id = `ui-btn-${btnIndex}`;
            btnIndicator.innerText = MAPPING[btnIndex].name;
            btnIndicator.style = 'background: #111; padding: 3px; border-radius: 2px; text-align: center; font-size: 9px; color: #444; border: 1px solid #222;';
            btnList.appendChild(btnIndicator);
            uiElements[btnIndex] = btnIndicator;
        }

        document.body.appendChild(container);
    }

    // --- KEYBOARD EVENT SIMULATION ---
    function simulateKeyEvent(type, keyData) {
        if (!keyData) return;
        const target = document.activeElement || document.body || window;

        const event = new KeyboardEvent(type, {
            key: keyData.key, code: keyData.code, keyCode: keyData.keyCode, which: keyData.keyCode,
            bubbles: true, cancelable: true, view: window
        });

        Object.defineProperty(event, 'key', { get: () => keyData.key });
        Object.defineProperty(event, 'code', { get: () => keyData.code });
        Object.defineProperty(event, 'keyCode', { get: () => keyData.keyCode });
        Object.defineProperty(event, 'which', { get: () => keyData.keyCode });

        target.dispatchEvent(event);
        window.dispatchEvent(event);
        document.dispatchEvent(event);
    }

    // --- MAIN LOOP ---
    function updateGamepad() {
        if (document.body && !document.getElementById('gamepad-assistant-ui')) {
            createUI();
        }

        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        let gp = null;

        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) { gp = gamepads[i]; break; }
        }

        const statusEl = document.getElementById('gp-status');

        if (!gp) {
            if (statusEl && isActivated) {
                statusEl.innerHTML = 'Status: <span style="color: #ff9900; font-weight:bold;">Ready. Please press any controller button!</span>';
            }
            requestAnimationFrame(updateGamepad);
            return;
        }

        if (statusEl) {
            statusEl.innerHTML = `Status: <span style="color: #00ff66; font-weight:bold;">CONNECTED!</span><br><span style="color:#888; font-size:9px;">${gp.id.substring(0, 25)}</span>`;
        }

        let currentState = {};

        // 1. Poll Buttons
        for (let btnIndex in MAPPING) {
            const button = gp.buttons[btnIndex];
            if (button && button.pressed) currentState[btnIndex] = true;
        }

        // 2. Poll Analog Sticks
        if (gp.axes && gp.axes.length >= 2) {
            const xAxis = gp.axes[0]; const yAxis = gp.axes[1];
            if (xAxis < -STICK_THRESHOLD) currentState[14] = true; // Left
            if (xAxis > STICK_THRESHOLD)  currentState[15] = true; // Right
            if (yAxis < -STICK_THRESHOLD) currentState[12] = true; // Up
            if (yAxis > STICK_THRESHOLD)  currentState[13] = true; // Down
        }

        // UI Live Update
        for (let btnIndex in MAPPING) {
            if (uiElements[btnIndex] && uiElements[btnIndex].style) {
                if (currentState[btnIndex]) {
                    uiElements[btnIndex].style.background = '#00ff66';
                    uiElements[btnIndex].style.color = '#000';
                    uiElements[btnIndex].style.fontWeight = 'bold';
                } else {
                    uiElements[btnIndex].style.background = '#111';
                    uiElements[btnIndex].style.color = '#888';
                    uiElements[btnIndex].style.fontWeight = 'normal';
                }
            }
        }

        // 3. Dispatch Keyboard Events
        for (let btnIndex in lastState) {
            if (lastState[btnIndex] && !currentState[btnIndex]) simulateKeyEvent('keyup', MAPPING[btnIndex]);
        }
        for (let btnIndex in currentState) {
            if (!lastState[btnIndex] && currentState[btnIndex]) simulateKeyEvent('keydown', MAPPING[btnIndex]);
        }

        lastState = currentState;
        requestAnimationFrame(updateGamepad);
    }

    requestAnimationFrame(updateGamepad);
})();