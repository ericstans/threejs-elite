export class JobsUI {
  constructor(container) {
    this.container = container;
    this.isVisible = false;
    this.availableJobs = [];
    this.inProgressJobs = [];
    this.currentContext = { sectorId: null, locationName: null };
    this.onAcceptJob = null;
    this.onCompleteJob = null;
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
    this.modal.style.zIndex = '4000';
    this.modal.style.pointerEvents = 'auto';
    this.container.appendChild(this.modal);

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
    this.content.appendChild(columns);

    // Left column - Available Jobs
    const left = document.createElement('div');
    const leftTitle = document.createElement('h3');
    leftTitle.textContent = 'AVAILABLE JOBS';
    leftTitle.style.margin = '0 0 10px 0';
    left.appendChild(leftTitle);
    this.availableList = document.createElement('div');
    this.availableList.style.overflowY = 'auto';
    left.appendChild(this.availableList);
    columns.appendChild(left);

    // Right column - Jobs in Progress
    const right = document.createElement('div');
    const rightTitle = document.createElement('h3');
    rightTitle.textContent = 'JOBS IN PROGRESS';
    rightTitle.style.margin = '0 0 10px 0';
    right.appendChild(rightTitle);
    this.progressList = document.createElement('div');
    this.progressList.style.overflowY = 'auto';
    right.appendChild(this.progressList);
    columns.appendChild(right);

    // ESC handler
    this._escHandler = (e) => {
      if (!this.isVisible) return;
      if (e.key === 'Escape') this.hide();
    };
    document.addEventListener('keydown', this._escHandler);
  }

  show(availableJobs, inProgressJobs, context) {
    this.availableJobs = availableJobs || [];
    this.inProgressJobs = inProgressJobs || [];
    this.currentContext = context || this.currentContext;
    this._renderLists();
    this.modal.style.display = 'block';
    this.isVisible = true;
  }

  hide() {
    this.modal.style.display = 'none';
    this.isVisible = false;
  }

  update(availableJobs, inProgressJobs, context) {
    this.availableJobs = availableJobs ?? this.availableJobs;
    this.inProgressJobs = inProgressJobs ?? this.inProgressJobs;
    this.currentContext = context ?? this.currentContext;
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
    card.appendChild(line('REWARD', `$${job.reward.toLocaleString()}`));

    const btn = document.createElement('button');
    btn.style.marginTop = '8px';
    btn.style.background = 'rgba(0, 255, 0, 0.2)';
    btn.style.border = '1px solid #00ff00';
    btn.style.color = '#00ff00';
    btn.style.padding = '8px 14px';
    btn.style.cursor = 'pointer';
    btn.style.fontFamily = 'PeaberryMono, monospace';
    btn.style.fontSize = '14px';

    if (listType === 'available') {
      btn.textContent = 'ACCEPT JOB';
      const canFit = typeof job.canFit === 'boolean' ? job.canFit : true;
      btn.disabled = !canFit;
      btn.style.opacity = canFit ? '1' : '0.5';
      btn.style.cursor = canFit ? 'pointer' : 'not-allowed';
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        this.onAcceptJob && this.onAcceptJob(job);
      });
    } else {
      btn.textContent = 'COMPLETE JOB';
      const atDestination = this._atDestination(job);
      btn.disabled = !atDestination;
      btn.style.opacity = atDestination ? '1' : '0.5';
      btn.style.cursor = atDestination ? 'pointer' : 'not-allowed';
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        this.onCompleteJob && this.onCompleteJob(job);
      });
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
