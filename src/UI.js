import { ThrottleUI } from './ui/ThrottleUI.js';
import { DebugFlagsUI } from './ui/DebugFlagsUI.js';
import { ControlsUI } from './ui/ControlsUI.js';
import { TargetUI } from './ui/TargetUI.js';
import { NavTargetUI } from './ui/NavTargetUI.js';
import { OptionsUI } from './ui/OptionsUI.js';
import { CargoUI } from './ui/CargoUI.js';
import { CashUI } from './ui/CashUI.js';
import { CommoditiesUI } from './ui/CommoditiesUI.js';
import { ServicesUI } from './ui/ServicesUI.js';
import { RefuelRepairUI } from './ui/RefuelRepairUI.js';
import { JobsUI } from './ui/JobsUI.js';
import { OutfittingUI } from './ui/OutfittingUI.js';
import { enumerateJobsServiceLocations } from './systems/serialization/JobDestinationResolver.js';
import { getShortestPath } from './util/mapGraphGenerator.js';
import { getTradeableItems } from './data/CargoItemsData.js';
import { TitleOverlay } from './ui/TitleOverlay.js';
import { TutorialOverlay } from './ui/TutorialOverlay.js';
import { GameOverOverlay } from './ui/GameOverOverlay.js';
import cockpitImageSrc from './assets/png/cockpit.png';
import * as THREE from 'three';
import { ShipHealthUI } from './ui/ShipHealthUI.js';
import { MapUI } from './ui/MapUI.js';

