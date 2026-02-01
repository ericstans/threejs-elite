import { getShortestPath } from '../util/mapGraphGenerator.js';

export class JobsUI {
  constructor(container) {
    this.container = container;
    this.isVisible = false;
    this.availableJobs = [];
    this.inProgressJobs = [];
    this.currentContext = { sectorId: null, locationName: null };
    this.sectorMap = null; // Store sector map for distance calculations
    this.onAcceptJob = null;
    this.onCompleteJob = null;
    this.onClose = null; // Host-provided callback when Jobs closes
    this.showAvailableColumn = true; // Flag to control if the available jobs column is visible
    this._build();
  }

  _build() {
    this.modal = document.createElement('div');
    this.modal.style.position = 'fixed';
    this.modal.style.top = '0';
    this.modal.style.left = '0';
    this.modal.style.width = '100%';
    this.modal.style.height = '100%';
    this.modal.style.background = 'rgba(0, 0, 0, 0.8)';
    this.modal.style.display = 'none';
    this.modal.style.zIndex = '10000';
    this.modal.style.pointerEvents = 'auto';
    // Attach to document.body to avoid pointer-events issues from parent containers
    document.body.appendChild(this.modal);

    this.content = document.createElement('div');
    this.content.style.position = 'absolute';
    this.content.style.top = '50%';
    this.content.style.left = '50%';
    this.content.style.transform = 'translate(-50%, -50%)';
    this.content.style.width = '80%';
    this.content.style.maxWidth = '1100px';
    this.content.style.height = '80%';
    this.content.style.background = 'rgba(0, 20, 0, 0.95)';
    this.content.style.border = '2px solid #00ff00';
    this.content.style.borderRadius = '8px';
    this.content.style.padding = '20px';
    this.content.style.fontFamily = 'PeaberryMono, monospace';
    this.content.style.color = '#00ff00';
    this.content.style.overflow = 'hidden';
    // Ensure content receives pointer events explicitly
    this.content.style.pointerEvents = 'auto';
    this.modal.appendChild(this.content);

    // Header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '16px';
    header.style.borderBottom = '1px solid #00ff00';
    header.style.paddingBottom = '8px';
    this.content.appendChild(header);

    this.title = document.createElement('h2');
    this.title.textContent = 'JOBS';
    this.title.style.margin = '0';
    this.title.style.fontSize = '22px';
    this.title.style.fontWeight = 'bold';
    header.appendChild(this.title);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.background = 'transparent';
    closeBtn.style.border = '1px solid #00ff00';
    closeBtn.style.color = '#00ff00';
    closeBtn.style.padding = '4px 10px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontFamily = 'PeaberryMono, monospace';
    closeBtn.addEventListener('click', () => this.hide());
    header.appendChild(closeBtn);

    // Columns
    const columns = document.createElement('div');
    columns.style.display = 'grid';
    columns.style.gridTemplateColumns = '1fr 1fr';
    columns.style.gap = '20px';
    columns.style.height = 'calc(100% - 60px)';
    columns.style.pointerEvents = 'auto';
    this.content.appendChild(columns);

    // Left column - Available Jobs
    const left = document.createElement('div');
    left.style.pointerEvents = 'auto';
    const leftTitle = document.createElement('h3');
    leftTitle.textContent = 'AVAILABLE JOBS';
    leftTitle.style.margin = '0 0 10px 0';
    left.appendChild(leftTitle);
    this.availableList = document.createElement('div');
    this.availableList.style.overflowY = 'auto';
    this.availableList.style.pointerEvents = 'auto';
    left.appendChild(this.availableList);
    columns.appendChild(left);

    // Right column - Jobs in Progress
    const right = document.createElement('div');
    right.style.pointerEvents = 'auto';
    const rightTitle = document.createElement('h3');
    rightTitle.textContent = 'JOBS IN PROGRESS';
    rightTitle.style.margin = '0 0 10px 0';
    right.appendChild(rightTitle);
    this.progressList = document.createElement('div');
    this.progressList.style.overflowY = 'auto';
    this.progressList.style.pointerEvents = 'auto';
    right.appendChild(this.progressList);
    columns.appendChild(right);

    // Event delegation for clicks on Accept/Complete buttons
    const availDelegate = (e) => {
      if (!this.isVisible) return;
      const t = /** @type {any} */ (e.target);
      const btn = t && t.closest ? t.closest('button') : null;
      if (!btn) return;
      if (btn.dataset && btn.dataset.action === 'accept') {
        const jobId = btn.dataset.jobId;
        const job = this.availableJobs.find(j => j.id === jobId);
        if (job && this.onAcceptJob) this.onAcceptJob(job);
      }
    };
    this.availableList.addEventListener('click', availDelegate);
    this.availableList.addEventListener('mousedown', availDelegate, true);
    if (this.availableList.addEventListener) {
      this.availableList.addEventListener('pointerdown', availDelegate, true);
    }

    const progDelegate = (e) => {
      if (!this.isVisible) return;
      const t = /** @type {any} */ (e.target);
      const btn = t && t.closest ? t.closest('button') : null;
      if (!btn) return;
      if (btn.dataset && btn.dataset.action === 'complete') {
        const jobId = btn.dataset.jobId;
        const job = this.inProgressJobs.find(j => j.id === jobId);
        if (job && this.onCompleteJob) this.onCompleteJob(job);
      }
    };
    this.progressList.addEventListener('click', progDelegate);
    this.progressList.addEventListener('mousedown', progDelegate, true);
    if (this.progressList.addEventListener) {
      this.progressList.addEventListener('pointerdown', progDelegate, true);
    }

    // ESC handler
    this._escHandler = (e) => {
      if (!this.isVisible) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        else if (e.stopPropagation) e.stopPropagation();
        this.hide();
      }
    };
    document.addEventListener('keydown', this._escHandler);
    // Remove debug logging; keep only functional delegation

