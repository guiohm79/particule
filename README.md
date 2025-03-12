
Permet de visualiser un ou deux capteurs de qualité de l'air de type SDS011 (particules 2.5 et 10 µm)

# particule
carte pour homeassistant

<img width="589" alt="image" src="https://github.com/guiohm79/particule/blob/main/capture.png">

```yaml
type: 'custom:air-quality-card'
title: 'Qualité de l''Air'
entity_pm25: sensor.particule_2_5mm_concentration
entity_pm10: sensor.particule_10_0mm_concentration
