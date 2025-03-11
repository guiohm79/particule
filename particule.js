class AirQualityCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }
    
    set hass(hass) {
      this._hass = hass;
      
      if (!this.content) {
        const card = document.createElement('ha-card');
        card.header = this.config.title || 'Qualité de l\'Air';
        this.content = document.createElement('div');
        this.content.className = 'card-content';
        card.appendChild(this.content);
        this.shadowRoot.appendChild(card);
      }
  
      const PM25 = this.config.entity_pm25 ? hass.states[this.config.entity_pm25] : undefined;
      const PM10 = this.config.entity_pm10 ? hass.states[this.config.entity_pm10] : undefined;
      
      if (!PM25 || !PM10) {
        this.content.innerHTML = 'Entités non trouvées';
        return;
      }
      
      const pm25Value = parseFloat(PM25.state);
      const pm10Value = parseFloat(PM10.state);
      
      // Calcul de l'indice de qualité d'air (simplifié)
      const aqi = Math.max(
        this.calculateAQI(pm25Value, 25, 'pm25'),
        this.calculateAQI(pm10Value, 50, 'pm10')
      );
      
      // Définir couleur et texte basés sur AQI
      const { color, gradient, text, emoji } = this.getAQIInfo(aqi);
      
      this.content.innerHTML = `
        <style>
          :host {
            --aqi-color: ${color};
            --aqi-gradient: ${gradient};
          }
          .container {
            padding: 0.5rem;
          }
          .air-quality-circle {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            margin: 0 auto;
            background: var(--aqi-gradient);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            position: relative;
            overflow: hidden;
            transition: transform 0.3s ease;
            cursor: pointer;
          }
          .air-quality-circle:hover {
            transform: scale(1.05);
          }
          .air-quality-circle::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%);
            z-index: 1;
            opacity: 0.7;
          }
          .circle-content {
            z-index: 2;
            text-align: center;
          }
          .bubble {
            position: absolute;
            border-radius: 50%;
            background: rgba(255,255,255,0.15);
            animation: float 8s infinite ease-in-out;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
            10% { opacity: 0.5; }
            50% { transform: translateY(-20px) translateX(10px); opacity: 0.2; }
            90% { opacity: 0.5; }
          }
          .emoji {
            font-size: 2rem;
            margin-bottom: 5px;
          }
          .aqi-value {
            font-size: 2rem;
            font-weight: bold;
          }
          .aqi-text {
            font-size: 1rem;
            margin-top: 5px;
            max-width: 90%;
          }
          .details {
            display: flex;
            justify-content: space-around;
            margin-top: 1rem;
            text-align: center;
          }
          .detail-box {
            background-color: var(--card-background-color, #fff);
            padding: 0.7rem;
            border-radius: 12px;
            width: 45%;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            transition: transform 0.2s ease;
          }
          .detail-box:hover {
            transform: translateY(-3px);
          }
          .detail-title {
            font-size: 0.9rem;
            color: var(--secondary-text-color);
            margin-bottom: 5px;
          }
          .detail-value {
            font-size: 1.4rem;
            font-weight: bold;
            color: var(--primary-text-color);
          }
          .detail-unit {
            font-size: 0.8rem;
            color: var(--secondary-text-color);
          }
          /* Création des bulles aléatoires */
          ${this.generateBubbleCSS(10)}
        </style>
        
        <div class="container">
          <div class="air-quality-circle" @click=${() => this._showMoreInfo()}>
            <div class="circle-content">
              <div class="emoji">${emoji}</div>
              <div class="aqi-value">${Math.round(aqi)}</div>
              <div class="aqi-text">${text}</div>
            </div>
            ${this.generateBubbleHTML(10)}
          </div>
          
          <div class="details">
            <div class="detail-box">
              <div class="detail-title">PM2.5</div>
              <div class="detail-value">${pm25Value.toFixed(1)}</div>
              <div class="detail-unit">µg/m³</div>
            </div>
            <div class="detail-box">
              <div class="detail-title">PM10</div>
              <div class="detail-value">${pm10Value.toFixed(1)}</div>
              <div class="detail-unit">µg/m³</div>
            </div>
          </div>
        </div>
      `;
    }
    
    calculateAQI(value, threshold, type) {
      // Calcul simplifié de l'indice
      if (type === 'pm25') {
        return (value / threshold) * 100;
      } else {
        return (value / threshold) * 100;
      }
    }
    
    getAQIInfo(aqi) {
      if (aqi <= 20) {
        return {
          color: '#48d45a',
          gradient: 'linear-gradient(135deg, #48d45a, #10A674)',
          text: 'Excellent',
          emoji: '😊'
        };
      } else if (aqi <= 40) {
        return {
          color: '#a8e05f',
          gradient: 'linear-gradient(135deg, #a8e05f, #48d45a)',
          text: 'Bon',
          emoji: '🙂'
        };
      } else if (aqi <= 60) {
        return {
          color: '#FFCE47',
          gradient: 'linear-gradient(135deg, #FFCE47, #FDBB2F)',
          text: 'Moyen',
          emoji: '😐'
        };
      } else if (aqi <= 80) {
        return {
          color: '#FF9447',
          gradient: 'linear-gradient(135deg, #FF9447, #FF7547)',
          text: 'Mauvais',
          emoji: '😷'
        };
      } else {
        return {
          color: '#FF5E57',
          gradient: 'linear-gradient(135deg, #FF5E57, #D81C38)',
          text: 'Très Mauvais',
          emoji: '🤢'
        };
      }
    }
    
    generateBubbleCSS(count) {
      let css = '';
      for (let i = 0; i < count; i++) {
        const delay = (Math.random() * 5).toFixed(1);
        const duration = 3 + Math.random() * 7;
        css += `
          .bubble:nth-child(${i + 1}) {
            animation-delay: ${delay}s;
            animation-duration: ${duration}s;
          }
        `;
      }
      return css;
    }
    
    generateBubbleHTML(count) {
      let html = '';
      for (let i = 0; i < count; i++) {
        const size = 5 + Math.random() * 20;
        const top = Math.random() * 100;
        const left = Math.random() * 100;
        html += `<div class="bubble" style="width: ${size}px; height: ${size}px; top: ${top}%; left: ${left}%;"></div>`;
      }
      return html;
    }
    
    _showMoreInfo() {
      const event = new Event('hass-more-info', {
        bubbles: true,
        composed: true
      });
      event.detail = { entityId: this.config.entity_pm25 };
      this.dispatchEvent(event);
    }
    
    setConfig(config) {
      if (!config.entity_pm25 || !config.entity_pm10) {
        throw new Error('Vous devez définir les entités entity_pm25 et entity_pm10');
      }
      this.config = config;
    }
    
    getCardSize() {
      return 3;
    }
  }
  
  customElements.define('air-quality-card', AirQualityCard);
  
  class AirQualityCardEditor extends HTMLElement {
    setConfig(config) {
      this._config = config;
    }
  
    get _entity_pm25() {
      return this._config.entity_pm25 || '';
    }
    
    get _entity_pm10() {
      return this._config.entity_pm10 || '';
    }
    
    get _title() {
      return this._config.title || 'Qualité de l\'Air';
    }
  
    render() {
      if (!this._config) {
        return;
      }
  
      const hass = this._hass;
      if (!hass) {
        return;
      }
  
      const sensorEntities = Object.keys(hass.states).filter(
        (eid) => eid.substr(0, 7) === 'sensor.'
      );
  
      return html`
        <div class="card-config">
          <paper-input
            label="Titre"
            .value="${this._title}"
            .configValue="${'title'}"
            @value-changed="${this._valueChanged}"
          ></paper-input>
          
          <ha-entity-picker
            label="Entité PM2.5"
            .hass="${this._hass}"
            .value="${this._entity_pm25}"
            .configValue="${'entity_pm25'}"
            .includeDomains="${['sensor']}"
            @value-changed="${this._valueChanged}"
          ></ha-entity-picker>
          
          <ha-entity-picker
            label="Entité PM10"
            .hass="${this._hass}"
            .value="${this._entity_pm10}"
            .configValue="${'entity_pm10'}"
            .includeDomains="${['sensor']}"
            @value-changed="${this._valueChanged}"
          ></ha-entity-picker>
        </div>
      `;
    }
  
    _valueChanged(ev) {
      if (!this._config || !this._hass) {
        return;
      }
      
      const target = ev.target;
      if (this[`_${target.configValue}`] === target.value) {
        return;
      }
      
      if (target.configValue) {
        if (target.value === '') {
          delete this._config[target.configValue];
        } else {
          this._config = {
            ...this._config,
            [target.configValue]: target.value,
          };
        }
      }
      
      this.dispatchEvent(new CustomEvent('config-changed', {
        detail: { config: this._config },
      }));
    }
  }
  
  customElements.define('air-quality-card-editor', AirQualityCardEditor);
  
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'air-quality-card',
    name: 'Carte de Qualité d\'Air',
    description: 'Une carte dynamique pour visualiser la qualité de l\'air',
    preview: false,
  });