import { ThrottleUI } from './ui/ThrottleUI.js';
import { DebugFlagsUI } from './ui/DebugFlagsUI.js';
import { ControlsUI } from './ui/ControlsUI.js';
import { TargetUI } from './ui/TargetUI.js';
import { NavTargetUI } from './ui/NavTargetUI.js';
import { OptionsUI } from './ui/OptionsUI.js';
import { CargoUI } from './ui/CargoUI.js';
import { ServicesUI } from './ui/ServicesUI.js';
import { TitleOverlay } from './ui/TitleOverlay.js';
import { TutorialOverlay } from './ui/TutorialOverlay.js';
import cockpitImageSrc from './assets/png/cockpit.png';
import * as THREE from 'three';

export class UI {
  constructor(conversationSystem = null) {
    this.conversationSystem = conversationSystem;
    // Anchors and state will be initialized before building DOM
    this.firstPersonMode = true; // start in cockpit view
    this._parallaxEnabled = true;
    this._parallaxState = { lastX: 0, lastY: 0 };
    // Centralized anchor definitions for cockpit-relative panels (percent from top-left of cockpit image)
    this._anchors = {
      target: { left: '70.5%', top: '61%' },
      nav: { left: '29.5%', top: '61%' },
      radar: { left: '50%', top: '70%' }
    };
    // Parallax tuning (motion/rotation driven)
    this._parallaxParams = {
      velScaleX: 3.0,
      velScaleY: 3.0,
      angScaleRoll: 25.0,
      angScalePitch: 25.0,
      maxOffset: 18,
      followLerp: 0.12,
      decayLerp: 0.08,
      motionEps: 0.02
    };
    // Build DOM after anchors so createUI can consume them
    this.createUI();
    // Map modal (reuses comms styling for quick implementation)
    this.mapModal = document.createElement('div');
    this.mapModal.style.position = 'fixed';
    this.mapModal.style.top = '0';
    this.mapModal.style.left = '0';
    this.mapModal.style.width = '100%';
    this.mapModal.style.height = '100%';
    this.mapModal.style.background = 'rgba(0, 0, 0, 0.8)';
    this.mapModal.style.display = 'none';
    this.mapModal.style.zIndex = '2100';
    this.mapModal.style.pointerEvents = 'auto';
    document.body.appendChild(this.mapModal);

    this.mapContent = document.createElement('div');
    this.mapContent.style.position = 'absolute';
    this.mapContent.style.top = '50%';
    this.mapContent.style.left = '50%';
    this.mapContent.style.transform = 'translate(-50%, -50%)';
    this.mapContent.style.width = '540px';
    this.mapContent.style.maxHeight = '70%';
    this.mapContent.style.overflowY = 'auto';
    this.mapContent.style.background = 'rgba(0,0,0,0.5)';
    this.mapContent.style.border = '2px solid #00ff00';
    this.mapContent.style.padding = '20px';
    this.mapContent.style.color = '#ffffff';
    this.mapContent.style.fontFamily = 'monospace';
    this.mapContent.style.boxShadow = '0 0 10px rgba(0,255,0,0.5)';
    this.mapModal.appendChild(this.mapContent);

    this.mapTitle = document.createElement('h2');
    this.mapTitle.style.marginTop = '0';
    this.mapTitle.style.fontFamily = 'monospace';
    this.mapTitle.style.color = '#00ff00';
    this.mapTitle.textContent = 'SECTOR MAP';
    this.mapContent.appendChild(this.mapTitle);

    this.mapList = document.createElement('div');
    this.mapContent.appendChild(this.mapList);
  }

