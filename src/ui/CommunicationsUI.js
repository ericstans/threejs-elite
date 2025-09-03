export class CommunicationsUI {
  constructor() {
    this.createCommsModal();
  }

  createCommsModal() {
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
    this.commsMessage.style.fontStyle = 'italic';
    this.commsContent.appendChild(this.commsMessage);

    // Comms modal options
    this.commsOptions = document.createElement('div');
    this.commsOptions.style.marginBottom = '20px';
    this.commsContent.appendChild(this.commsOptions);

    // Comms modal close instruction
    this.commsClose = document.createElement('div');
    this.commsClose.style.textAlign = 'center';
    this.commsClose.style.fontSize = '12px';
    this.commsClose.style.color = '#666';
    this.commsClose.textContent = 'Press ESC to close';
    this.commsContent.appendChild(this.commsClose);
  }

  showCommsModal(planetName, greeting, options = null) {
    this.commsTitle.textContent = `COMMUNICATIONS - ${planetName}`;
    this.commsMessage.textContent = greeting;
    
    // Clear previous options
    this.commsOptions.innerHTML = '';
    
    // Add communication options
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
    } else {
      // Default options if none provided
      const option1 = document.createElement('div');
      option1.style.marginBottom = '10px';
      option1.style.padding = '8px';
      option1.style.border = '1px solid #00ff00';
      option1.style.cursor = 'pointer';
      option1.style.transition = 'all 0.2s ease';
      option1.innerHTML = '<span style="color: #ffff00;">1.</span> Information about ' + planetName;
      option1.dataset.optionId = 'information';
      option1.dataset.optionIndex = '1';
      
      // Add hover effects
      option1.addEventListener('mouseenter', () => {
        option1.style.background = 'rgba(0, 255, 0, 0.1)';
        option1.style.border = '1px solid #00ff00';
      });
      
      option1.addEventListener('mouseleave', () => {
        option1.style.background = 'transparent';
        option1.style.border = '1px solid #00ff00';
      });
      
      // Add click handler
      option1.addEventListener('click', () => {
        if (this.onCommsOptionClick) {
          this.onCommsOptionClick(1);
        }
      });
      
      this.commsOptions.appendChild(option1);
      
      const option2 = document.createElement('div');
      option2.style.marginBottom = '10px';
      option2.style.padding = '8px';
      option2.style.border = '1px solid #00ff00';
      option2.style.cursor = 'pointer';
      option2.style.transition = 'all 0.2s ease';
      option2.innerHTML = '<span style="color: #ffff00;">2.</span> Request docking';
      option2.dataset.optionId = 'docking';
      option2.dataset.optionIndex = '2';
      
      // Add hover effects
      option2.addEventListener('mouseenter', () => {
        option2.style.background = 'rgba(0, 255, 0, 0.1)';
        option2.style.border = '1px solid #00ff00';
      });
      
      option2.addEventListener('mouseleave', () => {
        option2.style.background = 'transparent';
        option2.style.border = '1px solid #00ff00';
      });
      
      // Add click handler
      option2.addEventListener('click', () => {
        if (this.onCommsOptionClick) {
          this.onCommsOptionClick(2);
        }
      });
      
      this.commsOptions.appendChild(option2);
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

  hideCommsModal() {
    this.commsModal.style.display = 'none';
  }

  isCommsModalVisible() {
    return this.commsModal.style.display === 'block';
  }

  setOnCommsOptionClick(callback) {
    this.onCommsOptionClick = callback;
  }
}
