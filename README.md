# Space Simulator

Simple prototype for an Elite- or Privateer-esque game

### 🎮 Controls
- **WASD** - Pitch and yaw controls
- **Q/E** - Roll controls  
- **Z/X** - Throttle control 
- **Space** - Fire lasers
- **T** - Target nearest asteroid
- **Y** - Nav target nearest planet
- **C** - Open communications with nav target
- **ESC** - Close communications modal
- **1-9** - Select conversation topic

## Getting Started

### Prerequisites
- Node.js
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd threejs-elite

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Local SoundFonts
To include a subset of SoundFonts locally (avoid first-play network latency), run:
```bash
node scripts/fetch-soundfonts.js
```
This downloads selected FluidR3_GM instrument JS files into `public/soundfonts`. Only instruments used in the midi files are included.

### Development
```bash
# Start development server with hot reload
npm run dev

# Build optimized production bundle
npm run build


### Credits

Spaceship models by https://mehrasaur.itch.io/3d-spaceships-pack
Icons by https://www.fontawesome.com
Peaberry fonts by https://emhuo.itch.io/peaberry-pixel-font
monogram fonts by https://datagoblin.itch.io/monogram
m5x7 font by https://managore.itch.io/m5x7
nico pixel fonts pack by https://emhuo.itch.io/nico-pixel-fonts-pack
Gymnopedie No. 1 midi by https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=37