  createUI() {
    // Add bitmap cockpit graphic (bottom center) beneath UI
    // --- Cockpit wrapper (holds cockpit image + anchored panels) ---
    this.cockpitWrapper = document.createElement('div');
    this.cockpitWrapper.style.position = 'fixed';
    this.cockpitWrapper.style.bottom = '0';
    this.cockpitWrapper.style.left = '50%';
    this.cockpitWrapper.style.transform = 'translateX(-50%)';
    this.cockpitWrapper.style.transformOrigin = '50% 100%'; // pivot at bottom center to keep base sealed
    this.cockpitWrapper.style.width = '100%'; // existing scaling behavior retained
    this.cockpitWrapper.style.height = 'auto';
    this.cockpitWrapper.style.pointerEvents = 'none';
    this.cockpitWrapper.style.zIndex = '500';
    document.body.appendChild(this.cockpitWrapper);

    this.cockpitBitmap = document.createElement('img');
    this.cockpitBitmap.src = cockpitImageSrc;
    this.cockpitBitmap.alt = 'Cockpit';
    this.cockpitBitmap.style.width = '100%';
    this.cockpitBitmap.style.height = 'auto';
    this.cockpitBitmap.style.display = 'block';
    this.cockpitBitmap.style.pointerEvents = 'none';
    this.cockpitWrapper.appendChild(this.cockpitBitmap);

    // Bottom overscan extension: only the bottom 1px row of the cockpit stretched downward
    const OVERSCAN_PX = 160; // amount of hidden extension below viewport
    this._cockpitOverscanDiv = document.createElement('div');
    const overscan = this._cockpitOverscanDiv;
    overscan.style.position = 'absolute';
    overscan.style.left = '0';
    overscan.style.bottom = `-${OVERSCAN_PX}px`;
    overscan.style.width = '100%';
    overscan.style.height = `${OVERSCAN_PX}px`;
    overscan.style.pointerEvents = 'none';
    overscan.style.background = 'transparent'; // will be filled after image load
    this.cockpitWrapper.appendChild(overscan);
    const ensureOverscan = () => this._buildCockpitOverscan();
    if (this.cockpitBitmap.complete) {
      ensureOverscan();
    } else {
      this.cockpitBitmap.addEventListener('load', ensureOverscan, { once: true });
    }

    // Create UI container
    this.uiContainer = document.createElement('div');
    this.uiContainer.style.position = 'fixed';
    this.uiContainer.style.top = '0';
    this.uiContainer.style.left = '0';
    this.uiContainer.style.width = '100%';
    this.uiContainer.style.height = '100%';
    this.uiContainer.style.pointerEvents = 'none';
    this.uiContainer.style.fontFamily = 'monospace';
    this.uiContainer.style.color = '#00ff00';
    this.uiContainer.style.fontSize = '14px';
    this.uiContainer.style.zIndex = '1000'; // ensure above cockpit graphic
    document.body.appendChild(this.uiContainer);

    // Initialize UI components
    this.throttleUI = new ThrottleUI(this.uiContainer);
    this.debugFlagsUI = new DebugFlagsUI();
    this.controlsUI = new ControlsUI(this.uiContainer);
    this.targetUI = new TargetUI(this.uiContainer);
    this.navTargetUI = new NavTargetUI(this.uiContainer);
    this.optionsUI = new OptionsUI();
    this.cargoUI = new CargoUI(this.uiContainer);
    this.servicesUI = new ServicesUI(this.uiContainer);
    this.titleOverlay = new TitleOverlay();
    this.tutorialOverlay = new TutorialOverlay();

    // Setup escape key handlers for modals
    this.setupModalEventListeners();

    // Re-anchor target & nav target panels into cockpit wrapper for percentage placement.
    // Preserve existing DOM nodes while changing parent.
    if (this.targetUI && this.targetUI.targetPanel) {
      this.cockpitWrapper.appendChild(this.targetUI.targetPanel);
      const p = this.targetUI.targetPanel.style;
      p.position = 'absolute';
      p.left = this._anchors.target.left;
      p.top = this._anchors.target.top;
      p.right = 'auto';
      p.bottom = 'auto';
      p.transform = 'translate(-50%, -50%)';
      p.color = '#00ff00';
      p.fontFamily = 'monospace';
      p.fontSize = '12px';
      p.width = '10%';
      p.height = '20%';
    }
    if (this.navTargetUI && this.navTargetUI.navTargetPanel) {
      this.cockpitWrapper.appendChild(this.navTargetUI.navTargetPanel);
      const p2 = this.navTargetUI.navTargetPanel.style;
      p2.position = 'absolute';
      p2.left = this._anchors.nav.left;
      p2.top = this._anchors.nav.top;
      p2.right = 'auto';
      p2.bottom = 'auto';
      p2.transform = 'translate(-50%, -50%)';
      p2.color = '#00ff00';
      p2.fontFamily = 'monospace';
      p2.fontSize = '12px';
      p2.width = '10%';
      p2.height = '20%';
    }



    // Crosshair
    this.crosshair = document.createElement('div');
    this.crosshair.style.position = 'absolute';
    this.crosshair.style.top = '50%';
    this.crosshair.style.left = '50%';
    this.crosshair.style.transform = 'translate(-50%, -50%)';
    this.crosshair.style.width = '20px';
    this.crosshair.style.height = '20px';
    this.crosshair.style.border = '2px solid #00ff00';
    this.crosshair.style.borderRadius = '50%';
    this.crosshair.style.background = 'transparent';
    this.uiContainer.appendChild(this.crosshair);

    // Docking status display moved into Nav Target panel (bottom area)
    this.dockingStatus = document.createElement('div');
    this.dockingStatus.style.position = 'absolute';
    this.dockingStatus.style.left = '50%';
    this.dockingStatus.style.bottom = '4px';
    this.dockingStatus.style.transform = 'translateX(-50%)';
    this.dockingStatus.style.fontFamily = 'monospace';
    this.dockingStatus.style.fontSize = '12px';
    this.dockingStatus.style.color = '#ffff00';
    this.dockingStatus.style.textAlign = 'center';
    this.dockingStatus.style.background = 'rgba(0, 0, 0, 0.4)';
    this.dockingStatus.style.padding = '4px 6px';
    this.dockingStatus.style.border = '1px solid #ffff00';
    this.dockingStatus.style.width = '90%';
    this.dockingStatus.style.borderRadius = '2px';
    this.dockingStatus.style.display = 'none';
    this.dockingStatus.style.whiteSpace = 'pre-line';
    this.dockingStatus.textContent = 'DOCKING IN PROGRESS';
    // Ensure nav target panel can anchor absolutely positioned children
    if (this.navTargetUI && this.navTargetUI.navTargetPanel) {
      // If panel is absolute we still can position child; but make it relative to ensure correct bottom reference
      this.navTargetUI.navTargetPanel.style.position = this.navTargetUI.navTargetPanel.style.position || 'relative';
      this.navTargetUI.navTargetPanel.appendChild(this.dockingStatus);
    } else {
      // Fallback: append to uiContainer (should rarely happen)
      this.uiContainer.appendChild(this.dockingStatus);
    }

    // Auto-aim cone indicator (for testing)
    this.autoAimCone = document.createElement('div');
    this.autoAimCone.style.position = 'absolute';
    this.autoAimCone.style.top = '50%';
    this.autoAimCone.style.left = '50%';
    this.autoAimCone.style.transform = 'translate(-50%, -50%)';
    this.autoAimCone.style.width = '200px'; // Approximate size for 10 degrees
    this.autoAimCone.style.height = '200px';
    this.autoAimCone.style.border = '1px solid #ff0000';
    this.autoAimCone.style.borderRadius = '50%';
    this.autoAimCone.style.background = 'transparent';
    this.autoAimCone.style.pointerEvents = 'none';
    this.autoAimCone.style.opacity = '0.5';
    this.uiContainer.appendChild(this.autoAimCone);

    // Radar (two concentric circles) anchored relative to cockpit (top-based)
    this.radarWrapper = document.createElement('div');
    this.radarWrapper.style.position = 'absolute';
    this.radarWrapper.style.left = this._anchors.radar.left;
    this.radarWrapper.style.top = this._anchors.radar.top;
    this.radarWrapper.style.bottom = '';
    this.radarWrapper.style.transform = 'translate(-50%, -50%)';
    this.radarWrapper.style.width = '140px';
    this.radarWrapper.style.height = '140px';
    this.radarWrapper.style.pointerEvents = 'none';
    this.radarWrapper.style.opacity = '0.9';
    this.cockpitWrapper.appendChild(this.radarWrapper);
    const radarOuter = document.createElement('div');
    radarOuter.style.position = 'absolute';
    radarOuter.style.left = '0';
    radarOuter.style.top = '0';
    radarOuter.style.width = '100%';
    radarOuter.style.height = '100%';
    radarOuter.style.border = '2px solid #00aa55';
    radarOuter.style.borderRadius = '50%';
    radarOuter.style.boxShadow = '0 0 8px rgba(0,255,128,0.4)';
    this.radarWrapper.appendChild(radarOuter);
    const radarInner = document.createElement('div');
    radarInner.style.position = 'absolute';
    radarInner.style.left = '25%';
    radarInner.style.top = '25%';
    radarInner.style.width = '50%';
    radarInner.style.height = '50%';
    radarInner.style.border = '2px solid #00aa55';
    radarInner.style.borderRadius = '50%';
    this.radarWrapper.appendChild(radarInner);
    this.radarBlipLayer = document.createElement('div');
    this.radarBlipLayer.style.position = 'absolute';
    this.radarBlipLayer.style.left = '0';
    this.radarBlipLayer.style.top = '0';
    this.radarBlipLayer.style.width = '100%';
    this.radarBlipLayer.style.height = '100%';
    this.radarWrapper.appendChild(this.radarBlipLayer);
    this._radarBlips = new Map();

    // Initialize responsive scaling for radar when cockpit image loads / window resizes
    this._initResponsiveAnchors();

    // Communications modal (initially hidden)
    this.commsModal = document.createElement('div');
    this.commsModal.style.position = 'fixed';
    this.commsModal.style.top = '0';
    this.commsModal.style.left = '0';
    this.commsModal.style.width = '100%';
    this.commsModal.style.height = '100%';
    this.commsModal.style.background = 'rgba(0, 0, 0, 0.8)';
    this.commsModal.style.display = 'none';
    this.commsModal.style.zIndex = '2000';
    this.commsModal.style.pointerEvents = 'auto';
    document.body.appendChild(this.commsModal);

    // Comms modal content
    this.commsContent = document.createElement('div');
    this.commsContent.style.position = 'absolute';
    this.commsContent.style.top = '50%';
    this.commsContent.style.left = '50%';
    this.commsContent.style.transform = 'translate(-50%, -50%)';
    this.commsContent.style.background = 'rgba(0, 0, 0, 0.9)';
    this.commsContent.style.border = '2px solid #00ff00';
    this.commsContent.style.padding = '20px';
    this.commsContent.style.minWidth = '400px';
    this.commsContent.style.maxWidth = '600px';
    this.commsContent.style.fontFamily = 'monospace';
    this.commsContent.style.color = '#00ff00';
    this.commsContent.style.fontSize = '14px';
    this.commsContent.style.lineHeight = '1.6';
    this.commsModal.appendChild(this.commsContent);

    // Comms modal title
    this.commsTitle = document.createElement('div');
    this.commsTitle.style.fontSize = '18px';
    this.commsTitle.style.fontWeight = 'bold';
    this.commsTitle.style.marginBottom = '15px';
    this.commsTitle.style.textAlign = 'center';
    this.commsTitle.style.borderBottom = '1px solid #00ff00';
    this.commsTitle.style.paddingBottom = '10px';
    this.commsContent.appendChild(this.commsTitle);

    // Comms modal message
    this.commsMessage = document.createElement('div');
    this.commsMessage.style.marginBottom = '20px';
    this.commsMessage.style.textAlign = 'center';
    this.commsContent.appendChild(this.commsMessage);

    // Comms modal options
    this.commsOptions = document.createElement('div');
    this.commsOptions.style.marginBottom = '20px';
    this.commsOptions.style.fontStyle = 'italic';
    this.commsContent.appendChild(this.commsOptions);

    // Comms modal close instruction
    this.commsClose = document.createElement('div');
    this.commsClose.style.textAlign = 'center';
    this.commsClose.style.fontSize = '12px';
    this.commsClose.style.color = '#666';
    this.commsClose.textContent = 'Press ESC to close';
    this.commsContent.appendChild(this.commsClose);
  }

