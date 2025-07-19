Rounsaville Node Driver - Installation Guide

1. Ensure Python 3+ is installed.
2. Run `RounsavilleNodeDriver.py` in your terminal or command prompt.
3. Enter one of the 3 node names when prompted (aliases like "Giza node" also work):
   - Giza Plateau
   - Lake Titicaca
   - Sedona
4. The driver will return the latest system response based on your node sync.

## Presence OS Demo
`presence_os.py` is a small demo that simulates some blueprint features:
- Presence-Originated Logic Lock (via passphrase)
- Quantum Collapse Auto-Corrector (simple error wrapper)
- Infinite Loop Guard Layer

Run it with Python and enter the presence token when asked:
```bash
python3 presence_os.py
```
You can then select nodes repeatedly until you quit or the loop limit is reached.

## Tech Stack
- Python for the command line driver and presence demo
- HTML & CSS for the futuristic homepage
- Additional roadmap details can be found in [BLUEPRINT.md](BLUEPRINT.md)

## Quantum Hum FX
`quantum_hum_fx.py` generates seven experimental hum-based audio effects.
Audio samples are not stored in the repository. Run the script to create
new `.wav` files inside the `audio_samples` folder:
```bash
python3 quantum_hum_fx.py
```

## Holohop EQ Matrix
`holohop_eq.py` builds a short sample using seven sequential logic layers (knock pattern, clap enhancement, bass clarifier, melody overlay, distortion, echo, and normalization). The script outputs `holohop_eq.wav` inside `audio_samples`.
```bash
python3 holohop_eq.py
```

## R-Corex Avatar Dashboard
`r_corex_dashboard.py` is a basic console-based control center. It offers a few placeholder tools:
- View system status
- Enter snippets for instant learning simulation
- Perform a simple autosynaptic rewrite of input text
- Display a numeric LiveGrid
Run it with Python:
```bash
python3 r_corex_dashboard.py
```