export class UI {
  constructor(conversationSystem = null) {
    this.conversationSystem = conversationSystem;
    // Anchors and state will be initialized before building DOM
    this.firstPersonMode = true; // start in cockpit view
    this._parallaxEnabled = true;
    this._parallaxState = { lastX: 0, lastY: 0 };
    this.onCommsOptionClick = null;
    this.onMapSelect = null;

    // Initialize MapUI
    this.mapUI = new MapUI();
    this.mapUI.setOnSectorSelect((sectorId) => {
      this.onMapSelect && this.onMapSelect(sectorId);
    });
    // Centralized anchor definitions for cockpit-relative panels (percent from top-left of cockpit image)
    this._anchors = {
      target: { left: '70.5%', top: '61%' },
      nav: { left: '29.5%', top: '61%' },
      radar: { left: '50%', top: '70%' },
      throttle: { left: '62.625%', top: '60.5%' },
      speedometer: { left: '59.875%', top: '55%' },
      shipHealth: { left: '49.75%', top: '93%' } // pinned near bottom center
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
  }

  createUI() {
    // Add bitmap cockpit graphic (bottom center) beneath UI
    // --- Cockpit wrapper (holds cockpit image + anchored panels) ---
    this.cockpitWrapper = document.createElement('div');
    this.cockpitWrapper.className = 'cockpit-wrapper';
    document.body.appendChild(this.cockpitWrapper);

    this.cockpitBitmap = document.createElement('img');
    this.cockpitBitmap.src = cockpitImageSrc;
    this.cockpitBitmap.alt = 'Cockpit';
    this.cockpitBitmap.className = 'cockpit-bitmap';
    this.cockpitWrapper.appendChild(this.cockpitBitmap);

    // Bottom overscan extension: only the bottom 1px row of the cockpit stretched downward
    const OVERSCAN_PX = 160; // amount of hidden extension below viewport
    this._cockpitOverscanDiv = document.createElement('div');
    const overscan = this._cockpitOverscanDiv;
    overscan.className = 'cockpit-overscan';
    overscan.style.bottom = `-${OVERSCAN_PX}px`;
    overscan.style.height = `${OVERSCAN_PX}px`;
    this.cockpitWrapper.appendChild(overscan);
    const ensureOverscan = () => this._buildCockpitOverscan();
    if (this.cockpitBitmap.complete) {
      ensureOverscan();
    } else {
      this.cockpitBitmap.addEventListener('load', ensureOverscan, { once: true });
    }

    // Create UI container
    this.uiContainer = document.createElement('div');
    this.uiContainer.className = 'ui-container';
    document.body.appendChild(this.uiContainer);
    document.body.appendChild(this.uiContainer);

    // Initialize UI components
    this.throttleUI = new ThrottleUI(this.uiContainer);
    this.shipHealthUI = new ShipHealthUI(this.game, this.spaceship);
    this.shipHealthUI.attach(this.uiContainer);
    this.debugFlagsUI = new DebugFlagsUI();
    this.controlsUI = new ControlsUI(this.uiContainer);
    this.targetUI = new TargetUI(this.uiContainer);
    this.navTargetUI = new NavTargetUI(this.uiContainer);
    this.optionsUI = new OptionsUI();
    this.cargoUI = new CargoUI(this.uiContainer);
    this.cashUI = new CashUI(this.uiContainer);
    this.commoditiesUI = new CommoditiesUI(this.uiContainer, this.cargoSystem);
    this.servicesUI = new ServicesUI(this.uiContainer);
    this.refuelRepairUI = new RefuelRepairUI(this.uiContainer);
    this.jobsUI = new JobsUI(this.uiContainer);
    this.outfittingUI = new OutfittingUI(this.uiContainer);

    // Jobs state (simple in-memory store for now)
    this._jobsAvailable = [];
    this._jobsInProgress = [];

    // Set up commodities callback
    this.servicesUI.onCommoditiesClick = () => {
      this.showCommoditiesFromCurrentLocation();
    };
    // Set up refuel & repair callback
    this.servicesUI.onRefuelRepairClick = () => {
      this.showRefuelRepair();
    };
    // Set up jobs callback
    this.servicesUI.onJobsClick = () => {
      this.showJobs();
    };
    // Set up outfitting callback
    this.servicesUI.onOutfittingClick = () => {
      this.showOutfitting();
    };

    // Wire refuel/repair UI callbacks
    if (this.refuelRepairUI) {
      this.refuelRepairUI.onRepairToFull = () => {
        this.repairHullToFull();
      };
      this.refuelRepairUI.onRefuel = () => {
        // Placeholder: no logic yet
        this.refuelRepairUI.setStatus('Your ship has been refueled.');
      };
      this.refuelRepairUI.onClose = () => {
        // No-op for now
      };
    }

    // Set up commodities cargo update callback
    this.commoditiesUI.onCargoUpdate = (itemsToSell, totalValue) => {
      this.handleCommoditiesSale(itemsToSell, totalValue);
    };

    // Set up cargo item click callback
    this.cargoUI.onItemClick = (itemData) => {
      this.handleCargoItemClick(itemData);
    };

    // Set up commodities cargo add callback
    this.commoditiesUI.onCargoAdd = (item) => {
      this.addItemToCargo(item);
    };

    // Set up commodities cargo remove callback
    this.commoditiesUI.onCargoRemove = (commodityName, quantity) => {
      this.removeItemsFromCargo(commodityName, quantity);
    };

    // Set up commodities buy callback
    this.commoditiesUI.onBuyItems = (itemsToBuy, totalCost) => {
      this.handleCommoditiesPurchase(itemsToBuy, totalCost);
    };

    // Set up outfitting callbacks
    this.outfittingUI.onPurchase = (categoryName, equipmentName, finalCost, tradeInCredit) => {
      this.handleEquipmentPurchase(categoryName, equipmentName, finalCost, tradeInCredit);
    };
    this.outfittingUI.onClose = () => {
      // When Outfitting closes (via X or ESC), return to Services if context exists
      if (this._lastServicesContext) {
        this._returnToServices();
      }
    };

    this.titleOverlay = new TitleOverlay();
    this.tutorialOverlay = new TutorialOverlay();
    this.tutorialOverlay.setUIInstance(this);
    this.gameOverOverlay = new GameOverOverlay();
    this.gameOverOverlay.setOnQuit(() => {
      // Perform a clean restart back to the Title screen
      try { this.hideGameOver(); } catch (_) { /* ignore errors */ }
      try { this.titleOverlay.hide(); } catch (_) { /* ignore errors */ }
      window.location.reload();
    });

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

    // Move throttle elements into cockpit wrapper for cockpit-relative positioning
    if (this.throttleUI && this.throttleUI.throttleContainer) {
      this.cockpitWrapper.appendChild(this.throttleUI.throttleContainer);
      const p3 = this.throttleUI.throttleContainer.style;
      p3.position = 'absolute';
      p3.left = this._anchors.throttle.left;
      p3.top = this._anchors.throttle.top;
      p3.right = 'auto';
      p3.bottom = 'auto';
      p3.transform = 'translate(-50%, -50%)';
    }
    if (this.throttleUI && this.throttleUI.speedDisplay) {
      this.cockpitWrapper.appendChild(this.throttleUI.speedDisplay);
      const p4 = this.throttleUI.speedDisplay.style;
      p4.position = 'absolute';
      p4.left = this._anchors.speedometer.left;
      p4.top = this._anchors.speedometer.top;
      p4.right = 'auto';
      p4.bottom = 'auto';
      p4.transform = 'translate(-50%, -50%)';
    }

    // Place ShipHealthUI according to current mode
    if (this.shipHealthUI?.container) {
      if (this.firstPersonMode && this.cockpitWrapper) {
        this.cockpitWrapper.appendChild(this.shipHealthUI.container);
        this.shipHealthUI.setViewMode(true);
        // Pin in cockpit coordinates similar to other panels
        const sh = this.shipHealthUI.container.style;
        sh.position = 'absolute';
        sh.left = this._anchors.shipHealth.left;
        sh.top = this._anchors.shipHealth.top;
        sh.right = 'auto';
        sh.bottom = 'auto';
        sh.transform = 'translate(-50%, -50%)';
        // Keep existing styling as-is (identical between modes for now)
      } else if (this.uiContainer) {
        this.uiContainer.appendChild(this.shipHealthUI.container);
        this.shipHealthUI.setViewMode(false);
      }
    }



    // Crosshair
    this.crosshair = document.createElement('div');
    this.crosshair.className = 'crosshair';
    this.uiContainer.appendChild(this.crosshair);

    // Docking status display moved into Nav Target panel (bottom area)
    this.dockingStatus = document.createElement('div');
    this.dockingStatus.className = 'docking-status';
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

    // Predictive lead reticle is handled inside TargetUI; no auto-aim cone

    // Radar (two concentric circles) anchored relative to cockpit (top-based)
    this.radarWrapper = document.createElement('div');
    this.radarWrapper.className = 'radar-wrapper';
    this.radarWrapper.style.left = this._anchors.radar.left;
    this.radarWrapper.style.top = this._anchors.radar.top;
    this.radarWrapper.style.height = '140px';
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

    // Update ThrottleUI positioning for third-person view
    if (this.throttleUI) {
      this.throttleUI.setViewMode(false);
    }
    // Update ShipHealthUI layout for third-person (reparent to uiContainer)
    if (this.shipHealthUI?.container && this.uiContainer) {
      if (this.shipHealthUI.container.parentElement !== this.uiContainer) {
        this.uiContainer.appendChild(this.shipHealthUI.container);
      }
      this.shipHealthUI.setViewMode(false);
      // Allow free-floating positioning (center-bottom by default from component)
      const sh = this.shipHealthUI.container.style;
      sh.left = '50%';
      sh.right = 'auto';
      sh.top = 'auto';
      sh.bottom = '20px';
      sh.transform = 'translateX(-50%)';
    }
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
    // Throttle elements: move out of cockpit so they no longer parallax shift
    if (this.throttleUI?.throttleContainer) {
      if (this.throttleUI.throttleContainer.parentElement !== this.uiContainer) {
        this.uiContainer.appendChild(this.throttleUI.throttleContainer);
      }
      const p3 = this.throttleUI.throttleContainer.style;
      p3.position = 'absolute';
      p3.left = '20px';
      p3.top = 'auto';
      p3.right = 'auto';
      p3.bottom = '20px';
      p3.transform = 'none';
    }
    if (this.throttleUI?.speedDisplay) {
      if (this.throttleUI.speedDisplay.parentElement !== this.uiContainer) {
        this.uiContainer.appendChild(this.throttleUI.speedDisplay);
      }
      const p4 = this.throttleUI.speedDisplay.style;
      p4.position = 'absolute';
      p4.left = '20px';
      p4.top = 'auto';
      p4.right = 'auto';
      p4.bottom = '282px';
      p4.transform = 'none';
    }
  }

  // Switch back to first-person cockpit overlay layout
  applyFirstPersonLayout() {
    if (this.firstPersonMode) return; // already first-person
    this.firstPersonMode = true;

    // Update ThrottleUI positioning for first-person view
    if (this.throttleUI) {
      this.throttleUI.setViewMode(true);
    }
    // Update ShipHealthUI layout for first-person (reparent under cockpit)
    if (this.shipHealthUI?.container && this.cockpitWrapper) {
      if (this.shipHealthUI.container.parentElement !== this.cockpitWrapper) {
        this.cockpitWrapper.appendChild(this.shipHealthUI.container);
      }
      this.shipHealthUI.setViewMode(true);
      // Pin to cockpit anchor
      const sh = this.shipHealthUI.container.style;
      sh.position = 'absolute';
      sh.left = this._anchors.shipHealth.left;
      sh.top = this._anchors.shipHealth.top;
      sh.right = 'auto';
      sh.bottom = 'auto';
      sh.transform = 'translate(-50%, -50%)';
    }
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
    // Throttle elements: move into cockpit so parallax affects them
    if (this.throttleUI?.throttleContainer && this.cockpitWrapper && this.throttleUI.throttleContainer.parentElement !== this.cockpitWrapper) {
      this.cockpitWrapper.appendChild(this.throttleUI.throttleContainer);
    }
    if (this.throttleUI?.throttleContainer) {
      const p3 = this.throttleUI.throttleContainer.style;
      p3.position = 'absolute';
      p3.left = this._anchors.throttle.left;
      p3.top = this._anchors.throttle.top;
      p3.right = 'auto';
      p3.bottom = 'auto';
      p3.transform = 'translate(-50%, -50%)';
    }
    if (this.throttleUI?.speedDisplay && this.cockpitWrapper && this.throttleUI.speedDisplay.parentElement !== this.cockpitWrapper) {
      this.cockpitWrapper.appendChild(this.throttleUI.speedDisplay);
    }
    if (this.throttleUI?.speedDisplay) {
      const p4 = this.throttleUI.speedDisplay.style;
      p4.position = 'absolute';
      p4.left = this._anchors.speedometer.left;
      p4.top = this._anchors.speedometer.top;
      p4.right = 'auto';
      p4.bottom = 'auto';
      p4.transform = 'translate(-50%, -50%)';
    }
  }

  updateThrottle(targetSpeed, currentSpeed, maxSpeed) {
    this.throttleUI.updateThrottle(targetSpeed, currentSpeed, maxSpeed);
  }

  updateTargetInfo(targetInfo, targetPosition, camera) {
    this.targetUI.updateTargetInfo(targetInfo, targetPosition, camera);
  }

  updateLeadReticle(leadWorldPosition, camera) {
    if (this.targetUI?.updateLeadReticle) {
      this.targetUI.updateLeadReticle(leadWorldPosition, camera);
    }
  }

  clearTargetInfo() {
    this.targetUI.clearTargetInfo();
  }

  updateNavTargetInfo(navTargetInfo, targetPosition, camera) {
    this.navTargetUI.updateNavTargetInfo(navTargetInfo, targetPosition, camera);
    // Keep Jobs UI button states in sync with dock/sector context
    this.updateJobsContext();
  }

  clearNavTargetInfo() {
    this.navTargetUI.clearNavTargetInfo();
  }

  showServices(services, locationName) {
    // Cache context so sub-screens can return here on close/ESC
    this._lastServicesContext = { services: Array.isArray(services) ? [...services] : services, locationName };
    // Also suppress Options ESC momentarily when Services opens
    this._suppressOptionsEscUntil = Math.max(Date.now() + 300, this._suppressOptionsEscUntil || 0);
    this.servicesUI.showServices(services, locationName);
    this.debugFlagsUI.minimize();
  }

  hideServices() {
    this.servicesUI.hideServices();
    this.debugFlagsUI.restore();
  }

  isServicesVisible() {
    return this.servicesUI.isServicesVisible();
  }

  // --- Jobs UI methods ---
  showJobs() {
    // Mark that we should return to Services when this screen closes
    this._returnToServicesOnSubClose = true;
    // Ensure we have some available jobs for the current location
    const ctx = this._getCurrentDockContext();
    // Load from GameStateManager if available
    const gsm = this.game?.gameStateManager;
    const hasGsm = !!gsm;
    const hasGetAvail = hasGsm && typeof gsm.getJobsAvailableForLocation === 'function';
    const hasGetInProg = hasGsm && typeof gsm.getJobsInProgress === 'function';
    if (hasGetAvail) {
      try {
        this._jobsAvailable = gsm.getJobsAvailableForLocation(ctx) || [];
      } catch (e) {
        console.warn('GameStateManager.getJobsAvailableForLocation threw; falling back to generate', e);
        this._jobsAvailable = [];
      }
    }
    if (hasGetInProg) {
      try {
        this._jobsInProgress = gsm.getJobsInProgress() || [];
      } catch (e) {
        console.warn('GameStateManager.getJobsInProgress threw; continuing with local state', e);
      }
    }
    if (this._jobsAvailable.length === 0) {
      this._generateJobsForLocation(ctx);
      // Persist generated jobs if API exists
      if (hasGsm && typeof gsm.setJobsAvailableForLocation === 'function') {
        try { gsm.setJobsAvailableForLocation(ctx, this._jobsAvailable); } catch (_e) { /* no-op */ }
      }
    }
    if (this.jobsUI) {
      this.jobsUI.onAcceptJob = (job) => this._acceptJob(job);
      this.jobsUI.onCompleteJob = (job) => this._completeJob(job);
      this.jobsUI.onClose = () => {
        // When Jobs closes (via X or ESC), return to Services if context exists
        if (this._lastServicesContext) {
          this._returnToServices();
        }
      };

      // Ensure both columns are visible for the full jobs view
      this.jobsUI.setShowAvailableColumn(true);

      // Get sector map for distance calculations
      const sectorMap = this.mapUI?.sectorMap || null;

      this.jobsUI.show(this._annotateJobFit(this._jobsAvailable), this._jobsInProgress, ctx, sectorMap);
      this.debugFlagsUI.minimize();
    }
  }

  hideJobs() {
    if (!this.jobsUI) return;
    this.jobsUI.hide();
    this.debugFlagsUI.restore();
    // If we hid due to ESC/close while expecting a return, do it now
    if (this._returnToServicesOnSubClose && this._lastServicesContext) {
      this._returnToServices();
    }
  }

  showJobsInProgress() {
    // Lightweight version of showJobs that only shows jobs in progress
    // Load from GameStateManager if available
    const gsm = this.game?.gameStateManager;
    const hasGsm = !!gsm;
    const hasGetInProg = hasGsm && typeof gsm.getJobsInProgress === 'function';

    if (hasGetInProg) {
      try {
        this._jobsInProgress = gsm.getJobsInProgress() || [];
      } catch (e) {
        console.warn('GameStateManager.getJobsInProgress threw; continuing with local state', e);
      }
    }

    if (this.jobsUI) {
      // Only provide the complete job callback since this view is read-only for jobs in progress
      this.jobsUI.onCompleteJob = (job) => this._completeJob(job);
      this.jobsUI.onClose = null; // No special behavior on close

      // Get current dock context for completion eligibility checking
      const ctx = this._getCurrentDockContext();

      // Hide the Available Jobs column
      this.jobsUI.setShowAvailableColumn(false);

      // Get sector map for distance calculations
      const sectorMap = this.mapUI?.sectorMap || null;

      // Show only in-progress jobs with empty available jobs
      this.jobsUI.show([], this._jobsInProgress, ctx, sectorMap);
      this.debugFlagsUI.minimize();
    }
  }

  updateJobsContext() {
    if (!this.jobsUI?.isVisible) return;
    const ctx = this._getCurrentDockContext();
    const sectorMap = this.mapUI?.sectorMap || null;
    this.jobsUI.update(this._annotateJobFit(this._jobsAvailable), this._jobsInProgress, ctx, sectorMap);
  }

  _getCurrentDockContext() {
    // Sector id from SectorManager; location name from docking flags
    const sectorId = this?.game?.sectorManager?.currentSectorId || null;
    let locationName = null;
    const ship = this.spaceship;
    if (ship?.flags?.isDocked) {
      if (ship.flags.dockContext === 'planet') {
        const planet = this.game?.environmentSystem?.planets?.find(p => p.id === ship.flags.docketPlanetId);
        locationName = planet?.getName ? planet.getName() : null;
      } else if (ship.flags.dockContext === 'station') {
        const station = this.game?.environmentSystem?.stations?.find(s => s.id === ship.flags.dockedStationId);
        locationName = station?.getName ? station.getName() : null;
      }
    }
    return { sectorId, locationName, sectorName: this._getSectorName(sectorId) };
  }

  _getSectorName(id) {
    if (!id) return 'Unknown';
    const def = this.game ? this.game.availableSectors?.find(s => s.id === id) : null;
    return def?.name || id;
  }

  _generateJobsForLocation(ctx) {
    // Generate jobs using real sector definitions for destinations
    const options = [
      'Iron Ore', 'Copper Ore', 'Gold Ore', 'Steel Ingots', 'Electronics', 'Energy Cells', 'Fuel Rods',
      'Food Rations', 'Medical Supplies', 'Data Chips'
    ];
    const pick = () => options[Math.floor(Math.random() * options.length)];
    const sectors = this.game?.availableSectors || [];
    const jobs = [];
    const sectorMap = this.mapUI?.sectorMap || null;

    // Get all possible job destinations with their distances
    const getAllDestinationsWithDistance = () => {
      const destinations = [];
      if (!sectors.length) return destinations;

      // Get all valid job locations using the imported function
      const allLocations = enumerateJobsServiceLocations(sectors);

      for (const loc of allLocations) {
        // Skip current location
        if (loc.sectorId === ctx.sectorId && loc.locationName === ctx.locationName) continue;

        let distance = 1; // Default distance if we can't calculate
        if (sectorMap && ctx.sectorId) {
          const pathInfo = getShortestPath(sectorMap, ctx.sectorId, loc.sectorId);
          if (pathInfo) {
            distance = pathInfo.path.length - 1; // Exclude starting sector
          }
        }

        destinations.push({ ...loc, distance });
      }

      return destinations;
    };

    // Distance-weighted destination picker (favors closer destinations)
    const pickDestinationByDistance = () => {
      const destinations = getAllDestinationsWithDistance();
      if (destinations.length === 0) {
        return {
          sectorId: ctx.sectorId,
          sectorName: ctx.sectorName || 'Unknown Sector',
          locationName: ctx.locationName || 'Unknown',
          distance: 0
        };
      }

      // Create weights that favor closer destinations
      // Weight = 1 / (distance^1.5) to make longer trips significantly less likely
      const weights = destinations.map(dest => 1 / Math.pow(Math.max(dest.distance, 1), 1.5));
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);

      // Pick destination based on weighted probability
      let random = Math.random() * totalWeight;
      for (let i = 0; i < destinations.length; i++) {
        random -= weights[i];
        if (random <= 0) {
          return destinations[i];
        }
      }

      // Fallback to last destination
      return destinations[destinations.length - 1];
    };

    // Generate fewer jobs for variety, but still ensure some are available
    const jobCount = 2 + Math.floor(Math.random() * 2); // 2-3 jobs instead of always 3

    for (let i = 0; i < jobCount; i++) {
      const cargoName = pick();
      const cargoAmount = 3 + Math.floor(Math.random() * 5); // 3-7 units
      const dest = pickDestinationByDistance();

      // Distance-based reward calculation
      const baseReward = 100 + Math.floor(Math.random() * 200); // Reduced base randomness
      const cargoBonus = cargoAmount * 20;
      const distanceBonus = dest.distance * 75; // 75 credits per jump
      const distanceMultiplier = 1 + (dest.distance * 0.1); // 10% more per jump

      const reward = Math.floor((baseReward + cargoBonus + distanceBonus) * distanceMultiplier);

      jobs.push({
        id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: 'cargo',
        cargoName,
        cargoAmount,
        reward,
        distance: dest.distance, // Store distance in job object
        origin: { sectorId: ctx.sectorId, sectorName: ctx.sectorName, locationName: ctx.locationName },
        destination: {
          sectorId: dest.sectorId,
          sectorName: dest.sectorName,
          locationName: dest.locationName
        }
      });
    }
    this._jobsAvailable = jobs;
  }