    // Capture-phase accept/complete action via delegation on modal
    const modalDelegatedHandler = (e) => {
      if (!this.isVisible) return;
      const t = /** @type {any} */ (e.target);
      const btn = t && t.closest ? t.closest('button') : null;
      if (!btn || !btn.dataset) return;
      if (btn.dataset.action === 'accept') {
        const job = this.availableJobs.find(j => j.id === btn.dataset.jobId);
        if (job && this.onAcceptJob) {
          e.preventDefault();
          e.stopPropagation();
          this.onAcceptJob(job);
        }
      } else if (btn.dataset.action === 'complete') {
        const job = this.inProgressJobs.find(j => j.id === btn.dataset.jobId);
        if (job && this.onCompleteJob) {
          e.preventDefault();
          e.stopPropagation();
          this.onCompleteJob(job);
        }
      }
    };
    this.modal.addEventListener('click', modalDelegatedHandler, true);
    this.modal.addEventListener('pointerdown', modalDelegatedHandler, true);
  }

  show(availableJobs, inProgressJobs, context, sectorMap = null) {
    this.availableJobs = availableJobs || [];
    this.inProgressJobs = inProgressJobs || [];
    this.currentContext = context || this.currentContext;
    this.sectorMap = sectorMap || this.sectorMap; // Update sector map if provided
    this._renderLists();
    this._updateColumnLayout(); // Apply column visibility settings
    this.modal.style.display = 'block';
    this.isVisible = true;
  }

  hide() {
    this.modal.style.display = 'none';
    this.isVisible = false;
    if (typeof this.onClose === 'function') {
      try { this.onClose(); } catch (_) { /* ignore errors */ }
    }
  }

  setShowAvailableColumn(show) {
    this.showAvailableColumn = show;
    this._updateColumnLayout();
  }

  _updateColumnLayout() {
    // Get references to the columns container and the left column (Available Jobs)
    const columns = this.content.querySelector('div[style*="grid-template-columns"]');
    const leftColumn = columns?.children[0];

    if (columns && leftColumn) {
      if (this.showAvailableColumn) {
        // Show both columns
        /** @type {HTMLElement} */ (columns).style.gridTemplateColumns = '1fr 1fr';
        /** @type {HTMLElement} */ (leftColumn).style.display = 'block';
        // Center the content properly
        this.content.style.maxWidth = '1100px';
        // Update title for full jobs view
        this.title.textContent = 'JOBS';
      } else {
        // Hide available jobs column, only show in-progress column
        /** @type {HTMLElement} */ (columns).style.gridTemplateColumns = '1fr';
        /** @type {HTMLElement} */ (leftColumn).style.display = 'none';
        // Adjust width for single column
        this.content.style.maxWidth = '700px';
        // Update title for in-progress only view
        this.title.textContent = 'JOBS IN PROGRESS';
      }
    }
  }

  update(availableJobs, inProgressJobs, context, sectorMap = null) {
    this.availableJobs = availableJobs ?? this.availableJobs;
    this.inProgressJobs = inProgressJobs ?? this.inProgressJobs;
    this.currentContext = context ?? this.currentContext;
    this.sectorMap = sectorMap || this.sectorMap; // Update sector map if provided
    if (this.isVisible) this._renderLists();
  }

  _renderLists() {
    this.availableList.innerHTML = '';
    this.progressList.innerHTML = '';
    for (const job of this.availableJobs) {
      this.availableList.appendChild(this._renderJobCard(job, 'available'));
    }
    for (const job of this.inProgressJobs) {
      this.progressList.appendChild(this._renderJobCard(job, 'progress'));
    }
  }

  _renderJobCard(job, listType) {
    const card = document.createElement('div');
    card.style.border = '1px solid #00aa55';
    card.style.borderRadius = '4px';
    card.style.background = 'rgba(0, 170, 85, 0.1)';
    card.style.padding = '10px';
    card.style.marginBottom = '10px';
    card.style.pointerEvents = 'auto';

    const line = (label, value) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.gap = '10px';
      const l = document.createElement('div');
      l.textContent = label;
      l.style.fontWeight = 'bold';
      const v = document.createElement('div');
      v.textContent = value;
      row.appendChild(l);
      row.appendChild(v);
      return row;
    };

    card.appendChild(line('TYPE', job.type.toUpperCase()));
    card.appendChild(line('CARGO', `${job.cargoName} × ${job.cargoAmount}`));
    card.appendChild(line('DEST SECTOR', job.destination.sectorName));
    card.appendChild(line('DEST LOCATION', job.destination.locationName));

    // Calculate and display distance/fuel cost
    const currentSectorId = this.currentContext?.sectorId;

    // Use stored distance if available, otherwise calculate it
    let distance = null;
    let fuelCost = null;

    if (typeof job.distance === 'number') {
      // Use pre-calculated distance from job generation
      distance = job.distance;
      fuelCost = distance; // Assume 1 fuel per jump for now
    } else if (this.sectorMap && currentSectorId && job.destination?.sectorId) {
      // Calculate distance dynamically
      const pathInfo = getShortestPath(this.sectorMap, currentSectorId, job.destination.sectorId);
      if (pathInfo) {
        distance = pathInfo.path.length - 1; // Exclude starting sector
        fuelCost = pathInfo.totalCost;
      }
    }

    if (distance !== null) {
      card.appendChild(line('DISTANCE', `${distance} jump${distance !== 1 ? 's' : ''} (${fuelCost} fuel)`));
    } else {
      card.appendChild(line('DISTANCE', 'Unknown'));
    }

    card.appendChild(line('REWARD', `¤${job.reward.toLocaleString()}`));

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.style.marginTop = '8px';
    btn.style.background = 'rgba(0, 255, 0, 0.2)';
    btn.style.border = '1px solid #00ff00';
    btn.style.color = '#00ff00';
    btn.style.padding = '8px 14px';
    btn.style.cursor = 'pointer';
    btn.style.fontFamily = 'PeaberryMono, monospace';
    btn.style.fontSize = '14px';
    btn.style.position = 'relative';
    btn.style.zIndex = '10001';
    btn.style.pointerEvents = 'auto';

    // Fallback: clicking the card also triggers the action
    card.addEventListener('click', (e) => {
      if (!this.isVisible) return;
      const t = /** @type {any} */ (e.target);
      // If the click is already on a button, let the button handler run
      if (t && t.closest && t.closest('button')) return;
      if (listType === 'available') {
        const canFit = typeof job.canFit === 'boolean' ? job.canFit : true;
        if (canFit && this.onAcceptJob) {
          this.onAcceptJob(job);
        }
      } else {
        const atDestination = this._atDestination(job);
        if (atDestination && this.onCompleteJob) {
          this.onCompleteJob(job);
        }
      }
    });

    if (listType === 'available') {
      btn.textContent = 'ACCEPT JOB';
      const canFit = typeof job.canFit === 'boolean' ? job.canFit : true;
      btn.disabled = !canFit;
      btn.style.opacity = canFit ? '1' : '0.5';
      btn.style.cursor = canFit ? 'pointer' : 'not-allowed';
      btn.dataset.action = 'accept';
      btn.dataset.jobId = job.id;
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        this.onAcceptJob && this.onAcceptJob(job);
      });
      // Remove transient debug listeners
    } else {
      btn.textContent = 'COMPLETE JOB';
      const atDestination = this._atDestination(job);
      btn.disabled = !atDestination;
      btn.style.opacity = atDestination ? '1' : '0.5';
      btn.style.cursor = atDestination ? 'pointer' : 'not-allowed';
      btn.dataset.action = 'complete';
      btn.dataset.jobId = job.id;
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        this.onCompleteJob && this.onCompleteJob(job);
      });
      // Remove transient debug listeners
    }
    card.appendChild(btn);
    return card;
  }

  _atDestination(job) {
    const ctx = this.currentContext && typeof this.currentContext === 'object' ? this.currentContext : { sectorId: null, locationName: null };
    const ctxSector = (ctx && 'sectorId' in ctx) ? ctx.sectorId : null;
    const ctxLoc = (ctx && 'locationName' in ctx) ? ctx.locationName : null;
    return (
      !!job.destination &&
      job.destination.sectorId === ctxSector &&
      job.destination.locationName === ctxLoc
    );
  }
}