  // Switch to third-person (legacy) layout: hide cockpit bitmap, move panels back to full-screen container, restore original styling.
  applyThirdPersonLayout() {
    if (!this.firstPersonMode) return; // already third-person
    this.firstPersonMode = false;
    // Hide cockpit image
    if (this.cockpitWrapper) this.cockpitWrapper.style.display = 'none';
    // Reparent target & nav panels back to uiContainer
    if (this.targetUI?.targetPanel) {
      this.uiContainer.appendChild(this.targetUI.targetPanel);
      const p = this.targetUI.targetPanel.style;
      p.position = 'absolute';
      p.left = '80%';
      p.top = '15%';
      p.transform = 'translate(-50%, -50%)';
      p.width = '10%';
      p.height = '20%';
      p.fontSize = '16px';
    }
    if (this.navTargetUI?.navTargetPanel) {
      this.uiContainer.appendChild(this.navTargetUI.navTargetPanel);
      const p2 = this.navTargetUI.navTargetPanel.style;
      p2.position = 'absolute';
      p2.left = '20%';
      p2.top = '15%';
      p2.transform = 'translate(-50%, -50%)';
      p2.width = '10%';
      p2.height = '20%';
      p2.fontSize = '16px';
    }
    // Docking status: revert to centered floating panel (legacy style)
    if (this.dockingStatus) {
      this.dockingStatus.style.position = 'absolute';
      this.dockingStatus.style.left = '50%';
      this.dockingStatus.style.bottom = '';
      this.dockingStatus.style.top = '75%';
      this.dockingStatus.style.width = 'auto';
      this.dockingStatus.style.padding = '20px';
      this.dockingStatus.style.border = '2px solid #ffff00';
      this.dockingStatus.style.fontSize = '24px';
      this.dockingStatus.style.background = 'rgba(0,0,0,0.8)';
      this.dockingStatus.style.transform = 'translate(-50%, -50%)';
      if (this.dockingStatus.parentElement !== this.uiContainer) {
        this.uiContainer.appendChild(this.dockingStatus);
      }
    }
    // Radar: move out of cockpit so it no longer parallax shifts
    if (this.radarWrapper) {
      if (this.radarWrapper.parentElement !== this.uiContainer) this.uiContainer.appendChild(this.radarWrapper);
      this.radarWrapper.style.left = '50%';
      this.radarWrapper.style.top = '';
      this.radarWrapper.style.bottom = '120px';
      this.radarWrapper.style.transform = 'translateX(-50%)';
      // Fixed size in third-person (not tied to cockpit scale)
      this.radarWrapper.style.width = '140px';
      this.radarWrapper.style.height = '140px';
    }
  }