  _annotateJobFit(jobs) {
    // mark jobs with canFit based on remaining cargo slots
    if (!this.cargoSystem) return jobs;
    const freeSlots = Math.max(0, (this.cargoSystem.maxCargoSlots || 0) - (this.cargoSystem.getCargoCount?.() || 0));
    return (jobs || []).map(j => ({ ...j, canFit: freeSlots >= j.cargoAmount }));
  }

  _acceptJob(job) {
    // Ensure cargoSystem reference is available
    if (!this.cargoSystem && this.game?.cargoSystem) {
      this.cargoSystem = this.game.cargoSystem;
    }
    if (!job || !this.cargoSystem) return;
    // Capacity check
    const freeSlots = Math.max(0, (this.cargoSystem.maxCargoSlots || 0) - (this.cargoSystem.getCargoCount?.() || 0));
    if (freeSlots < job.cargoAmount) {
      // Not enough cargo space to accept job
      // refresh UI state
      this.jobsUI?.update(this._annotateJobFit(this._jobsAvailable), this._jobsInProgress, this._getCurrentDockContext());
      return;
    }
    // Add cargo items tagged with jobId
    let addedCount = 0;
    for (let i = 0; i < job.cargoAmount; i++) {
      const added = this.cargoSystem.addCargoItem(job.cargoName, 'job');
      if (!added) break;
      const last = this.cargoSystem.cargo[this.cargoSystem.cargo.length - 1];
      if (last) last.jobId = job.id;
      addedCount++;
    }
    if (addedCount < job.cargoAmount) {
      // Failed to add full cargo for job; aborting accept
      // Rollback any partial adds tagged to this job
      for (let i = this.cargoSystem.cargo.length - 1; i >= 0; i--) {
        const it = this.cargoSystem.cargo[i];
        if (it && it.jobId === job.id && it.name === job.cargoName) {
          this.cargoSystem.removeCargo(i);
        }
      }
      this.jobsUI?.update(this._annotateJobFit(this._jobsAvailable), this._jobsInProgress, this._getCurrentDockContext());
      return;
    }
    // move job to in-progress
    this._jobsAvailable = this._jobsAvailable.filter(j => j.id !== job.id);
    this._jobsInProgress.push(job);
    // Persist (if GameStateManager jobs API present)
    const gsm = this.game?.gameStateManager;
    const ctx = this._getCurrentDockContext();
    if (gsm && typeof gsm.removeAvailableJob === 'function') {
      try { gsm.removeAvailableJob(ctx, job.id); } catch (_e) { /* ignore */ }
    }
    if (gsm && typeof gsm.addJobInProgress === 'function') {
      try { gsm.addJobInProgress(job); } catch (_e) { /* ignore */ }
    }
    if (gsm && typeof gsm.setJobsAvailableForLocation === 'function') {
      try { gsm.setJobsAvailableForLocation(ctx, this._jobsAvailable); } catch (_e) { /* ignore */ }
    }
    this.jobsUI?.update(this._annotateJobFit(this._jobsAvailable), this._jobsInProgress, this._getCurrentDockContext());
    // Also prevent sale in commodities UI by refreshing its cargo items (will filter later when we add restriction)
    this.updateCommoditiesCargoItems?.();
  }

