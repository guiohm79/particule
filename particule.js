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
    
    // Si aucun capteur n'est disponible, on arrête
    if (!PM25 && !PM10) {
      this.content.innerHTML = 'Aucune entité trouvée';
      return;
    }
    
    // Si au moins un capteur est disponible, on continue
    const pm25Value = PM25 ? parseFloat(PM25.state) : null;
    const pm10Value = PM10 ? parseFloat(PM10.state) : null;
    
    // Calcul de l'indice de qualité d'air officiel ATMO adapté
    const aqi = this.calculateAQI(pm25Value, pm10Value);
    
    // Définir couleur et texte basés sur AQI
    const { color, gradient, text, emoji } = this.getAQIInfo(aqi);
    
    // Construction du HTML pour la partie détails, adaptée selon les capteurs disponibles
    let detailsHTML = '<div class="details">';
    
    if (PM25) {
      detailsHTML += `
        <div class="detail-box">
          <div class="detail-title">PM2.5</div>
          <div class="detail-value">${pm25Value.toFixed(1)}</div>
          <div class="detail-unit">µg/m³</div>
        </div>
      `;
    }
    
    if (PM10) {
      detailsHTML += `
        <div class="detail-box">
          <div class="detail-title">PM10</div>
          <div class="detail-value">${pm10Value.toFixed(1)}</div>
          <div class="detail-unit">µg/m³</div>
        </div>
      `;
    }
    
    detailsHTML += '</div>';
    
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
        .aqi-index {
          font-size: 0.8rem;
          margin-top: 5px;
          opacity: 0.8;
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
        <div class="air-quality-circle" id="circle">
          <div class="circle-content">
            <div class="emoji">${emoji}</div>
            <div class="aqi-value">${aqi.toFixed(1)}</div>
            <div class="aqi-text">${text}</div>
            <div class="aqi-index">Indice ATMO</div>
          </div>
          ${this.generateBubbleHTML(10)}
        </div>
        
        ${detailsHTML}
      </div>
    `;
    
    // Ajouter l'écouteur d'événement après création
    const circle = this.content.querySelector('#circle');
    if (circle) {
      circle.addEventListener('click', () => this._showMoreInfo());
    }
  }
  
  calculateAQI(pm25Value, pm10Value) {
    // Si une seule valeur est disponible, on utilise celle-là
    if (pm25Value === null) {
      return this.calculatePollutantIndex(pm10Value, [0, 20, 40, 50, 100, 150, 200, 300]);
    }
    
    if (pm10Value === null) {
      return this.calculatePollutantIndex(pm25Value, [0, 10, 20, 25, 50, 75, 100, 150]);
    }
    
    // Si les deux valeurs sont disponibles, on garde la logique actuelle
    const pm25Index = this.calculatePollutantIndex(pm25Value, [0, 10, 20, 25, 50, 75, 100, 150]);
    const pm10Index = this.calculatePollutantIndex(pm10Value, [0, 20, 40, 50, 100, 150, 200, 300]);
    
    // L'indice ATMO est le maximum des sous-indices
    return Math.max(pm25Index, pm10Index);
  }
  
  calculatePollutantIndex(value, thresholds) {
    // Si la valeur est inférieure au premier seuil significatif (après 0)
    if (value <= thresholds[1]) {
      return 1; // Très bon
    }
    
    // Parcourir les seuils pour trouver l'indice correspondant
    for (let i = 1; i < thresholds.length - 1; i++) {
      if (value <= thresholds[i+1]) {
        // Calcul de l'indice par interpolation linéaire
        const min = thresholds[i];
        const max = thresholds[i+1];
        return i + (value - min) / (max - min);
      }
    }
    
    // Si on dépasse le dernier seuil
    return 6; // Extrêmement mauvais
  }
  
  getAQIInfo(aqi) {
    // Indice ATMO officiel avec 6 niveaux
    if (aqi <= 1) {
      return {
        color: '#50F0E6',
        gradient: 'linear-gradient(135deg, #50F0E6, #32CFC6)',
        text: 'Très bon',
        emoji: '😊'
      };
    } else if (aqi <= 2) {
      return {
        color: '#50CCAA',
        gradient: 'linear-gradient(135deg, #50CCAA, #30AA88)',
        text: 'Bon',
        emoji: '🙂'
      };
    } else if (aqi <= 3) {
      return {
        color: '#F0E641',
        gradient: 'linear-gradient(135deg, #F0E641, #D0C621)',
        text: 'Moyen',
        emoji: '😐'
      };
    } else if (aqi <= 4) {
      return {
        color: '#FF9F38',
        gradient: 'linear-gradient(135deg, #FF9F38, #DF7F18)',
        text: 'Dégradé',
        emoji: '😕'
      };
    } else if (aqi <= 5) {
      return {
        color: '#FF5050',
        gradient: 'linear-gradient(135deg, #FF5050, #DF3030)',
        text: 'Mauvais',
        emoji: '😷'
      };
    } else {
      return {
        color: '#A04EFF',
        gradient: 'linear-gradient(135deg, #A04EFF, #802EDF)',
        text: 'Extrêmement mauvais',
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
    // On utilise le premier capteur disponible pour afficher plus d'infos
    const entityId = this.config.entity_pm25 || this.config.entity_pm10;
    const event = new Event('hass-more-info', {
      bubbles: true,
      composed: true
    });
    event.detail = { entityId };
    this.dispatchEvent(event);
  }
  
  setConfig(config) {
    if (!config.entity_pm25 && !config.entity_pm10) {
      throw new Error('Vous devez définir au moins une des entités: entity_pm25 ou entity_pm10');
    }
    this.config = config;
  }
  
  getCardSize() {
    return 3;
  }
}

customElements.define('air-quality-card', AirQualityCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'air-quality-card',
  name: 'Carte de Qualité d\'Air',
  description: 'Une carte dynamique pour visualiser la qualité de l\'air',
  preview: false,
});