  // Switch back to first-person cockpit overlay layout
  applyFirstPersonLayout() {
    if (this.firstPersonMode) return; // already first-person
    this.firstPersonMode = true;
    if (this.cockpitWrapper) this.cockpitWrapper.style.display = 'block';
    // Reparent panels into cockpit wrapper with overlay positioning
    if (this.targetUI?.targetPanel) {
      this.cockpitWrapper.appendChild(this.targetUI.targetPanel);
      const p = this.targetUI.targetPanel.style;
      p.position = 'absolute';
      p.left = '70.5%';
      p.top = '61%';
      p.transform = 'translate(-50%, -50%)';
      p.width = '10%';
      p.height = '20%';
      p.fontSize = '12px';
    }
    if (this.navTargetUI?.navTargetPanel) {
      this.cockpitWrapper.appendChild(this.navTargetUI.navTargetPanel);
      const p2 = this.navTargetUI.navTargetPanel.style;
      p2.position = 'absolute';
      p2.left = '29.5%';
      p2.top = '61%';
      p2.transform = 'translate(-50%, -50%)';
      p2.width = '10%';
      p2.height = '20%';
      p2.fontSize = '12px';
    }
    // Docking status back inside nav target panel bottom
    if (this.dockingStatus && this.navTargetUI?.navTargetPanel) {
      this.navTargetUI.navTargetPanel.appendChild(this.dockingStatus);
      this.dockingStatus.style.position = 'absolute';
      this.dockingStatus.style.left = '50%';
      this.dockingStatus.style.top = '';
      this.dockingStatus.style.bottom = '4px';
      this.dockingStatus.style.transform = 'translateX(-50%)';
      this.dockingStatus.style.width = '90%';
      this.dockingStatus.style.padding = '4px 6px';
      this.dockingStatus.style.border = '1px solid #ffff00';
      this.dockingStatus.style.fontSize = '12px';
      this.dockingStatus.style.background = 'rgba(0,0,0,0.4)';
    }
    // Radar: move into cockpit so parallax affects it
    if (this.radarWrapper && this.cockpitWrapper && this.radarWrapper.parentElement !== this.cockpitWrapper) {
      this.cockpitWrapper.appendChild(this.radarWrapper);
    }
    if (this.radarWrapper) {
      this.radarWrapper.style.left = this._anchors.radar.left;
      this.radarWrapper.style.top = this._anchors.radar.top;
      this.radarWrapper.style.bottom = '';
      this.radarWrapper.style.transform = 'translate(-50%, -50%)';
      // Recompute size now that we're back in cockpit context
      this._updateRadarSize();
    }
  }