  _completeJob(job) {
    if (!this.cargoSystem && this.game?.cargoSystem) {
      this.cargoSystem = this.game.cargoSystem;
    }
    if (!job || !this.cargoSystem) return;
    // Must be at destination and have required cargo items with jobId
    const ctx = this._getCurrentDockContext();
    const atDest = job.destination && job.destination.sectorId === ctx.sectorId && job.destination.locationName === ctx.locationName;
    if (!atDest) {
      this.jobsUI?.update(this._annotateJobFit(this._jobsAvailable), this._jobsInProgress, ctx);
      return;
    }
    // Remove job-tagged cargo
    let removed = 0;
    for (let i = this.cargoSystem.cargo.length - 1; i >= 0 && removed < job.cargoAmount; i--) {
      const it = this.cargoSystem.cargo[i];
      if (it && it.jobId === job.id && it.name === job.cargoName) {
        this.cargoSystem.removeCargo(i);
        removed++;
      }
    }
    if (removed < job.cargoAmount) {
      // Not enough cargo to complete
      this.jobsUI?.update(this._annotateJobFit(this._jobsAvailable), this._jobsInProgress, ctx);
      return;
    }
    // Pay reward
    if (this.spaceship?.addCash) {
      this.spaceship.addCash(job.reward);
      this.cashUI?.updateCash(this.spaceship.getCash());
    }
    // Remove job from in-progress
    this._jobsInProgress = this._jobsInProgress.filter(j => j.id !== job.id);
    // Persist (if GameStateManager jobs API present)
    const gsm = this.game?.gameStateManager;
    if (gsm && typeof gsm.removeJobInProgress === 'function') {
      try { gsm.removeJobInProgress(job.id); } catch (_e) { /* ignore */ }
    }
    // Refresh UI
    this.jobsUI?.update(this._annotateJobFit(this._jobsAvailable), this._jobsInProgress, ctx);
    // Update commodities cargo list
    this.updateCommoditiesCargoItems?.();
  }

