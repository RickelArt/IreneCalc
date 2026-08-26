# Overpaint Point Buy

A custom 5e point-buy calculator with **Overpaint** locked-current vs live-new comparison.

## Features

- Editable available points, min/max scores, and point costs for scores **1–20**
- Ability score calculator with modifiers and point costs
- **Lock Current** to freeze pre-Overpaint values, then edit New values live
- Tracks Cursed Energy, cursed feats, hit dice count/size, and proficiencies
- Live CE cost using Overpaint exchange rates:
  - 1 point ↔ 5 CE
  - 1 cursed feat ↔ 15 CE
  - +1 hit die ↔ 5 CE
  - hit die size ±1 step ↔ 5 CE
  - 1 proficiency ↔ 5 CE

## Run

```bash
npm install
npm run dev
```

Build with `npm run build`.
