# EM-Zilla User Guide

Welcome to the official user guide for **EM-Zilla** — the ultimate PSP Vita-style AI-powered Arduino development environment by **FJ™ Cybertronic Systems**.

---

## 🎮 1. Getting Started

### Prerequisites
- A modern browser supporting the **Web Serial API** (Google Chrome, Microsoft Edge, Opera).
- An Arduino or compatible microcontroller (Uno, Nano, Mega, ESP32 series).
- A USB cable to connect your device.

### Running Locally
```bash
# Clone the repository
git clone https://github.com/FJ-cyberzilla/EM-Zilla.git

# Navigate into directory
cd EM-Zilla

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 🤖 2. AI Code Generation & Orchestration

1. Open EM-Zilla in your browser (`http://localhost:3000`).
2. Navigate to the **AI Code Generator** tab.
3. Describe your desired project or sensor setup in plain English (e.g., *"Read temperature from DHT11 and blink LED when above 25C"*).
4. The multi-AI orchestration engine (`modules/ai_orchestration/`) processes your request, leveraging the knowledge graph, decision engine, and task dispatcher to produce optimized Arduino C++ code instantly.

---

## 🔌 3. Hardware Auto-Detection & Serial Upload

1. Connect your Arduino board via USB.
2. Click **Auto-Detect** in the top-right header.
3. EM-Zilla will automatically identify your board model (Uno, Nano, Mega, ESP32) through USB Vendor/Product ID and serial handshaking (`js/usb-detector.js`).
4. Monitor live device telemetry via the **Serial Monitor** tab.

---

## 🛡️ 4. Security & Integrity Verification

EM-Zilla features enterprise-grade tamper resistance:
- At startup, `security/integrity-verifier.js` computes and verifies SHA-256 hashes of core application files against official cryptographic signatures.
- Run `npm test` at any time to execute integrity test suites.
- Clone protection (`security/clone-protector.js`) ensures official builds run securely on authorized domains (`fj-cyberzilla.github.io`).

---

## 🛠️ 5. Development & Contribution Standards

- **ES Modules**: Fully modular ES6+ architecture (`"type": "module"`).
- **Linter Compliance**: Zero error and zero warning code quality enforced via ESLint v9 flat config (`eslint.config.js`). Run `npm run lint` before committing.
- **Support & Issues**: Report bugs or request features via [GitHub Issues](https://github.com/FJ-cyberzilla/EM-Zilla/issues).