  // Refuel & Repair UI methods
  showRefuelRepair() {
    if (!this.refuelRepairUI) return;
    this._returnToServicesOnSubClose = true;
    const hull = this.spaceship?.hullStrength ?? 100;
    const maxHull = (typeof this.spaceship?.maxHullStrength === 'number') ? this.spaceship.maxHullStrength : 100;
    const cash = this.spaceship?.getCash ? this.spaceship.getCash() : 0;
    // Ensure closing this modal returns to Services when appropriate
    this.refuelRepairUI.onClose = () => {
      if (this._lastServicesContext) {
        this._returnToServices();
      }
    };
    this.refuelRepairUI.show(hull, maxHull, cash);
    this.debugFlagsUI.minimize();
  }

  hideRefuelRepair() {
    if (!this.refuelRepairUI) return;
    this.refuelRepairUI.hide();
    this.debugFlagsUI.restore();
    if (this._returnToServicesOnSubClose && this._lastServicesContext) {
      this._returnToServices();
    }
  }

  updateRefuelRepair() {
    if (!this.refuelRepairUI || !this.refuelRepairUI.isVisible) return;
    const hull = this.spaceship?.hullStrength ?? 100;
    const maxHull = (typeof this.spaceship?.maxHullStrength === 'number') ? this.spaceship.maxHullStrength : 100;
    const cash = this.spaceship?.getCash ? this.spaceship.getCash() : 0;
    this.refuelRepairUI.update(hull, maxHull, cash);
  }

  repairHullToFull() {
    if (!this.spaceship) return;
    const maxHull = (typeof this.spaceship?.maxHullStrength === 'number') ? this.spaceship.maxHullStrength : 100;
    const currentHull = Math.max(0, Math.min(maxHull, Math.floor(this.spaceship.hullStrength ?? maxHull)));
    const missing = Math.max(0, maxHull - currentHull);
    const cost = missing; // $1 per point
    const currentCash = this.spaceship.getCash ? this.spaceship.getCash() : 0;
    if (missing <= 0) {
      this.refuelRepairUI?.setStatus('Hull already at maximum.');
      this.updateRefuelRepair();
      return;
    }
    if (currentCash < cost) {
      this.refuelRepairUI?.setStatus('Insufficient funds.');
      this.updateRefuelRepair();
      return;
    }
    // Deduct and repair
    this.spaceship.removeCash(cost);
    this.spaceship.hullStrength = maxHull;
    // Update ShipHealthUI
    if (this.shipHealthUI) {
      this.shipHealthUI.update(this.spaceship);
    }
    // Update cash display
    if (this.cashUI) {
      this.cashUI.updateCash(this.spaceship.getCash());
    }
    // Update this modal
    this.refuelRepairUI?.setStatus(`Repaired ${missing} hull for $${cost.toLocaleString()}.`);
    this.updateRefuelRepair();
  }