  updateThrottle(targetSpeed, currentSpeed, maxSpeed) {
    this.throttleUI.updateThrottle(targetSpeed, currentSpeed, maxSpeed);
  }

  updateTargetInfo(targetInfo, targetPosition, camera) {
    this.targetUI.updateTargetInfo(targetInfo, targetPosition, camera);
  }

  clearTargetInfo() {
    this.targetUI.clearTargetInfo();
  }

  updateNavTargetInfo(navTargetInfo, targetPosition, camera) {
    this.navTargetUI.updateNavTargetInfo(navTargetInfo, targetPosition, camera);
  }

  clearNavTargetInfo() {
    this.navTargetUI.clearNavTargetInfo();
  }

  showServices(services, locationName) {
    this.servicesUI.showServices(services, locationName);
  }

  hideServices() {
    this.servicesUI.hideServices();
  }

  isServicesVisible() {
    return this.servicesUI.isServicesVisible();
  }

  showTitle() {
    this.titleOverlay.show();
  }

  hideTitle() {
    this.titleOverlay.hide();
  }

  setOnTitleDismiss(callback) {
    this.titleOverlay.setOnDismiss(callback);
  }

  isTitleVisible() {
    return this.titleOverlay && this.titleOverlay.isVisible;
  }

  // Tutorial overlay methods
  showTutorial() {
    this.tutorialOverlay.show();
  }

  hideTutorial() {
    this.tutorialOverlay.hide();
  }

  isTutorialVisible() {
    return this.tutorialOverlay && this.tutorialOverlay.isVisible;
  }

  setOnTutorialComplete(callback) {
    this.tutorialOverlay.setOnComplete(callback);
  }

  setOnTutorialSkip(callback) {
    this.tutorialOverlay.setOnSkip(callback);
  }

  setOnTutorialPause(callback) {
    this.tutorialOverlay.setOnPause(callback);
  }

  setOnTutorialResume(callback) {
    this.tutorialOverlay.setOnResume(callback);
  }

