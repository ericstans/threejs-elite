import * as THREE from 'three';

export class TitleOverlay {
  constructor() {
    this.isVisible = false;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.titleMesh = null;
    this.onDismiss = null;
    
    this.createTitleOverlay();
    this.loadFont();
  }

  createTitleOverlay() {
    // Create overlay container
    this.overlay = document.createElement('div');
    this.overlay.style.position = 'fixed';
    this.overlay.style.top = '0';
    this.overlay.style.left = '0';
    this.overlay.style.width = '100%';
    this.overlay.style.height = '100%';
    this.overlay.style.background = 'transparent';
    this.overlay.style.display = 'none';
    this.overlay.style.zIndex = '10000';
    this.overlay.style.cursor = 'pointer';
    document.body.appendChild(this.overlay);

    // Create canvas for Three.js rendering
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.overlay.appendChild(this.canvas);

    // Add click listener to dismiss
    this.overlay.addEventListener('click', () => {
      this.hide();
    });

    // Add keyboard listener to dismiss
    this.keyHandler = (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.hide();
    };
  }

  async loadFont() {
    try {
      // Load font data from XML version
      const response = await fetch('./src/assets/fonts/NicoFontPack-v1.0/Bitmap Fonts/8. BoldTwilight/BMFont XML/BoldTwilight.fnt');
      const fontText = await response.text();
      const font = this.parseBMFontXML(fontText);

      // Load texture atlas
      const textureLoader = new THREE.TextureLoader();
      const texture = await new Promise((resolve, reject) => {
        textureLoader.load(
          './src/assets/fonts/NicoFontPack-v1.0/Bitmap Fonts/8. BoldTwilight/BoldTwilight.png',
          (texture) => {
            // Configure texture for bitmap font
            texture.minFilter = THREE.NearestFilter;
            texture.magFilter = THREE.NearestFilter;
            texture.generateMipmaps = false;
            texture.flipY = false;
            resolve(texture);
          },
          undefined,
          reject
        );
      });

      // Initialize Three.js scene
      this.initThreeJS(font, texture);
    } catch (error) {
      console.error('Error loading font:', error);
    }
  }