  // Outfitting UI methods
  showOutfitting() {
    if (!this.outfittingUI) return;
    this._returnToServicesOnSubClose = true;
    const equippedWeapon = this.spaceship?.equippedWeapon || 'Laser 1';
    const equippedHull = this.spaceship?.equippedHull || 'Medium Hull';
    const equippedThrusters = this.spaceship?.equippedThrusters || 'Basic Thrusters';
    const cash = this.spaceship?.getCash ? this.spaceship.getCash() : 0;
    this.outfittingUI.show(equippedWeapon, equippedHull, equippedThrusters, cash);
    this.debugFlagsUI.minimize();
  }

  hideOutfitting() {
    if (!this.outfittingUI) return;
    this.outfittingUI.hide();
    this.debugFlagsUI.restore();
    if (this._returnToServicesOnSubClose && this._lastServicesContext) {
      this._returnToServices();
    }
  }

  handleEquipmentPurchase(categoryName, equipmentName, finalCost, tradeInCredit) {
    if (!this.spaceship) return;
    const currentCash = this.spaceship.getCash ? this.spaceship.getCash() : 0;
    if (currentCash < finalCost) {
      console.log('Not enough cash to purchase equipment');
      return;
    }

    // Deduct final cost (already includes trade-in credit)
    this.spaceship.removeCash(finalCost);

    // Equip the item
    if (categoryName === 'WEAPONS') {
      this.spaceship.equippedWeapon = equipmentName;
    } else if (categoryName === 'HULLS') {
      this.spaceship.equippedHull = equipmentName;
    } else if (categoryName === 'THRUSTERS') {
      this.spaceship.equippedThrusters = equipmentName;
    }

    // Apply equipment modifiers to ship stats
    if (this.spaceship.applyEquipmentModifiers) {
      this.spaceship.applyEquipmentModifiers();
    }

    // Update ship health UI if hull was changed
    if (categoryName === 'HULLS' && this.shipHealthUI) {
      this.shipHealthUI.update(this.spaceship);
    }

    // Update cash display
    if (this.cashUI) {
      this.cashUI.updateCash(this.spaceship.getCash());
    }

    // Update outfitting UI
    this.outfittingUI.equippedWeapon = this.spaceship.equippedWeapon;
    this.outfittingUI.equippedHull = this.spaceship.equippedHull;
    this.outfittingUI.equippedThrusters = this.spaceship.equippedThrusters;
    this.outfittingUI.updateCash(this.spaceship.getCash());
    this.outfittingUI.updateDisplay();

    if (tradeInCredit > 0) {
      console.log(`Purchased and equipped ${equipmentName} for $${finalCost} (with $${tradeInCredit} trade-in credit)`);
    } else {
      console.log(`Purchased and equipped ${equipmentName} for $${finalCost}`);
    }
  }