  updateRadar(playerPos, playerQuat, targets) {
    if (!this.radarWrapper) return;
    // Derive current radar radii from actual DOM size so resizing (e.g. 140px vs 160px) is reflected.
    const rect = this.radarWrapper.getBoundingClientRect();
    const outerR = rect.width * 0.5;           // outer circle radius (wrapper is square)
    const innerR = outerR * 0.5;               // keep inner circle at 50% of outer diameter
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(playerQuat).normalize();
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(playerQuat).normalize();
    const right = new THREE.Vector3().copy(forward).cross(up).normalize(); // ship right
    const live = new Set();
    for (const t of targets) {
      const key = t._radarId || t.id || t.getId?.() || t.getName?.();
      if (!key) continue;
      const pos = t.getPosition ? t.getPosition() : t.position;
      if (!pos) continue;
      const rel = pos.clone().sub(playerPos);
      const len = rel.length();
      if (!len) continue;
      rel.divideScalar(len);
      const dotF = rel.dot(forward); // 1 front, -1 behind
      const vertical = THREE.MathUtils.clamp(rel.dot(up), -1, 1);
      const lateral = THREE.MathUtils.clamp(rel.dot(right), -1, 1);
      // Amount the object is behind (>0 means behind)
      const behindFactor = Math.max(0, -dotF); // 0 front hemisphere, up to 2? actually dotF>=-1 so max 1
      // Base positions inside inner circle for front / side objects
      let x = lateral * innerR;
      let y = -vertical * innerR; // screen y inverted
      if (behindFactor > 0) {
        // Scale outward toward outer ring proportionally to how far behind
        const scale = innerR + behindFactor * (outerR - innerR);
        // If exactly directly behind (lateral & vertical near 0), pin to outer ring top
        if (Math.abs(lateral) < 0.05 && Math.abs(vertical) < 0.05 && dotF < -0.95) {
          x = 0;
          y = -outerR + 2; // top of outer ring
        } else {
          // Renormalize direction in lateral/vertical plane to preserve orientation
          const mag = Math.hypot(lateral, vertical) || 1;
          x = (lateral / mag) * scale;
          y = -(vertical / mag) * scale;
        }
      }
      // Clamp final within outer bounds
      const radial = Math.hypot(x, y);
      if (radial > outerR - 2) { // small padding so dots stay inside stroke
        const k = (outerR - 2) / radial;
        x *= k; y *= k;
      }
      let blip = this._radarBlips.get(key);
      if (!blip) {
        blip = document.createElement('div');
        blip.style.position = 'absolute';
        blip.style.borderRadius = '50%';
        blip.style.pointerEvents = 'none';
        this.radarBlipLayer.appendChild(blip);
        this._radarBlips.set(key, blip);
      }
      // Determine color based on entity type
      let baseColor;
      if (t.getType && t.getType() === 'resource') {
        baseColor = '#808080'; // Grey for resources
      } else {
        baseColor = t.isNavTargetable ? '#ffff00' : '#ff0000';
      }
      const highlighted = !!t._radarHighlight;
      if (highlighted) {
        blip.style.width = '8px';
        blip.style.height = '8px';
        blip.style.marginLeft = '-4px';
        blip.style.marginTop = '-4px';
        blip.style.background = baseColor;
        blip.style.boxShadow = t.isNavTargetable ? '0 0 6px rgba(255,255,0,0.9)' : '0 0 6px rgba(255,0,0,0.9)';
        blip.style.border = '1px solid #fff';
      } else {
        blip.style.width = '2px';
        blip.style.height = '2px';
        blip.style.marginLeft = '-1px';
        blip.style.marginTop = '-1px';
        blip.style.background = baseColor;
        blip.style.boxShadow = 'none';
        blip.style.border = 'none';
      }
      blip.style.left = (outerR + x) + 'px';
      blip.style.top = (outerR + y) + 'px';
      live.add(key);
    }
    // Cleanup stale blips
    for (const [k, el] of this._radarBlips.entries()) {
      if (!live.has(k)) { el.remove(); this._radarBlips.delete(k); }
    }
  }

  // Lightweight cockpit bitmap parallax based on ship attitude & velocity.
  updateCockpitParallax(spaceship) {
    if (!this._parallaxEnabled || !this.cockpitWrapper || !spaceship) return;
    if (!this.firstPersonMode) { this.cockpitWrapper.style.transform = 'translateX(-50%)'; return; }
    try {
      const p = this._parallaxParams;
      const angVel = spaceship.angularVelocity || new THREE.Vector3();
      const linVel = spaceship.velocity || new THREE.Vector3();
      // Convert linear velocity to local ship space
      const localVel = linVel.clone();
      if (spaceship.quaternion) {
        const invQ = spaceship.quaternion.clone().invert();
        localVel.applyQuaternion(invQ);
      }
      // Desired offsets purely from motion
      let desiredX = (-localVel.x * p.velScaleX) + (angVel.z * p.angScaleRoll);
      let desiredY = (-localVel.y * p.velScaleY) + (-angVel.x * p.angScalePitch);
      desiredX = THREE.MathUtils.clamp(desiredX, -p.maxOffset, p.maxOffset);
      desiredY = THREE.MathUtils.clamp(desiredY, -p.maxOffset, p.maxOffset);
      const lerp = (a, b, t) => a + (b - a) * t;
      this._parallaxState.lastX = lerp(this._parallaxState.lastX, desiredX, p.followLerp);
      this._parallaxState.lastY = lerp(this._parallaxState.lastY, desiredY, p.followLerp);
      const linMag = linVel.length();
      const angMag = angVel.length();
      if (linMag < p.motionEps && angMag < p.motionEps) {
        this._parallaxState.lastX = lerp(this._parallaxState.lastX, 0, p.decayLerp);
        this._parallaxState.lastY = lerp(this._parallaxState.lastY, 0, p.decayLerp);
      }
      // Invert roll-induced rotation so cockpit rotates opposite the ship's roll input (Q/E)
      // Only use roll (angVel.z), not yaw movement
      const MAX_COCKPIT_ROLL = 12; // degrees
      const rotDeg = THREE.MathUtils.clamp(-(angVel.z * MAX_COCKPIT_ROLL), -8, 8);
      this.cockpitWrapper.style.transform = `translateX(-50%) translate(${this._parallaxState.lastX}px, ${this._parallaxState.lastY}px) rotate(${rotDeg}deg)`;
    } catch (_) { }
  }

