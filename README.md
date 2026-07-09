# 🫀 3D Human Heart Simulation
### Interactive Learning Tool for Grades 6–12
**Canadian Education Council | ingskill.edu.np**

---

## 📁 Files in this folder

```
heart-simulation/
├── index.html      ← Main page (open this)
├── style.css       ← All styling
├── heart.js        ← 3D heart engine
└── README.md       ← This file
```

---

## 🚀 How to Run in VS Code

### Option A — Easiest (Live Server Extension)

1. **Open VS Code**
2. Install the **Live Server** extension:
   - Press `Ctrl+Shift+X` to open Extensions
   - Search: `Live Server`
   - Click **Install** (by Ritwick Dey)
3. Open the `heart-simulation` folder in VS Code:
   `File → Open Folder → select heart-simulation`
4. Right-click `index.html` in the Explorer panel
5. Click **"Open with Live Server"**
6. Your browser opens automatically at `http://127.0.0.1:5500`

> ✅ This is the recommended method — no internet needed after page loads!

---

### Option B — Python HTTP Server

If you have Python installed:

```bash
# Navigate to the folder
cd path/to/heart-simulation

# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open: `http://localhost:8000`

---

### Option C — Node.js HTTP Server

```bash
# Install once globally
npm install -g http-server

# Run in the folder
cd path/to/heart-simulation
http-server -p 8000
```

Then open: `http://localhost:8000`

---

## ⚠️ Important: Do NOT open index.html directly by double-clicking

The simulation uses JavaScript modules and needs to run through a local server.
Double-clicking will show a blank screen due to browser security restrictions.
Always use one of the methods above.

---

## 🌐 Internet Connection

The simulation loads **Three.js** (the 3D engine) and **Google Fonts** from the internet the first time.
After that, your browser caches them and it works offline.

If you have no internet access:
1. Download Three.js r128 from: https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js
2. Save it as `three.min.js` in the heart-simulation folder
3. In `index.html`, change:
   ```html
   <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
   ```
   to:
   ```html
   <script src="three.min.js"></script>
   ```

---

## 🎮 How to Use the Simulation

| Action | How |
|--------|-----|
| Rotate heart | Click and drag on the 3D heart |
| Zoom in/out | Scroll mouse wheel |
| Learn about a part | Click on any part of the heart |
| Change heartbeat speed | Use the BPM slider on the left |
| Toggle labels | Click 🏷 Labels button |
| X-Ray view | Click 🔬 X-Ray button |
| Reset rotation | Click ↺ Reset button |
| Different views | Use the View Mode buttons |
| Show/hide vessels | Use the checkboxes |
| Learn a word | Click any term in the Glossary bar |

---

## 🫀 What's Shown in the Simulation

### Chambers (4 in total)
- **Left Ventricle** — main pump, strongest wall, pumps blood to body
- **Right Ventricle** — pumps blood to lungs
- **Left Atrium** — receives fresh blood from lungs
- **Right Atrium** — receives used blood from body

### Valves (4 in total)
- **Mitral Valve** — between left atrium and left ventricle (2 leaflets)
- **Tricuspid Valve** — between right atrium and right ventricle (3 leaflets)
- **Aortic Valve** — between left ventricle and aorta
- **Pulmonary Valve** — between right ventricle and pulmonary artery

### Major Blood Vessels
- **Aorta** (red) — largest artery, carries blood to the whole body
- **Superior & Inferior Vena Cava** (blue) — returns blood from the body
- **Pulmonary Artery** (blue) — carries blood to the lungs
- **Pulmonary Veins** (red) — returns fresh blood from lungs
- **Coronary Arteries** (yellow) — supplies the heart itself

### Animated Features
- Real-time heartbeat (systole & diastole phases)
- Blood flow particles through all vessels
- Valve opening/closing in sync with beat
- Adjustable BPM (40–180 beats per minute)
- Live cardiac output calculation

---

## 🖥️ System Requirements

| Item | Requirement |
|------|-------------|
| Browser | Chrome, Edge, Firefox, or Safari (latest) |
| GPU | Any — hardware acceleration recommended |
| RAM | 2GB+ |
| Internet | Required on first load only |

---

## 📚 Curriculum Alignment

| Grade | Topics Covered |
|-------|----------------|
| 6–7 | Heart as a pump, chambers, blood flow basics |
| 8–9 | Pulmonary vs systemic circulation, valves, vessels |
| 10–11 | Cardiac cycle (systole/diastole), coronary arteries |
| 12 | Cardiac output, pathology references, detailed anatomy |

---

Made with ❤️ for science education
Three.js r128 · No installation required