  handleEquipmentSell(_categoryName, equipmentName, sellPrice) {
    if (!this.spaceship) return;

    // Add cash
    this.spaceship.addCash(sellPrice);

    // Note: We're selling currently equipped item, so we don't actually unequip it
    // (The player can't fly without equipment, so this is just for cash)
    // In a full implementation, you might want to prevent selling if it's the only item

    // Update cash display
    if (this.cashUI) {
      this.cashUI.updateCash(this.spaceship.getCash());
    }

    // Update outfitting UI
    this.outfittingUI.updateCash(this.spaceship.getCash());

    console.log(`Sold ${equipmentName} for $${sellPrice}`);
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

  setOnTitleStartAudio(callback) {
    this.titleOverlay.setOnStartAudio(callback);
  }

  isTitleVisible() {
    return this.titleOverlay && this.titleOverlay.isVisible;
  }

  // --- First-person cracks overlays for Target and Nav Target ---
  // These appear even if the actual panels are hidden, and render in front of the cockpit PNG
  showTargetNavCracksOverlay() {
    if (!this.cockpitWrapper) return;
    // Create or update NAV cracks overlay
    if (!this._navCracksOverlay) {
      this._navCracksOverlay = document.createElement('div');
      const el = this._navCracksOverlay;
      el.id = 'nav-cracks-overlay';
      el.style.position = 'absolute';
      el.style.pointerEvents = 'none';
      // In front of cockpit image (cockpitWrapper is z-index 500)
      el.style.zIndex = '550';
      // Position at nav anchor
      el.style.left = this._anchors.nav.left;
      el.style.top = this._anchors.nav.top;
      el.style.transform = 'translate(-50%, -50%)';
      el.style.width = '10%';
      el.style.height = '20%';
      this.cockpitWrapper.appendChild(el);
      // Draw SVG cracks
      const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('width','100%');
      svg.setAttribute('height','100%');
      svg.style.position = 'absolute';
      svg.style.left = '0';
      svg.style.top = '0';
      svg.style.pointerEvents = 'none';
      svg.style.zIndex = '1';
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2) * (i / 8) + Math.random() * 0.2;
        const x2 = 60 + Math.cos(angle) * 40;
        const y2 = 30 + Math.sin(angle) * 20;
        const line = document.createElementNS('http://www.w3.org/2000/svg','line');
        line.setAttribute('x1','60');
        line.setAttribute('y1','30');
        line.setAttribute('x2',String(x2));
        line.setAttribute('y2',String(y2));
        line.setAttribute('stroke','white');
        line.setAttribute('stroke-width','2');
        svg.appendChild(line);
      }
      el.appendChild(svg);
    }
    // Create or update TARGET cracks overlay
    if (!this._targetCracksOverlay) {
      this._targetCracksOverlay = document.createElement('div');
      const el = this._targetCracksOverlay;
      el.id = 'target-cracks-overlay';
      el.style.position = 'absolute';
      el.style.pointerEvents = 'none';
      el.style.zIndex = '550';
      // Position at target anchor
      el.style.left = this._anchors.target.left;
      el.style.top = this._anchors.target.top;
      el.style.transform = 'translate(-50%, -50%)';
      el.style.width = '10%';
      el.style.height = '20%';
      this.cockpitWrapper.appendChild(el);
      const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('width','100%');
      svg.setAttribute('height','100%');
      svg.style.position = 'absolute';
      svg.style.left = '0';
      svg.style.top = '0';
      svg.style.pointerEvents = 'none';
      svg.style.zIndex = '1';
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2) * (i / 8) + Math.random() * 0.2;
        const x2 = 60 + Math.cos(angle) * 40;
        const y2 = 30 + Math.sin(angle) * 20;
        const line = document.createElementNS('http://www.w3.org/2000/svg','line');
        line.setAttribute('x1','60');
        line.setAttribute('y1','30');
        line.setAttribute('x2',String(x2));
        line.setAttribute('y2',String(y2));
        line.setAttribute('stroke','white');
        line.setAttribute('stroke-width','2');
        svg.appendChild(line);
      }
      el.appendChild(svg);
    }
  }

  hideTargetNavCracksOverlay() {
    const removeEl = (el) => { if (el && el.parentElement) el.parentElement.removeChild(el); };
    removeEl(this._navCracksOverlay);
    removeEl(this._targetCracksOverlay);
    this._navCracksOverlay = null;
    this._targetCracksOverlay = null;
  }

  // Game Over overlay methods
  showGameOver() {
    this.gameOverOverlay?.show();
  }

  hideGameOver() {
    this.gameOverOverlay?.hide();
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

  // Method for testing spotlight functionality
  testTutorialSpotlight(elementId) {
    this.tutorialOverlay.testSpotlight(elementId);
  }

  // Method to clear spotlight for testing
  clearTutorialSpotlight() {
    this.tutorialOverlay.clearSpotlight();
  }

  // Method to test targeting spotlight specifically
  testTargetingSpotlight() {
    this.tutorialOverlay.testTargetingSpotlight();
  }

  // Method to test controls spotlight specifically
  testControlsSpotlight() {
    this.tutorialOverlay.testControlsSpotlight();
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
    } catch (_) { /* Parallax update failed */ }
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
    this.debugFlagsUI.minimize();
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
    this.debugFlagsUI.restore();
  }

  isCommsModalVisible() {
    return this.commsModal.style.display === 'block';
  }

  showMapModal(sectors) {
    // Get current sector ID from game engine if available
    const currentSectorId = this.game?.sectorManager?.currentSectorId || null;

    // Get job destination IDs from jobs in progress
    const jobDestinationIds = this._jobsInProgress.map(job => job.destination?.sectorId || job.destination?.id || job.destinationId).filter(Boolean);

    // Show the map using the MapUI component
    this.mapUI.show(sectors, currentSectorId, jobDestinationIds);
    this.debugFlagsUI.minimize();
  }

  hideMapModal() {
    this.mapUI.hide();
    this.debugFlagsUI.restore();
  }

  setOnMapSelect(cb) { this.onMapSelect = cb; }

  setOnCommsOptionClick(callback) {
    this.onCommsOptionClick = callback;
  }

  updateFlagsDisplay(playerFlags, globalFlags) {
    this.debugFlagsUI.updateFlagsDisplay(playerFlags, globalFlags);
  }

  updateCashDisplay(cashAmount) {
    if (this.cashUI) {
      this.cashUI.updateCash(cashAmount);
    }
  }

  // Commodities UI methods
  showCommodities(commodities) {
    if (this.commoditiesUI) {
      this._returnToServicesOnSubClose = true;
      this.commoditiesUI.updateCommodities(commodities);
      // Update cargo items in commodities UI
      if (this.cargoSystem) {
        const cargoItems = this.cargoSystem.getCargo();
        this.commoditiesUI.updateCargoItems(cargoItems);
      }
      // Update cash display in commodities UI
      if (this.spaceship) {
        const currentCash = this.spaceship.getCash();
        this.commoditiesUI.updateCash(currentCash);
      }
      // Ensure closing this modal returns to Services when appropriate
      this.commoditiesUI.onClose = () => {
        if (this._lastServicesContext) {
          this._returnToServices();
        }
      };
      this.commoditiesUI.show();
      this.debugFlagsUI.minimize();
    }
  }

  hideCommodities() {
    if (this.commoditiesUI) {
      this.commoditiesUI.hide();
      this.debugFlagsUI.restore();
      if (this._returnToServicesOnSubClose && this._lastServicesContext) {
        this._returnToServices();
      }
    }
  }

  isCommoditiesVisible() {
    return this.commoditiesUI ? this.commoditiesUI.isVisible : false;
  }

  showCommoditiesFromCurrentLocation() {
    // Get commodities from current location
    const commodities = this.getCurrentLocationCommodities();
    if (commodities && commodities.length > 0) {
      this.showCommodities(commodities);
    } else {
      // Show message that no commodities are available
      const noCommodities = [{ name: 'No commodities available', buyPrice: 0, sellPrice: 0 }];
      this.showCommodities(noCommodities);
    }
  }

  getCurrentLocationCommodities() {
    // Get tradeable items from the current docked location
    // This now returns complete item information including icons and colors
    return getTradeableItems();
  }

  handleCommoditiesSale(itemsToSell, totalValue) {
    console.log(`Commodities sale: ${itemsToSell.length} items for $${totalValue.toFixed(0)}`);

    // Add cash to spaceship
    if (this.spaceship) {
      this.spaceship.addCash(totalValue);
    }

    // Items are already removed from cargo system when using > buttons or clicking cargo
    // Just update the commodities UI to reflect current cargo state
    this.updateCommoditiesCargoItems();

    // Update cash display
    if (this.cashUI && this.spaceship) {
      const currentCash = this.spaceship.getCash();
      this.cashUI.updateCash(currentCash);
      // Also update commodities UI cash display
      if (this.commoditiesUI) {
        this.commoditiesUI.updateCash(currentCash);
      }
    }
  }

  handleCargoItemClick(itemData) {
    // Only handle clicks when commodities UI is visible
    if (this.isCommoditiesVisible()) {
      console.log('Cargo item clicked:', itemData);

      // Add to sell quantities - this will handle cargo removal
      this.commoditiesUI.increaseSellQuantity(itemData.name);
    }
  }

  addItemToCargo(item) {
    // Add item back to cargo system
    if (this.cargoSystem) {
      this.cargoSystem.addCargoItem(item.name, 'restored');
      // Update commodities UI with new cargo items
      this.updateCommoditiesCargoItems();
    }
  }

  removeItemsFromCargo(commodityName, quantity) {
    // Remove items from cargo system
    if (this.cargoSystem) {
      for (let i = 0; i < quantity; i++) {
        const cargoItems = this.cargoSystem.getCargo();
        // Only remove items not reserved for jobs
        const itemIndex = cargoItems.findIndex(item => item.name === commodityName && !item.jobId);
        if (itemIndex !== -1) {
          this.cargoSystem.removeCargo(itemIndex);
        }
      }
      // Update commodities UI with new cargo items
      this.updateCommoditiesCargoItems();
    }
  }

  updateCommoditiesCargoItems() {
    // Update cargo items in commodities UI
    if (this.commoditiesUI && this.cargoSystem) {
      const cargoItems = this.cargoSystem.getCargo();
      this.commoditiesUI.updateCargoItems(cargoItems);
    }
  }


  handleCommoditiesPurchase(itemsToBuy, totalCost) {
    // Check if purchase would exceed cargo capacity BEFORE deducting cash
    if (this.cargoSystem) {
      const currentCargoCount = this.cargoSystem.getCargoCount();
      const totalItemsToAdd = itemsToBuy.reduce((total, item) => total + item.quantity, 0);

      if (currentCargoCount + totalItemsToAdd > this.cargoSystem.maxCargoSlots) {
        console.log(`Purchase would exceed cargo capacity! Current: ${currentCargoCount}, Trying to add: ${totalItemsToAdd}, Max: ${this.cargoSystem.maxCargoSlots}`);
        return;
      }
    }

    // Deduct cash from spaceship
    if (this.spaceship) {
      this.spaceship.removeCash(totalCost);
    }

    // Add items to cargo system using unified method
    if (this.cargoSystem) {
      itemsToBuy.forEach(item => {
        for (let i = 0; i < item.quantity; i++) {
          const success = this.cargoSystem.addCargoItem(item.name, 'purchased');
          if (!success) {
            console.log('Cargo bay is full! Cannot add more items.');
            return;
          }
        }
      });
    }

    // Update commodities UI with new cargo items
    this.updateCommoditiesCargoItems();

    // Update cash display
    if (this.cashUI && this.spaceship) {
      const currentCash = this.spaceship.getCash();
      this.cashUI.updateCash(currentCash);
      // Also update commodities UI cash display
      if (this.commoditiesUI) {
        this.commoditiesUI.updateCash(currentCash);
      }
    }

    console.log(`Bought ${itemsToBuy.length} different items for $${totalCost.toFixed(0)}`);
  }

  // Helper method to get color for commodities
  getCommodityColor(commodityName) {
    const colorMap = {
      'Iron Ore': '#8B4513',
      'Copper Ore': '#B87333',
      'Gold Ore': '#FFD700',
      'Platinum Ore': '#E5E4E2',
      'Steel Ingots': '#C0C0C0',
      'Electronics': '#00FF00',
      'Advanced Circuits': '#00AA00',
      'Food Rations': '#FFA500',
      'Medical Supplies': '#FF69B4',
      'Luxury Goods': '#FFD700',
      'Energy Cells': '#00FFFF',
      'Fuel Rods': '#FF4500',
      'Data Chips': '#9370DB',
      'Quantum Processors': '#FF00FF'
    };
    return colorMap[commodityName] || '#00FF00'; // Default green color
  }

  // Method to get current player cash (placeholder for game integration)
  getCurrentCash() {
    // This will be replaced with actual spaceship.getCash() call
    return 0;
  }

  // Method to add cash to player (placeholder for game integration)
  addCash(amount) {
    // This will be replaced with actual spaceship.addCash() call
    console.log(`Adding $${amount} to player cash`);
    return amount;
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
          // Consume ESC and close Comms/Nav Comms without letting Options open
          event.preventDefault();
          if (event.stopImmediatePropagation) event.stopImmediatePropagation();
          else if (event.stopPropagation) event.stopPropagation();
          this._suppressOptionsEscUntil = Date.now() + 400;
          this.hideCommsModal();
        } else if (this.isMapModalVisible()) {
          // Similarly consume ESC for Map modal to avoid Options popping
          event.preventDefault();
          if (event.stopImmediatePropagation) event.stopImmediatePropagation();
          else if (event.stopPropagation) event.stopPropagation();
          this._suppressOptionsEscUntil = Date.now() + 400;
          this.hideMapModal();
        } else if (this.isCommoditiesVisible()) {
          // Close commodities and return to Services menu when context is available
          event.preventDefault();
          if (event.stopImmediatePropagation) event.stopImmediatePropagation();
          else if (event.stopPropagation) event.stopPropagation();
          this.hideCommodities();
          if (this._lastServicesContext) {
            this._returnToServices();
          }
        } else if (this.refuelRepairUI?.isVisible) {
          // Close refuel/repair and return to Services
          event.preventDefault();
          if (event.stopImmediatePropagation) event.stopImmediatePropagation();
          else if (event.stopPropagation) event.stopPropagation();
          this.hideRefuelRepair();
          if (this._lastServicesContext) {
            this._returnToServices();
          }
        } else if (this.jobsUI?.isVisible) {
          // Close jobs and return to Services
          event.preventDefault();
          if (event.stopImmediatePropagation) event.stopImmediatePropagation();
          else if (event.stopPropagation) event.stopPropagation();
          this.hideJobs();
          if (this._lastServicesContext) {
            this._returnToServices();
          }
        }
      }
    };
    document.addEventListener('keydown', this.modalEscapeKeyHandler);
  }

  // Helper: return to Services safely once
  _returnToServices() {
    // Avoid duplicate reopen attempts in the same cycle
    if (!this._lastServicesContext) return;
    const ctx = this._lastServicesContext;
    // Clear the flag first to prevent recursive loops
    this._returnToServicesOnSubClose = false;
    // Suppress global ESC->Options handling for a short window while we transition back
    this._suppressOptionsEscUntil = Date.now() + 50;
    // Defer a bit so Services ESC guard is active and key repeat settles
    setTimeout(() => {
      this.showServices(ctx.services, ctx.locationName);
      this.servicesUI?.suppressEscUntilKeyup?.();
    }, 120);
  }

  isMapModalVisible() {
    return this.mapUI.isVisible();
  }

  setGame(game) {
    this.game = game;
    this.spaceship = game ? game.spaceship : null;
    this.cargoSystem = game ? game.cargoSystem : null;
    this.optionsUI.setGame(game);
    this.optionsUI.onClose = () => {
      if (game && game.resume) {
        game.resume();
      }
    };
  }

  // Global UI state helpers for ESC/Options coordination
  // Return true if any major modal/screen is open (used to gate opening Options on ESC)
  isAnyModalOpenForEsc() {
    return (
      this.isCommsModalVisible() ||
      this.isMapModalVisible() ||
      this.isOptionsVisible() ||
      this.isTitleVisible() ||
      this.isServicesVisible() ||
      this.isCommoditiesVisible() ||
      !!(this.refuelRepairUI?.isVisible) ||
      !!(this.jobsUI?.isVisible)
    );
  }

  // Short-lived suppression after routing back to Services to avoid opening Options
  shouldSuppressOptionsEsc() {
    return Date.now() < (this._suppressOptionsEscUntil || 0);
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
