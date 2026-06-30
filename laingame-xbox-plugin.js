// ==UserScript==
// @name         Universal Xbox Controller Mapper with Connect Button
// @namespace    http://tampermonkey.net/
// @version      4.6
// @description  Simulates keyboard inputs using an Xbox controller with draggable & minimizable Copland OS UI (Restricted to laingame.net)
// @author       User
// @match        *://3d.laingame.net/*
// @match        *://*.laingame.net/*
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
    let isMinimized = false;

    // --- CREATE UI ASSISTANT (DRAGGABLE & MINIMIZABLE) ---
    function createUI() {
        if (!document.body || document.getElementById('gamepad-assistant-ui')) return;

        // Main Container
        const container = document.createElement('div');
        container.id = 'gamepad-assistant-ui';
        container.style = `
            position: fixed; top: 45px; left: 15px; background: #000000;
            color: #00aaff; font-family: 'Courier New', monospace; font-size: 11px; padding: 12px;
            border-radius: 0px; border: 1px solid #555555; z-index: 999999;
            width: 240px; box-sizing: border-box; user-select: none;
        `;

        // Title Bar / Drag Handle
        const titleBar = document.createElement('div');
        titleBar.style = `
            border-bottom: 1px solid #333333; padding-bottom: 6px; margin-bottom: 10px;
            color: #ff9900; font-weight: bold; font-size: 11px; cursor: move;
            display: flex; justify-content: space-between; align-items: center;
        `;

        const titleText = document.createElement('span');
        titleText.innerHTML = 'main &nbsp; notes &nbsp; api';
        titleBar.appendChild(titleText);

        // Minimize Button [_]
        const minBtn = document.createElement('span');
        minBtn.innerText = '[_]';
        minBtn.style = 'cursor: pointer; font-size: 10px; margin-left: 5px; color: #ff9900;';
        titleBar.appendChild(minBtn);
        container.appendChild(titleBar);

        // Content Wrapper
        const contentWrapper = document.createElement('div');
        contentWrapper.id = 'gp-ui-content';
        container.appendChild(contentWrapper);

        // ACTIVATION BUTTON
        const btn = document.createElement('button');
        btn.id = 'gp-connect-btn';
        btn.innerText = '[ start controller ]';
        btn.style = `
            width: 100%; padding: 6px; background: transparent; color: #ff9900; font-weight: bold;
            border: 1px solid transparent; border-radius: 0px; cursor: pointer; margin-bottom: 10px;
            font-family: 'Courier New', monospace; font-size: 12px; text-align: left; padding-left: 0;
        `;

        btn.onmouseover = () => { if(!isActivated) { btn.style.textDecoration = 'underline'; } };
        btn.onmouseout = () => { if(!isActivated) { btn.style.textDecoration = 'none'; } };

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            isActivated = true;
            if (navigator.getGamepads) navigator.getGamepads();
            btn.innerText = 'connect : active';
            btn.style.color = '#555555';
            btn.style.textDecoration = 'none';
            btn.style.cursor = 'default';

            const canvas = document.querySelector('canvas');
            if (canvas) canvas.focus();
        });
        contentWrapper.appendChild(btn);

        const status = document.createElement('div');
        status.id = 'gp-status';
        status.innerHTML = 'connect : awaiting host';
        status.style = 'font-size: 11px; color: #00aaff; padding-bottom: 8px; font-weight: bold;';
        contentWrapper.appendChild(status);

        const btnList = document.createElement('div');
        btnList.id = 'gp-buttons';
        btnList.style = 'margin-top: 10px; display: grid; grid-template-columns: 1fr; gap: 2px; border-top: 1px dashed #333333; padding-top: 8px;';
        contentWrapper.appendChild(btnList);

        for (let btnIndex in MAPPING) {
            const btnIndicator = document.createElement('div');
            btnIndicator.id = `ui-btn-${btnIndex}`;
            btnIndicator.innerText = `+ ${MAPPING[btnIndex].name.toLowerCase()}`;
            btnIndicator.style = 'background: transparent; padding: 2px 0; font-size: 10px; color: #226688;';
            btnList.appendChild(btnIndicator);
            uiElements[btnIndex] = btnIndicator;
        }

        document.body.appendChild(container);

        // --- MINIMIZE FUNCTIONALITY ---
        minBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            isMinimized = !isMinimized;
            if (isMinimized) {
                contentWrapper.style.display = 'none';
                minBtn.innerText = '[+]';
                container.style.width = '180px';
            } else {
                contentWrapper.style.display = 'block';
                minBtn.innerText = '[_]';
                container.style.width = '240px';
            }
        });

        // --- DRAG AND DROP FUNCTIONALITY ---
        let isDragging = false;
        let offsetX, offsetY;

        titleBar.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - container.getBoundingClientRect().left;
            offsetY = e.clientY - container.getBoundingClientRect().top;
            titleBar.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            container.style.left = `${e.clientX - offsetX}px`;
            container.style.top = `${e.clientY - offsetY}px`;
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            titleBar.style.cursor = 'move';
        });
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
                statusEl.innerHTML = 'connect : contacting host';
            }
            requestAnimationFrame(updateGamepad);
            return;
        }

        if (statusEl) {
            statusEl.innerHTML = `connect : gamepad_ready<br><span style="color:#226688; font-size:9px;">id : ${gp.id.substring(0, 15).toLowerCase()}...</span>`;
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
            if (xAxis < -STICK_THRESHOLD) currentState[14] = true;
            if (xAxis > STICK_THRESHOLD)  currentState[15] = true;
            if (yAxis < -STICK_THRESHOLD) currentState[12] = true;
            if (yAxis > STICK_THRESHOLD)  currentState[13] = true;
        }

        // UI Live Update
        if (!isMinimized) {
            for (let btnIndex in MAPPING) {
                if (uiElements[btnIndex] && uiElements[btnIndex].style) {
                    if (currentState[btnIndex]) {
                        uiElements[btnIndex].style.color = '#ff9900';
                        uiElements[btnIndex].style.fontWeight = 'bold';
                    } else {
                        uiElements[btnIndex].style.color = '#00aaff';
                        uiElements[btnIndex].style.fontWeight = 'normal';
                    }
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