  // --- Responsive anchor utilities ---
  _initResponsiveAnchors() {
    // Debounced resize
    let resizeTimer = null;
    const onResize = () => {
      if (resizeTimer) cancelAnimationFrame(resizeTimer);
      resizeTimer = requestAnimationFrame(() => this._updateRadarSize());
    };
    window.addEventListener('resize', onResize);
    // Initial sizing after cockpit image loads
    if (this.cockpitBitmap?.complete) {
      this._updateRadarSize();
    } else if (this.cockpitBitmap) {
      this.cockpitBitmap.addEventListener('load', () => this._updateRadarSize(), { once: true });
    }
  }

  _updateRadarSize() {
    if (!this.firstPersonMode) return; // only scale when in cockpit
    if (!this.cockpitBitmap || !this.radarWrapper) return;
    const baseWidth = this.cockpitBitmap.naturalWidth || 1920; // assumed design width
    const currentWidth = this.cockpitBitmap.clientWidth || baseWidth;
    const scale = currentWidth / baseWidth;
    // Base radar design size 140px at baseWidth; clamp reasonable bounds
    const size = Math.max(90, Math.min(240, Math.round(90 * scale)));
    this.radarWrapper.style.width = size + 'px';
    this.radarWrapper.style.height = size + 'px';
  }

  _buildCockpitOverscan() {
    if (!this._cockpitOverscanDiv || !this.cockpitBitmap) return;
    const img = this.cockpitBitmap;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return;
    // Create tiny canvas to capture only bottom row
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = 1; // single row
    const ctx = canvas.getContext('2d');
    try {
      ctx.drawImage(img, 0, h - 1, w, 1, 0, 0, w, 1);
      const dataURL = canvas.toDataURL('image/png');
      const div = this._cockpitOverscanDiv;
      // Use the 1px row stretched vertically
      div.style.backgroundImage = `url(${dataURL})`;
      div.style.backgroundRepeat = 'repeat-y';
      div.style.backgroundSize = '100% 1px'; // stretch row downwards via repeat-y
      div.style.backgroundPosition = 'bottom center';
      // Optional gradient fade to pure black near bottom for subtle transition
      // We can layer a linear-gradient if desired; leaving pure stretch for fidelity.
    } catch (_) { /* ignore cross-origin or rendering errors */ }
  }