  parseBMFontXML(fontText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(fontText, 'text/xml');
    
    const info = {};
    const common = {};
    const chars = {};
    
    // Parse info element
    const infoElement = xmlDoc.querySelector('info');
    if (infoElement) {
      const attrs = infoElement.attributes;
      for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i];
        info[attr.name] = isNaN(attr.value) ? attr.value : parseInt(attr.value);
      }
    }
    
    // Parse common element
    const commonElement = xmlDoc.querySelector('common');
    if (commonElement) {
      const attrs = commonElement.attributes;
      for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i];
        common[attr.name] = parseInt(attr.value);
      }
    }
    
    // Parse char elements
    const charElements = xmlDoc.querySelectorAll('char');
    charElements.forEach(charElement => {
      const char = {};
      const attrs = charElement.attributes;
      for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i];
        char[attr.name] = isNaN(attr.value) ? attr.value : parseInt(attr.value);
      }
      if (char.id !== undefined) {
        chars[char.id] = char;
      }
    });
    
    return { info, common, chars };
  }

  initThreeJS(font, texture) {
    // Create scene
    this.scene = new THREE.Scene();
    
    // Create camera
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 400;
    this.camera = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2, 
      frustumSize * aspect / 2, 
      frustumSize / 2, 
      -frustumSize / 2, 
      0.1, 
      1000
    );
    this.camera.position.z = 1;
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas, 
      alpha: true, 
      antialias: false 
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);
    
    // Create title text
    this.createTitleText(font, texture);
  }

  createTitleText(font, texture) {
    const titles = [
      ['THE', 'MOURNFUL', 'VOID'],
      ['SHIPS IN', 'SPACE!!!'],
      ['STAR', 'PONDERER'],
      ['SLOWER', 'THAN', 'LIGHT'],
      ['VOID', 'JACKER'],
      ['DARTING', 'TOWARD', 'OBLIVION']
    ];
    
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    const lines = randomTitle;
    const fontSize = 72;
    const lineHeight = font.common.lineHeight;
    const textureWidth = font.common.scaleW;
    const textureHeight = font.common.scaleH;
    const lineSpacing = 60; // Vertical spacing between lines (halved)
    
    // Create text group
    const textGroup = new THREE.Group();
    
    // Center the text vertically
    const totalHeight = (lines.length - 1) * lineSpacing;
    const startY = -totalHeight / 2;
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      let x = 0;
      let y = startY + (lineIndex * lineSpacing);
      
      // Calculate total width for centering this line using actual character widths
      let totalWidth = 0;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const charCode = char.charCodeAt(0);
        const charData = font.chars[charCode];
        if (charData) {
          totalWidth += (charData.xadvance) * fontSize / lineHeight;
        } else if (char === ' ') {
          totalWidth += (10 + 4) * fontSize / lineHeight;
        }
      }
      x = -totalWidth / 2;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const charCode = char.charCodeAt(0);
        const charData = font.chars[charCode];
        
        if (charData && charData.width > 0 && charData.height > 0) {
          // Create plane for this character
          const geometry = new THREE.PlaneGeometry(
            charData.width * fontSize / lineHeight,
            charData.height * fontSize / lineHeight
          );
          
          // Create material
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.1,
          });
          
          // Set UV coordinates
          const uvAttribute = geometry.attributes.uv;
          const uvArray = uvAttribute.array;
          
          // Calculate UV coordinates
          const u1 = charData.x / textureWidth;
          const v1 = charData.y / textureHeight;
          const u2 = (charData.x + charData.width) / textureWidth;
          const v2 = (charData.y + charData.height) / textureHeight;
          
          // Set UVs for the quad
          uvArray[0] = u1; uvArray[1] = v1; // bottom-left
          uvArray[2] = u2; uvArray[3] = v1; // bottom-right
          uvArray[4] = u1; uvArray[5] = v2; // top-left
          uvArray[6] = u2; uvArray[7] = v2; // top-right
          
          uvAttribute.needsUpdate = true;
          
          // Create mesh
          const mesh = new THREE.Mesh(geometry, material);
          
          // Position character with proper spacing (scale xoffset and yoffset with font size)
          mesh.position.set(
            x + (charData.xoffset * fontSize / lineHeight),
            -y - (charData.yoffset * fontSize / lineHeight),
            0
          );
          
          textGroup.add(mesh);
          
          // Advance x position using character's actual advance plus extra spacing
          x += (charData.xadvance + 4) * fontSize / lineHeight;
        }
      }
    }
    
    this.titleMesh = textGroup;
    this.scene.add(this.titleMesh);
  }

  show() {
    this.isVisible = true;
    this.overlay.style.display = 'block';
    
    if (this.titleMesh) {
      this.animate();
    }
    
    // Add keyboard listener
    document.addEventListener('keydown', this.keyHandler);
  }

  hide() {
    this.isVisible = false;
    this.overlay.style.display = 'none';
    
    // Remove keyboard listener
    document.removeEventListener('keydown', this.keyHandler);
    
    // Call dismiss callback
    if (this.onDismiss) {
      this.onDismiss();
    }
  }

  animate() {
    if (!this.isVisible) return;
    
    // Simple floating animation
    const time = Date.now() * 0.001;
    if (this.titleMesh) {
      this.titleMesh.position.y = Math.sin(time * 2) * 2;
      this.titleMesh.rotation.z = Math.sin(time * 0.5) * 0.05;
    }
    
    // Render
    this.renderer.render(this.scene, this.camera);
    
    // Continue animation
    requestAnimationFrame(() => this.animate());
  }

  setOnDismiss(callback) {
    this.onDismiss = callback;
  }
}
