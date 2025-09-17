export class ServicesUI {
  constructor(container) {
    this.container = container;
    this.servicesModal = null;
    this.isVisible = false;
    this.onCommoditiesClick = null; // Callback for commodities service
    this.onRefuelRepairClick = null; // Callback for refuel & repair service
    this.availableServices = []; // Track available services for number key mapping
    this.createServicesModal();
    this.setupKeyboardHandlers();
  }

  createServicesModal() {
    // Services modal container
    this.servicesModal = document.createElement('div');
    this.servicesModal.style.position = 'fixed';
    this.servicesModal.style.top = '50%';
    this.servicesModal.style.left = '50%';
    this.servicesModal.style.transform = 'translate(-50%, -50%)';
    this.servicesModal.style.width = '600px';
    this.servicesModal.style.maxHeight = '80vh';
    this.servicesModal.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
    this.servicesModal.style.border = '2px solid #00ff00';
    this.servicesModal.style.borderRadius = '8px';
    this.servicesModal.style.padding = '20px';
    this.servicesModal.style.zIndex = '3000';
    this.servicesModal.style.display = 'none';
    this.servicesModal.style.fontFamily = 'PeaberryMono, monospace';
    this.servicesModal.style.color = '#00ff00';
    this.servicesModal.style.overflowY = 'auto';
    this.container.appendChild(this.servicesModal);

    // Title
    this.title = document.createElement('div');
    this.title.style.fontSize = '24px';
    this.title.style.fontWeight = 'bold';
    this.title.style.textAlign = 'center';
    this.title.style.marginBottom = '20px';
    this.title.style.borderBottom = '1px solid #00ff00';
    this.title.style.paddingBottom = '10px';
    this.servicesModal.appendChild(this.title);

    // Services list
    this.servicesList = document.createElement('div');
    this.servicesList.style.display = 'flex';
    this.servicesList.style.flexDirection = 'column';
    this.servicesList.style.gap = '10px';
    this.servicesModal.appendChild(this.servicesList);

    // Instructions
    this.instructions = document.createElement('div');
    this.instructions.style.fontSize = '14px';
    this.instructions.style.textAlign = 'center';
    this.instructions.style.marginTop = '20px';
    this.instructions.style.color = '#888';
    this.instructions.innerHTML = 'Press <strong>1-9</strong> to select services or <strong>ESC</strong> to close';
    this.servicesModal.appendChild(this.instructions);

  }

  setupKeyboardHandlers() {
    this.keyHandler = (event) => {
      if (!this.isVisible) return;

      // Handle number keys 1-9
      if (event.code >= 'Digit1' && event.code <= 'Digit9') {
        event.preventDefault();
        const serviceIndex = parseInt(event.code.replace('Digit', '')) - 1;
        this.selectServiceByIndex(serviceIndex);
        return;
      }
      // Handle ESC to close services
      if (event.code === 'Escape') {
        event.preventDefault();
        this.hideServices();
      }
    };

    document.addEventListener('keydown', this.keyHandler);
  }

  selectServiceByIndex(index) {
    if (index >= 0 && index < this.availableServices.length) {
      const serviceItem = this.servicesList.children[index];
      if (serviceItem) {
        // Trigger click via event to avoid type issues on Element
        const evt = new MouseEvent('click', { bubbles: true, cancelable: true });
        serviceItem.dispatchEvent(evt);
      }
    }
  }

  showServices(services, locationName) {
    this.title.textContent = `SERVICES - ${locationName}`;

    // Clear existing services and reset available services
    this.servicesList.innerHTML = '';
    this.availableServices = [];

    // Service definitions
    const serviceDefinitions = {
      'refuel+repair': { name: 'Refuel & Repair', description: 'Refuel your ship and repair hull damage', icon: '🔧', implemented: true },
      'shipyard': { name: 'Shipyard', description: 'Buy, sell, and upgrade ships', icon: '🚀', implemented: false },
      'outfitting': { name: 'Outfitting', description: 'Install and upgrade ship equipment', icon: '⚙️', implemented: false },
      'commodities': { name: 'Commodities', description: 'Buy and sell trade goods', icon: '📦', implemented: true },
      'rumors': { name: 'Rumors', description: 'Gather information and rumors', icon: '💬', implemented: false },
      'jobs': { name: 'Jobs', description: 'Find work and missions', icon: '📋', implemented: false }
    };

    // Add each service
    services.forEach((serviceId, index) => {
      this.availableServices.push(serviceId);
      const serviceDef = serviceDefinitions[serviceId] || { name: serviceId, description: 'Service available', icon: '❓', implemented: false };
      const isImplemented = serviceDef.implemented;

      const serviceItem = document.createElement('div');
      serviceItem.style.display = 'flex';
      serviceItem.style.alignItems = 'center';
      serviceItem.style.padding = '15px';
      serviceItem.style.border = isImplemented ? '1px solid #00ff00' : '1px solid #666';
      serviceItem.style.borderRadius = '4px';
      serviceItem.style.backgroundColor = isImplemented ? 'rgba(0, 255, 0, 0.1)' : 'rgba(100, 100, 100, 0.1)';
      serviceItem.style.cursor = isImplemented ? 'pointer' : 'not-allowed';
      serviceItem.style.transition = 'background-color 0.2s';
      serviceItem.style.pointerEvents = 'auto';
      serviceItem.style.userSelect = 'none';
      serviceItem.style.opacity = isImplemented ? '1' : '0.5';

      // Service icon
      const icon = document.createElement('div');
      icon.style.fontSize = '24px';
      icon.style.marginRight = '15px';
      icon.style.minWidth = '30px';
      icon.style.pointerEvents = 'none';
      icon.textContent = serviceDef.icon;
      serviceItem.appendChild(icon);

      // Number indicator
      const numberIndicator = document.createElement('div');
      numberIndicator.style.fontSize = '16px';
      numberIndicator.style.fontWeight = 'bold';
      numberIndicator.style.marginRight = '15px';
      numberIndicator.style.minWidth = '20px';
      numberIndicator.style.textAlign = 'center';
      numberIndicator.style.pointerEvents = 'none';
      numberIndicator.style.color = isImplemented ? '#00ff00' : '#666';
      numberIndicator.textContent = (index + 1).toString();
      serviceItem.appendChild(numberIndicator);

      // Service info
      const info = document.createElement('div');
      info.style.flex = '1';
      info.style.pointerEvents = 'none';

      const name = document.createElement('div');
      name.style.fontSize = '18px';
      name.style.fontWeight = 'bold';
      name.style.marginBottom = '5px';
      name.style.pointerEvents = 'none';
      name.style.color = isImplemented ? '#00ff00' : '#666';
      name.textContent = serviceDef.name;
      info.appendChild(name);

      const description = document.createElement('div');
      description.style.fontSize = '14px';
      description.style.color = isImplemented ? '#aaa' : '#555';
      description.style.pointerEvents = 'none';
      description.textContent = isImplemented ? serviceDef.description : `${serviceDef.description} (Coming Soon)`;
      info.appendChild(description);

      serviceItem.appendChild(info);

      // Hover effects (only for implemented services)
      if (isImplemented) {
        serviceItem.addEventListener('mouseenter', () => {
          serviceItem.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
        });
        serviceItem.addEventListener('mouseleave', () => {
          serviceItem.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
        });
      }

      // Click handler
      serviceItem.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!isImplemented) {
          console.log(`Service not implemented: ${serviceId}`);
          return;
        }

        console.log(`Service clicked: ${serviceId}`);
        if (serviceId === 'commodities' && this.onCommoditiesClick) {
          console.log('Calling commodities callback');
          this.hideServices();
          this.onCommoditiesClick();
        } else if (serviceId === 'refuel+repair' && this.onRefuelRepairClick) {
          console.log('Calling refuel+repair callback');
          this.hideServices();
          this.onRefuelRepairClick();
        } else {
          console.log(`Selected service: ${serviceId}`);
          // TODO: Implement other service functionality
        }
      };

      // Also add a mousedown event to test
      serviceItem.addEventListener('mousedown', (event) => {
        if (!isImplemented) {
          event.preventDefault();
          return;
        }
        console.log(`Service mousedown: ${serviceId}`);
      });

      this.servicesList.appendChild(serviceItem);
    });

    this.servicesModal.style.display = 'block';
    this.isVisible = true;
  }

  hideServices() {
    this.servicesModal.style.display = 'none';
    this.isVisible = false;
  }

  isServicesVisible() {
    return this.isVisible;
  }

  setOnRefuelRepairClick(callback) {
    this.onRefuelRepairClick = callback;
  }

  // Cleanup method to remove event listeners
  destroy() {
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
    }
  }
}