  showCommsModal(planetName, greeting, options = null) {
    this.commsTitle.textContent = `COMMUNICATIONS - ${planetName}`;
    this.commsMessage.textContent = greeting;

    // Clear previous options
    this.commsOptions.innerHTML = '';

    // Use provided options or fallback to ConversationSystem.getInitialOptions()
    let finalOptions = options;
    if (!finalOptions || finalOptions.length === 0) {
      if (this.conversationSystem && this.conversationSystem.getInitialOptions) {
        // Get player flags from the game if available
        const playerFlags = this.game ? this.game.spaceship.getAllFlags() : {};
        finalOptions = this.conversationSystem.getInitialOptions(planetName, playerFlags);
      }
    }

    // Add communication options
    if (finalOptions && finalOptions.length > 0) {
      finalOptions.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.style.marginBottom = '10px';
        optionElement.style.padding = '8px';
        optionElement.style.border = '1px solid #00ff00';
        optionElement.style.cursor = 'pointer';
        optionElement.style.transition = 'all 0.2s ease';
        optionElement.innerHTML = `<span style="color: #ffff00;">${index + 1}.</span> ${option.text}`;
        optionElement.dataset.optionId = option.id;
        optionElement.dataset.optionIndex = index + 1;
        if (option.flags) {
          optionElement.dataset.flags = JSON.stringify(option.flags);
        }

        // Add hover effects
        optionElement.addEventListener('mouseenter', () => {
          optionElement.style.background = 'rgba(0, 255, 0, 0.1)';
          optionElement.style.border = '1px solid #00ff00';
        });

        optionElement.addEventListener('mouseleave', () => {
          optionElement.style.background = 'transparent';
          optionElement.style.border = '1px solid #00ff00';
        });

        // Add click handler
        optionElement.addEventListener('click', () => {
          if (this.onCommsOptionClick) {
            this.onCommsOptionClick(parseInt(optionElement.dataset.optionIndex));
          }
        });

        this.commsOptions.appendChild(optionElement);
      });
    } else {
      // No options available - show message
      const noOptionsMessage = document.createElement('div');
      noOptionsMessage.style.padding = '20px';
      noOptionsMessage.style.textAlign = 'center';
      noOptionsMessage.style.color = '#ff0000';
      noOptionsMessage.textContent = 'No communication options available.';
      this.commsOptions.appendChild(noOptionsMessage);
    }

    this.commsModal.style.display = 'block';
  }

  updateCommsModal(message, options) {
    this.commsMessage.textContent = message;

    // Clear previous options
    this.commsOptions.innerHTML = '';

    // Add new options
    if (options && options.length > 0) {
      options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.style.marginBottom = '10px';
        optionElement.style.padding = '8px';
        optionElement.style.border = '1px solid #00ff00';
        optionElement.style.cursor = 'pointer';
        optionElement.style.transition = 'all 0.2s ease';
        optionElement.innerHTML = `<span style="color: #ffff00;">${index + 1}.</span> ${option.text}`;
        optionElement.dataset.optionId = option.id;
        optionElement.dataset.optionIndex = index + 1;
        if (option.flags) {
          optionElement.dataset.flags = JSON.stringify(option.flags);
        }

        // Add hover effects
        optionElement.addEventListener('mouseenter', () => {
          optionElement.style.background = 'rgba(0, 255, 0, 0.1)';
          optionElement.style.border = '1px solid #00ff00';
        });

        optionElement.addEventListener('mouseleave', () => {
          optionElement.style.background = 'transparent';
          optionElement.style.border = '1px solid #00ff00';
        });

        // Add click handler
        optionElement.addEventListener('click', () => {
          if (this.onCommsOptionClick) {
            this.onCommsOptionClick(parseInt(optionElement.dataset.optionIndex));
          }
        });

        this.commsOptions.appendChild(optionElement);
      });
    }
  }

  // Blink crosshair red when a laser hits something
  blinkCrosshairRed() {
    if (!this.crosshair) return;
    this.crosshair.style.transition = 'border-color 0.1s';
    this.crosshair.style.borderColor = '#ff2222';
    setTimeout(() => {
      this.crosshair.style.borderColor = '#00ff00';
    }, 120);
  }

  hideCommsModal() {
    this.commsModal.style.display = 'none';
  }

  isCommsModalVisible() {
    return this.commsModal.style.display === 'block';
  }

  showMapModal(sectors) {
    this.mapList.innerHTML = '';
    sectors.forEach((sector, index) => {
      const el = document.createElement('div');
      el.style.marginBottom = '10px';
      el.style.padding = '8px';
      el.style.border = '1px solid #00ff00';
      el.style.cursor = 'pointer';
      el.style.transition = 'all 0.2s ease';
      el.innerHTML = `<span style="color:#ffff00;">${index + 1}.</span> ${sector.name}`;
      el.dataset.sectorId = sector.id;
      el.addEventListener('mouseenter', () => {
        el.style.background = 'rgba(0,255,0,0.1)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.background = 'transparent';
      });
      el.addEventListener('click', () => {
        this.onMapSelect && this.onMapSelect(el.dataset.sectorId);
      });
      this.mapList.appendChild(el);
    });
    this.mapModal.style.display = 'block';
  }

  hideMapModal() {
    this.mapModal.style.display = 'none';
  }

  setOnMapSelect(cb) { this.onMapSelect = cb; }

  setOnCommsOptionClick(callback) {
    this.onCommsOptionClick = callback;
  }

  updateFlagsDisplay(playerFlags, globalFlags) {
    this.debugFlagsUI.updateFlagsDisplay(playerFlags, globalFlags);
  }

  // Docking UI methods
  showDockingStatus() {
    this.dockingStatus.style.display = 'block';
  }

  updateDockingStatus(text) {
    this.dockingStatus.textContent = text;
  }

  hideDockingStatus() {
    this.dockingStatus.style.display = 'none';
  }

  // Options UI methods
  showOptions() {
    this.optionsUI.show();
  }

  hideOptions() {
    this.optionsUI.hide();
  }

  toggleOptions() {
    this.optionsUI.toggle();
  }

  isOptionsVisible() {
    return this.optionsUI.isVisible;
  }

  setupModalEventListeners() {
    // Handle escape key for map and comms modals
    this.modalEscapeKeyHandler = (event) => {
      if (event.code === 'Escape') {
        if (this.isCommsModalVisible()) {
          this.hideCommsModal();
        } else if (this.isMapModalVisible()) {
          this.hideMapModal();
        }
      }
    };

    document.addEventListener('keydown', this.modalEscapeKeyHandler);
  }

  isMapModalVisible() {
    return this.mapModal.style.display === 'block';
  }

  setGame(game) {
    this.optionsUI.setGame(game);
    this.optionsUI.onClose = () => {
      if (game && game.resume) {
        game.resume();
      }
    };
  }

  destroy() {
    if (this.uiContainer && this.uiContainer.parentNode) {
      this.uiContainer.parentNode.removeChild(this.uiContainer);
    }
    if (this.optionsUI) {
      this.optionsUI.destroy();
    }
    // Remove modal event listeners
    if (this.modalEscapeKeyHandler) {
      document.removeEventListener('keydown', this.modalEscapeKeyHandler);
    }
  }

}
