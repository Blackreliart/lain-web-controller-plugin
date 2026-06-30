# LainTSX Xbox Controller Plugin 🎮

A universal browser userscript (Tampermonkey / Violentmonkey) that brings native Xbox controller (and compatible gamepads) support to the 3D Web/PSX version of **Serial Experiments Lain** (`3d.laingame.net`).

It features an integrated **Connection Assistant (Overlay UI)** directly on the website to instantly verify your controller status and test button presses in real-time.

---

## 🚀 Features
* **Global Domain Support:** Works seamlessly across the entire website and embedded game iFrames.
* **Live UI Assistant:** Displays a visual overlay to check if the browser successfully detects your gamepad.
* **1:1 Button Mapping:** Exactly tailored to match the original game layout shown in the settings.
* **Analog Stick Support:** Use either the D-Pad or the Left Analog Stick for movement.

## 🛠️ Installation

1. Install a userscript manager extension for your browser (e.g., [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/)).
2. Open your extension dashboard and click **"Create a new script"**.
3. Copy and paste the entire code from the `lain-controller-plugin.user.js` file found in this repository.
4. Save the script.

## 🎮 How to Use in Game

1. Navigate to the game on [3d.laingame.net](https://3d.laingame.net/game.html).
2. Look at the top-left corner and click the green button: **"🔌 CONTROLLER AKTIVIEREN"** (Activate Controller). *Note: Browsers strictly require a manual user click before allowing gamepad access!*
3. Immediately press the **A button** (or any button) on your Xbox controller a few times.
4. Once the overlay status switches to **"VERBUNDEN!"** (Connected), you are ready to play!

---

### Controls & Button Mapping:

> ⚠️ **IMPORTANT NOTE:** Please do **NOT** change or remap the keyboard controls in the game's built-in settings menu. This script mimics the exact default layout shown in the game instructions. Changing the in-game mapping will break the controller configuration.

| Xbox Controller | Game Function | Emulated Keyboard Key |
| :--- | :--- | :--- |
| **D-Pad / Left Stick** | Movement (Up / Down / Left / Right) | Arrow Keys |
| **A** | Confirm / Interact | `x` |
| **B** | Back / Cancel | `z` |
| **X** | Display Node Information | `s` |
| **Y** | Open Menu | `d` |
| **LB / RB** | Rotate Left / Right | `w` / `r` |
| **LT** | Open Level Selector | `e` |
| **RT** | Look Up / Down | `q` |
| **Select (View)** | Alternate Menu | `c` |
| **Start (Menu)** | Start / Proceed | `v` |
