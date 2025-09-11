export class ServicesUI {
  constructor(container) {
    this.container = container;
    this.servicesModal = null;
    this.isVisible = false;
    this.onCommoditiesClick = null; // Callback for commodities service
    this.createServicesModal();
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
    this.instructions.textContent = 'Press ESC to close';
    this.servicesModal.appendChild(this.instructions);
    
  }

  showServices(services, locationName) {
    this.title.textContent = `SERVICES - ${locationName}`;

    // Clear existing services
    this.servicesList.innerHTML = '';

    // Service definitions
    const serviceDefinitions = {
      'refuel+repair': { name: 'Refuel & Repair', description: 'Refuel your ship and repair hull damage', icon: '🔧' },
      'shipyard': { name: 'Shipyard', description: 'Buy, sell, and upgrade ships', icon: '🚀' },
      'outfitting': { name: 'Outfitting', description: 'Install and upgrade ship equipment', icon: '⚙️' },
      'commodities': { name: 'Commodities', description: 'Buy and sell trade goods', icon: '📦' },
      'rumors': { name: 'Rumors', description: 'Gather information and rumors', icon: '💬' },
      'jobs': { name: 'Jobs', description: 'Find work and missions', icon: '📋' }
    };

    // Add each service
    services.forEach(serviceId => {
      const serviceDef = serviceDefinitions[serviceId] || { name: serviceId, description: 'Service available', icon: '❓' };

      const serviceItem = document.createElement('div');
      serviceItem.style.display = 'flex';
      serviceItem.style.alignItems = 'center';
      serviceItem.style.padding = '15px';
      serviceItem.style.border = '1px solid #00ff00';
      serviceItem.style.borderRadius = '4px';
      serviceItem.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
      serviceItem.style.cursor = 'pointer';
      serviceItem.style.transition = 'background-color 0.2s';
      serviceItem.style.pointerEvents = 'auto';
      serviceItem.style.userSelect = 'none';

      // Service icon
      const icon = document.createElement('div');
      icon.style.fontSize = '24px';
      icon.style.marginRight = '15px';
      icon.style.minWidth = '30px';
      icon.style.pointerEvents = 'none';
      icon.textContent = serviceDef.icon;
      serviceItem.appendChild(icon);

      // Service info
      const info = document.createElement('div');
      info.style.flex = '1';
      info.style.pointerEvents = 'none';

      const name = document.createElement('div');
      name.style.fontSize = '18px';
      name.style.fontWeight = 'bold';
      name.style.marginBottom = '5px';
      name.style.pointerEvents = 'none';
      name.textContent = serviceDef.name;
      info.appendChild(name);

      const description = document.createElement('div');
      description.style.fontSize = '14px';
      description.style.color = '#aaa';
      description.style.pointerEvents = 'none';
      description.textContent = serviceDef.description;
      info.appendChild(description);

      serviceItem.appendChild(info);

      // Hover effects
      serviceItem.addEventListener('mouseenter', () => {
        serviceItem.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
      });
      serviceItem.addEventListener('mouseleave', () => {
        serviceItem.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
      });

      // Click handler
      serviceItem.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        console.log(`Service clicked: ${serviceId}`);
        if (serviceId === 'commodities' && this.onCommoditiesClick) {
          console.log('Calling commodities callback');
          this.onCommoditiesClick();
        } else {
          console.log(`Selected service: ${serviceId}`);
          // TODO: Implement other service functionality
        }
      };
      
      // Also add a mousedown event to test
      serviceItem.addEventListener('mousedown', (event) => {
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
}
