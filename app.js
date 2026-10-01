const source = window.mhuJamsaContract;
if (!source || source.type !== "FeatureCollection" || !Array.isArray(source.features) || source.features.length === 0) {
  throw new Error("Väyläviraston Jämsän tieaineisto puuttuu tai on virheellinen.");
}

const contract = {
  id: "jamsa",
  name: "Jämsän hoitourakka",
  area: "Jämsä · Keski-Suomi",
  officialName: source.contract,
  code: source.contractCode,
  roads: [...new Set(source.features.map(feature => String(feature.properties.tie)))].sort((left, right) => Number(left) - Number(right))
};
const earthRadius = 6378137;
const projectedWorldWidth = 2 * Math.PI * earthRadius;
function projectMercator(lng, lat) {
  return {
    x: earthRadius * lng * Math.PI / 180,
    y: earthRadius * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360))
  };
}
function geometryLengthMeters(geometry) {
  const lines = geometry.type === "MultiLineString" ? geometry.coordinates : [geometry.coordinates];
  let total = 0;
  for (const line of lines) {
    for (let index = 1; index < line.length; index += 1) {
      const start = projectMercator(line[index - 1][0], line[index - 1][1]);
      const end = projectMercator(line[index][0], line[index][1]);
      total += Math.hypot(end.x - start.x, end.y - start.y);
    }
  }
  return total;
}
const indexedFeatures = source.features.map(feature => {
  const bounds = { minLng: Infinity, minLat: Infinity, maxLng: -Infinity, maxLat: -Infinity };
  function collectBounds(coordinates) {
    if (Array.isArray(coordinates) && typeof coordinates[0] === "number") {
      bounds.minLng = Math.min(bounds.minLng, coordinates[0]);
      bounds.maxLng = Math.max(bounds.maxLng, coordinates[0]);
      bounds.minLat = Math.min(bounds.minLat, coordinates[1]);
      bounds.maxLat = Math.max(bounds.maxLat, coordinates[1]);
      return;
    }
    if (Array.isArray(coordinates)) coordinates.forEach(collectBounds);
  }
  collectBounds(feature.geometry.coordinates);
  return {
    feature,
    roadId: String(feature.properties.tie),
    totalLength: geometryLengthMeters(feature.geometry),
    minX: earthRadius * bounds.minLng * Math.PI / 180,
    maxX: earthRadius * bounds.maxLng * Math.PI / 180,
    minY: earthRadius * Math.log(Math.tan(Math.PI / 4 + bounds.minLat * Math.PI / 360)),
    maxY: earthRadius * Math.log(Math.tan(Math.PI / 4 + bounds.maxLat * Math.PI / 360))
  };
});
const roadsById = new Map(contract.roads.map(road => [road, indexedFeatures.filter(indexed => indexed.roadId === road)]));
const roadLabel = tie => Number(tie) === 9 ? "Valtatie 9" : `Tie ${tie}`;
const taskSideLabel = side => side === "right" ? "Oikea" : side === "left" ? "Vasen" : "";
const roadFeatureGroups = new Map();
const signImageFiles = {
  A1: "A1.1.svg",
  "A1.1": "A1.1.svg",
  "A1.2": "A1.2.svg",
  A10: "A10.svg",
  A11: "A11.svg",
  A12: "A12.svg",
  A15: "A15.svg",
  A17: "A17.svg",
  "A20.1": "A20.1.svg",
  "A20.2": "A20.2.svg",
  "A20.3": "A20.3.svg",
  A21: "A21.svg",
  A23: "A23.svg",
  B5: "B5.svg",
  B6: "B6.svg",
  B7: "B7.svg",
  C1: "C1.svg",
  C32: "C32.svg",
  C37: "C37.svg",
  D1: "D1.1.svg",
  "D1.1": "D1.1.svg",
  "D1.2": "D1.2.svg",
  "D1.3": "D1.3.svg",
  E1: "E1.svg",
  E2: "E2.svg"
};
const signImageBaseUrl = "https://raw.githubusercontent.com/finnishtransportagency/liikennemerkit/35be7a6593e70c8ed5f4e3ef54372d69a3fef558/collections/new_signs/svg/";
const invasiveSpeciesImageUrl = "https://vieraslajit.fi/assets/images/logos/vieraslajit_tekstiton.png";
const taskTypes = {
  sign: { label: "Liikennemerkki", icon: "⚠", className: "" },
  "guardrail-damage": { label: "Kaidevaurio", icon: "!", className: "guardrail-damage-task" },
  "pavement-damage": { label: "Päällystevaurio", icon: "▱", className: "pavement-damage-task" },
  "road-settlement": { label: "Tien painuma / sortuma", icon: "⚠", className: "road-settlement-task" },
  culvert: { label: "Rumpuhavainto", icon: "⊙", className: "culvert-task" },
  "rest-area": { label: "Pysäkki / levähdysalue", icon: "▣", className: "rest-area-task" },
  "hazardous-tree": { label: "Vaarallinen puu", icon: "♣", className: "hazardous-tree-task" },
  roadwork: { label: "Tietyö", icon: "⚠", className: "roadwork-task" },
  "oil-gravel": { label: "Paikkaustarve", icon: "Ö", className: "oil-task" },
  "invasive-species": { label: "Vieraslajihavainto", icon: "🌿", className: "invasive-species-task" },
  other: { label: "Muu työ", icon: "✳", className: "other-task" }
};
const removedTaskTypeLabels = {
  road: "Tien kunnossapito",
  drainage: "Kuivatusongelma",
  "roadside-marker": "Reunapaalu / aurausviitta",
  cleanup: "Tienvarren siivous",
  "sight-obstruction": "Näkemäeste",
  "shoulder-slope": "Piennar- tai luiskaongelma",
  "winter-maintenance": "Talvihoito",
  lighting: "Tievalaistus"
};
const taskTypeImages = {
  "pavement-damage": { src: "pavement-damage-icon.png?v=generated-pothole", alt: "Päällysteen kuoppa" },
  "hazardous-tree": { src: "hazardous-tree-icon.png", alt: "Kaatunut puu ja kanto" },
  culvert: { src: "culvert-icon.svg?v=straight-blue-striped-pipe", alt: "Musta ja sinisellä raidalla merkitty rumpuputki" },
  "road-settlement": { src: "road-settlement-icon.png", alt: "Painunut ja haljennut tie" },
  "rest-area": { src: "rest-area-icon.png?v=generated-bus-shelter", alt: "Pysäkkikatos" },
  "guardrail-damage": { src: "guardrail-damage-icon.png", alt: "Tienkaide ja punainen rasti" }
};
const storageKey = "mhu-tyokartta-jamsa-v2";
const visibleTypesStorageKey = "mhu-tyokartta-visible-types-v1";
const taskTypesText = ["A15 – suojatien ennakkovaroitus", "A20.1 – hirvi", "C32 – nopeusrajoitus", "E1 – suojatie"];
const seedTasks = [
  { id: "jamsa-01", contract: contract.id, type: "sign", sign: taskTypesText[0], road: "56", lat: 61.8508, lng: 25.1753, location: "Jämsä · keskusta", description: "Suojatien ennakkovaroitusmerkki on haalistunut. Uusitaan merkki ja tarkistetaan kiinnitys.", date: "Tänään, 09.42" },
  { id: "jamsa-02", contract: contract.id, type: "road-settlement", road: "6040", lat: 61.9181, lng: 25.1686, location: "Jämsä · pohjoinen", description: "Tarkistetaan tien reunan painuma ja korjataan vaurioitunut kohta.", date: "Tänään, 08.15" },
  { id: "jamsa-03", contract: contract.id, type: "sign", sign: taskTypesText[2], road: "9", lat: 61.8186, lng: 25.0204, location: "Jämsän länsiosa", description: "Nopeusrajoitusmerkki on kääntynyt vinoon. Oikaistaan pylväs.", date: "Eilen, 15.30" }
];

const contractSelect = document.querySelector("#contract-select");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const mapCanvas = document.querySelector("#map-canvas");
const modalBackdrop = document.querySelector("#modal-backdrop");
const form = document.querySelector("#work-form");
const typeSelect = document.querySelector("#work-type");
const signSelect = document.querySelector("#sign-id");
const signSearchQuery = document.querySelector("#sign-search-query");
const signSearchStatus = document.querySelector("#sign-search-status");
const roadSelect = document.querySelector("#work-road");
const sideSelect = document.querySelector("#work-side");
const locationDisplay = document.querySelector("#work-location-display");
const locationPrimary = document.querySelector("#work-location-primary");
const locationSecondary = document.querySelector("#work-location-secondary");
const photoInput = document.querySelector("#work-photo");
const formError = document.querySelector("#form-error");
const toast = document.querySelector("#toast");

let currentTasks = loadTasks();
let photoData = "";
let editingTaskId = null;
let pickingLocation = false;
let pickedPosition = null;
let draftMarker = null;
let toastTimer;
let visibleTaskTypes = loadVisibleTaskTypes();

const map = L.map("leaflet-map", {
  zoomControl: false,
  attributionControl: false,
  preferCanvas: true,
  minZoom: 7,
  maxZoom: 19
}).setView([61.86, 25.2], 10);

const tileThemes = {
  osm: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>',
    provider: ""
  },
  basemap: {
    url: "https://tile.openstreetmap.de/{z}/{x}/{y}.png",
    attribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>',
    provider: '<a href="https://tile.openstreetmap.de/" target="_blank" rel="noreferrer">tiles © openstreetmap.de</a>'
  }
};
let activeTileLayer;

function setMapTheme(themeId) {
  const theme = tileThemes[themeId];
  if (!theme) throw new Error(`Tuntematon karttateema: ${themeId}`);
  if (activeTileLayer) map.removeLayer(activeTileLayer);
  activeTileLayer = L.tileLayer(theme.url, { maxZoom: 19 }).addTo(map);
  mapCanvas.classList.toggle("basemap-theme", themeId === "basemap");
  document.querySelector("#basemap-attribution").outerHTML = theme.attribution.replace("<a ", '<a id="basemap-attribution" ');
  const providerCredit = document.querySelector("#basemap-provider-credit");
  providerCredit.innerHTML = theme.provider;
  providerCredit.hidden = !theme.provider;
  document.querySelectorAll(".map-theme-button").forEach(button => {
    const isActive = button.dataset.mapTheme === themeId;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

setMapTheme("osm");

// Tieluokan väritys mukailee Väyläviraston Suomen väylät -karttapalvelua:
// valtatiet magenta, seutu- ja yhdystiet violetti, pidemmän numeroinnin yhdystiet oranssi.
// Ramppien/liittymien numerot (+70000 tien perusnumeroon) perivät perustien värin.
function roadClassColor(tie) {
  let roadNumber = Number(tie);
  if (!Number.isFinite(roadNumber)) return "#8a0fa6";
  while (roadNumber >= 70000) roadNumber -= 70000;
  if (roadNumber < 100) return "#e600a9";
  if (roadNumber < 10000) return "#8a0fa6";
  return "#ff6e26";
}

const roadColorThemeStorageKey = "mhu-tyokartta-tie-varitreema-v1";
const roadColorThemes = {
  class: feature => roadClassColor(feature?.properties?.tie),
  mono: () => "#b9633e"
};

const roadsLayer = L.geoJSON(source, {
  interactive: false,
  style: feature => ({
    color: roadColorThemes.class(feature),
    weight: 4,
    opacity: 0.88,
    lineCap: "round",
    lineJoin: "round"
  })
}).addTo(map);

function setRoadColorTheme(themeId) {
  const colorFn = roadColorThemes[themeId];
  if (!colorFn) throw new Error(`Tuntematon tien väriteema: ${themeId}`);
  roadsLayer.setStyle(feature => ({
    color: colorFn(feature),
    weight: 4,
    opacity: 0.88,
    lineCap: "round",
    lineJoin: "round"
  }));
  document.querySelectorAll(".map-road-theme-button").forEach(button => {
    const isActive = button.dataset.roadTheme === themeId;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  document.querySelector("#map-legend-class").hidden = themeId !== "class";
  document.querySelector("#map-legend-mono").hidden = themeId !== "mono";
  localStorage.setItem(roadColorThemeStorageKey, themeId);
}

setRoadColorTheme(localStorage.getItem(roadColorThemeStorageKey) === "mono" ? "mono" : "class");

const markersLayer = L.layerGroup().addTo(map);
const currentLocationLayer = L.layerGroup().addTo(map);
const draftIcon = L.divIcon({
  className: "task-map-icon",
  html: '<span class="marker-shape draft-shape"><span>+</span></span>',
  iconSize: [33, 39],
  iconAnchor: [16, 33]
});

function loadTasks() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === null) return seedTasks.map(task => ({ ...task }));
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || parsed.some(task => !task || typeof task.id !== "string" || task.contract !== contract.id)) {
      throw new Error("Tallennettujen Jämsän töiden muoto ei kelpaa.");
    }

    const correctedSigns = new Map([
      ["A1 – mutka", "A1.1 – mutka"],
      ["A10 – liikennevalot", "A23 – liikennevalot"],
      ["A17 – suojatien ennakkovaroitus", "A15 – suojatien ennakkovaroitus"],
      ["A21 – hirvieläimiä", "A20.1 – hirvi"],
      ["B7 – etuajo-oikeutettu tie", "B7 – väistämisvelvollisuus pyöräilijän tienylityspaikassa"],
      ["D1 – pakollinen ajosuunta", "D1.1 – pakollinen ajosuunta"]
    ]);
    let migrated = false;
    const tasks = parsed.map(task => {
      if (task.type === "roadwork" && task.sign !== "A11 – tietyö") {
        migrated = true;
        return { ...task, sign: "A11 – tietyö" };
      }
      const correctedSign = task.type === "sign" ? correctedSigns.get(task.sign) : undefined;
      if (!correctedSign) return task;
      migrated = true;
      return { ...task, sign: correctedSign };
    });
    if (migrated) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(tasks));
      } catch (error) {
        console.error("Korjattujen liikennemerkkitunnusten tallentaminen epäonnistui.", error);
        window.setTimeout(() => showToast("Liikennemerkkien tunnukset korjattiin näkymässä, mutta tallennus epäonnistui."), 0);
      }
    }
    return tasks;
  } catch (error) {
    console.error("Tallennettujen töiden lukeminen epäonnistui.", error);
    window.setTimeout(() => showToast("Tallennettuja töitä ei voitu lukea. Käytössä ovat esimerkkitiedot."), 0);
    return seedTasks.map(task => ({ ...task }));
  }
}

function loadVisibleTaskTypes() {
  try {
    const saved = localStorage.getItem(visibleTypesStorageKey);
    if (saved === null) return new Set(Object.keys(taskTypes));
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || parsed.some(type => typeof type !== "string")) {
      throw new Error("Tallennettu karttasuodatin ei ole kelvollinen.");
    }
    return new Set(parsed.filter(type => Object.hasOwn(taskTypes, type)));
  } catch (error) {
    console.error("Karttasuodattimen lataaminen epäonnistui.", error);
    window.setTimeout(() => showToast("Karttasuodattimen asetuksia ei voitu lukea."), 0);
    return new Set(Object.keys(taskTypes));
  }
}

function renderMapTypeFilters() {
  const filterList = document.querySelector("#map-filter-list");
  filterList.innerHTML = Object.entries(taskTypes).map(([type, meta]) => `
    <label class="map-filter-option">
      <input type="checkbox" value="${escapeHtml(type)}" ${visibleTaskTypes.has(type) ? "checked" : ""}>
      <span>${escapeHtml(meta.label)}</span>
    </label>
  `).join("");
  updateMapFilterSummary();
}

function updateMapFilterSummary() {
  const total = Object.keys(taskTypes).length;
  const visibleCount = visibleTaskTypes.size;
  const summary = document.querySelector("#map-filter-summary");
  summary.textContent = visibleCount === total
    ? "Näytä kaikki työtyypit"
    : visibleCount === 0
      ? "Työtyypit piilotettu"
      : `Näytetään ${visibleCount} / ${total} työtyyppiä`;
  const selectAll = document.querySelector("#map-filter-all");
  selectAll.checked = visibleCount === total;
  selectAll.indeterminate = visibleCount > 0 && visibleCount < total;
}

function saveVisibleTaskTypes() {
  try {
    localStorage.setItem(visibleTypesStorageKey, JSON.stringify([...visibleTaskTypes]));
    return true;
  } catch (error) {
    console.error("Karttasuodattimen tallentaminen epäonnistui.", error);
    showToast("Suodatin muuttui, mutta asetusta ei voitu tallentaa.");
    return false;
  }
}

function saveTasks() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(currentTasks));
    document.querySelector(".sync-status span:last-child").textContent = "Tiedot tallessa";
    document.querySelector(".status-dot").style.background = "#4da878";
    return true;
  } catch (error) {
    console.error("Töiden tallentaminen epäonnistui.", error);
    document.querySelector(".sync-status span:last-child").textContent = "Tallennus ei onnistunut";
    document.querySelector(".status-dot").style.background = "#c07848";
    showToast("Tallennus epäonnistui. Tarkista selaimen tallennustila.");
    return false;
  }
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

const roadDisplay = document.querySelector("#work-road-display");

function setRoadDisplay(roadId) {
  roadSelect.value = roadId ? String(roadId) : "";
  roadDisplay.textContent = roadId ? roadLabel(roadId) : "Tieosuus täyttyy automaattisesti sijainnin valinnasta";
  roadDisplay.classList.toggle("placeholder", !roadId);
}

function setLocationDisplay(roadId, roadAddress, latlng) {
  const addressText = formatRoadAddress(roadAddress);
  locationPrimary.textContent = [roadId ? roadLabel(roadId) : "", addressText].filter(Boolean).join(" · ") || "Sijainti valittu";
  locationSecondary.textContent = latlng ? formatCoordinates(latlng) : "";
  locationDisplay.classList.remove("placeholder");
}

function resetLocationDisplay() {
  locationPrimary.textContent = "Valitse sijainti kartalta";
  locationSecondary.textContent = "";
  locationDisplay.classList.add("placeholder");
}

function formatCoordinates(latlng) {
  return `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
}

function roadAddressAtProgress(indexedFeature, progressLength) {
  const props = indexedFeature.feature.properties;
  if (!Number.isFinite(props.aosa) || !Number.isFinite(props.aet)) return null;
  const totalLength = indexedFeature.totalLength;
  const ratio = totalLength > 0 ? Math.max(0, Math.min(1, progressLength / totalLength)) : 0;
  if (!Number.isFinite(props.losa) || !Number.isFinite(props.let) || props.losa === props.aosa) {
    const etaisyys = Math.round(props.aet + ((props.let ?? props.aet) - props.aet) * ratio);
    return { osa: props.aosa, etaisyys };
  }
  // Segmentti kattaa useamman tieosan eikä niiden tarkkaa rajakohtaa tunneta aineistosta,
  // joten annetaan arvioitu väli varman mutta mahdollisesti väärän yksittäisarvon sijaan.
  return {
    osaFrom: props.aosa,
    osaTo: props.losa,
    etaisyysFrom: Math.round(props.aet),
    etaisyysTo: Math.round(props.let),
    approximate: true
  };
}

function formatRoadAddress(roadAddress) {
  if (!roadAddress) return "";
  if (Number.isFinite(roadAddress.osa) && Number.isFinite(roadAddress.etaisyys)) {
    return `tieosa ${roadAddress.osa} · etäisyys ${roadAddress.etaisyys} m`;
  }
  if (Number.isFinite(roadAddress.osaFrom) && Number.isFinite(roadAddress.osaTo)) {
    // Aineistossa tämä tien osuus on tallennettu yhtenä useita tieosia kattavana
    // geometriana, joten tarkkaa tieosan ja etäisyyden rajakohtaa ei tunneta.
    // Näytetään rehellisesti, ettei tarkkaa sijaintia tiedetä, sen sijaan että
    // arvattaisiin mahdollisesti väärä yksittäisarvo.
    return `tarkka tieosa ei tiedossa (tieosat ${roadAddress.osaFrom}–${roadAddress.osaTo})`;
  }
  return "";
}

function taskRoadAddressText(task) {
  if (!Number.isFinite(task.lat) || !Number.isFinite(task.lng)) return "";
  const snapped = nearestPointOnRoad(L.latLng(task.lat, task.lng), task.road);
  return snapped ? formatRoadAddress(snapped.roadAddress) : "";
}

function nearestPointOnRoad(latlng, roadId) {
  const features = roadId === null ? indexedFeatures : roadsById.get(String(roadId)) || [];
  if (features.length === 0) return null;

  const target = projectMercator(latlng.lng, latlng.lat);
  const targetX = target.x;
  const targetY = target.y;
  const candidates = features.map(feature => {
    const dx = targetX < feature.minX ? feature.minX - targetX : targetX > feature.maxX ? targetX - feature.maxX : 0;
    const dy = targetY < feature.minY ? feature.minY - targetY : targetY > feature.maxY ? targetY - feature.maxY : 0;
    return { ...feature, lowerBound: Math.hypot(dx, dy) };
  }).sort((left, right) => left.lowerBound - right.lowerBound);

  let nearestPoint = null;
  let nearestDistanceMeters = Number.POSITIVE_INFINITY;
  let nearestRoadId = null;
  let nearestFeature = null;
  let nearestProgressLength = 0;
  for (const candidate of candidates) {
    if (candidate.lowerBound > nearestDistanceMeters) break;
    const feature = candidate.feature;
    const lines = feature.geometry.type === "MultiLineString"
      ? feature.geometry.coordinates
      : [feature.geometry.coordinates];
    let runningLength = 0;
    for (const line of lines) {
      for (let index = 1; index < line.length; index += 1) {
        const startLngLat = line[index - 1];
        const endLngLat = line[index];
        const start = projectMercator(startLngLat[0], startLngLat[1]);
        const end = projectMercator(endLngLat[0], endLngLat[1]);
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const segmentLength = Math.hypot(dx, dy);
        const denominator = dx * dx + dy * dy;
        const ratio = denominator === 0 ? 0 : Math.max(0, Math.min(1, ((targetX - start.x) * dx + (targetY - start.y) * dy) / denominator));
        const pointX = start.x + ratio * dx;
        const pointY = start.y + ratio * dy;
        const distance = Math.hypot(pointX - targetX, pointY - targetY);
        if (distance < nearestDistanceMeters) {
          nearestDistanceMeters = distance;
          nearestRoadId = candidate.roadId;
          nearestFeature = candidate;
          nearestProgressLength = runningLength + ratio * segmentLength;
          const lng = pointX / earthRadius * 180 / Math.PI;
          const lat = (2 * Math.atan(Math.exp(pointY / earthRadius)) - Math.PI / 2) * 180 / Math.PI;
          nearestPoint = L.latLng(lat, lng);
        }
        runningLength += segmentLength;
      }
    }
  }
  return nearestPoint ? {
    latlng: nearestPoint,
    roadId: nearestRoadId,
    distance: nearestDistanceMeters * 256 * 2 ** map.getZoom() / projectedWorldWidth,
    roadAddress: nearestFeature ? roadAddressAtProgress(nearestFeature, nearestProgressLength) : null
  } : null;
}

function taskIcon(task) {
  const isSign = task.type === "sign";
  const glyph = isSign ? "!" : task.type === "oil-gravel" ? "Ö" : task.type === "invasive-species" ? "V" : taskTypes[task.type]?.icon || "•";
  const label = taskTypes[task.type]?.label || removedTaskTypeLabels[task.type] || taskTypes.other.label;
  const markerClass = task.type === "invasive-species" ? " invasive-species-marker" : "";
  if (task.type === "invasive-species") {
    return L.divIcon({
      className: "task-map-icon invasive-species-map-icon",
      html: `<img src="${invasiveSpeciesImageUrl}" alt="Vieraslajivaroitusmerkki">`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      tooltipAnchor: [0, -22],
      alt: `${label}: ${task.location}`
    });
  }
  if (task.type === "oil-gravel") {
    return L.divIcon({
      className: "task-map-icon patching-need-map-icon",
      html: '<img src="patching-need-icon.svg" alt="Kuoppa asfaltissa">',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      tooltipAnchor: [0, -22],
      alt: `${label}: ${task.location}`
    });
  }
  if (task.type === "roadwork") {
    return L.divIcon({
      className: "task-map-icon roadwork-map-icon",
      html: `<span class="roadwork-sign-icon"><img src="${signImageBaseUrl}${signImageFiles.A11}" alt="A11 – Tietyö"><span class="roadwork-alert" aria-hidden="true">!</span></span>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      tooltipAnchor: [0, -22],
      alt: `${label}: ${task.location}`
    });
  }
  if (task.type === "hazardous-tree") {
    return L.divIcon({
      className: "task-map-icon roadwork-map-icon",
      html: `<span class="roadwork-sign-icon"><img src="${taskTypeImages[task.type].src}" alt="${taskTypeImages[task.type].alt}"><span class="roadwork-alert" aria-hidden="true">!</span></span>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      tooltipAnchor: [0, -22],
      alt: `${label}: ${task.location}`
    });
  }
  if (taskTypeImages[task.type]) {
    const image = taskTypeImages[task.type];
    return L.divIcon({
      className: `task-map-icon task-type-image-map-icon ${task.type}-map-icon`,
      html: `<img src="${image.src}" alt="${image.alt}">`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      tooltipAnchor: [0, -22],
      alt: `${label}: ${task.location}`
    });
  }
  const signCode = task.sign?.match(/^([A-E]\d+(?:\.\d+)?)/i)?.[1]?.toUpperCase();
  const signImageFile = signCode ? signImageFiles[signCode] : null;
  if (isSign && signImageFile) {
    const signShapeClass = signCode?.startsWith("A") || signCode === "B5"
      ? " triangular-sign-marker"
      : ["E1", "E2"].includes(signCode)
        ? " square-sign-marker"
        : "";
    return L.divIcon({
      className: "task-map-icon sign-map-icon",
      html: `<span class="traffic-sign-marker${signShapeClass}"><img src="${signImageBaseUrl}${signImageFile}" alt="${escapeHtml(task.sign)}"></span>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      tooltipAnchor: [0, -22],
      alt: `${label}: ${task.sign} · ${task.location}`
    });
  }
  return L.divIcon({
    className: "task-map-icon",
    html: `<span class="marker-shape${isSign ? "" : " non-sign-marker"}${markerClass}"><span>${glyph}</span></span>`,
    iconSize: [33, 39],
    iconAnchor: [16, 33],
    tooltipAnchor: [0, -32],
    alt: `${label}: ${task.location}`
  });
}

function renderMapMarkers() {
  markersLayer.clearLayers();
  for (const task of tasksForContract().filter(task => visibleTaskTypes.has(task.type) || (!Object.hasOwn(taskTypes, task.type) && visibleTaskTypes.has("other")))) {
    if (!Number.isFinite(task.lat) || !Number.isFinite(task.lng)) continue;
    const marker = L.marker([task.lat, task.lng], {
      icon: taskIcon(task)
    }).addTo(markersLayer);
    const meta = taskTypes[task.type] || { ...taskTypes.other, label: removedTaskTypeLabels[task.type] || taskTypes.other.label };
    const sign = task.sign ? `<span class="task-map-popup-sign">${escapeHtml(task.sign)}</span>` : "";
    const invasiveSpeciesCredit = task.type === "invasive-species"
      ? '<a class="task-map-popup-sign-credit" href="https://vieraslajit.fi/lajit/MX.38950" target="_blank" rel="noreferrer">Kuvake: Vieraslajit.fi</a>'
      : "";
    const signCode = task.type === "roadwork" ? "A11" : task.sign?.match(/^([A-E]\d+(?:\.\d+)?)/i)?.[1]?.toUpperCase();
    const signImageFile = signCode ? signImageFiles[signCode] : null;
    const signImage = signImageFile
      ? task.type === "roadwork"
        ? `<span class="roadwork-sign-icon popup-roadwork-sign"><img class="task-map-popup-sign-image" src="${signImageBaseUrl}${signImageFile}" alt="A11 – Tietyö"><span class="roadwork-alert" aria-hidden="true">!</span></span>`
        : `<img class="task-map-popup-sign-image" src="${signImageBaseUrl}${signImageFile}" alt="${escapeHtml(task.sign)}">`
      : "";
    const typeImage = taskTypeImages[task.type];
    const taskTypeImage = typeImage
      ? `<img class="task-map-popup-sign-image task-type-popup-image" src="${typeImage.src}" alt="${typeImage.alt}">`
      : "";
    const signImageCredit = signImageFile
      ? '<a class="task-map-popup-sign-credit" href="https://github.com/finnishtransportagency/liikennemerkit" target="_blank" rel="noreferrer">Kuva: Väylävirasto · CC0</a>'
      : "";
    const sideLabel = taskSideLabel(task.side);
    const side = sideLabel ? `<span class="task-map-popup-side">Tien puoli: ${sideLabel}</span>` : "";
    const description = task.description ? `<p>${escapeHtml(task.description)}</p>` : "";
    const photo = task.photo ? `<img class="task-map-popup-photo" src="${escapeHtml(task.photo)}" alt="Kuva työkohteesta">` : "";
    marker.bindPopup(`
      <div class="task-map-popup">
        <span class="task-map-popup-type">${escapeHtml(meta.label)}</span>
        ${invasiveSpeciesCredit}
        ${sign}
        ${signImage}
        ${taskTypeImage}
        ${signImageCredit}
        ${side}
        ${description}
        <span class="task-map-popup-location">${escapeHtml([roadLabel(task.road), taskRoadAddressText(task)].filter(Boolean).join(" · "))}<span class="task-map-popup-location-secondary">${escapeHtml(task.location)}</span></span>
        ${photo}
        <div class="task-map-popup-actions">
          <button class="task-map-popup-edit" type="button" data-map-edit="${escapeHtml(task.id)}">Muokkaa</button>
          <button class="task-map-popup-complete" type="button" data-map-complete="${escapeHtml(task.id)}">✓ Kuittaa valmiiksi</button>
        </div>
      </div>
    `, { autoPan: false });
    marker.on("mousedown", event => event.originalEvent?.preventDefault());
    marker.on("click", event => event.originalEvent?.preventDefault());
  }
}

function renderMap() {
  document.querySelector("#map-contract-name").textContent = `${contract.name} · ${contract.area}`;
  document.querySelector("#contract-roads").textContent = `${contract.officialName} · urakkakoodi ${contract.code}`;
  document.querySelector("#contract-area").textContent = contract.area;
  document.querySelector("#contract-count").textContent = String(tasksForContract().length);
  renderMapMarkers();
}

function tasksForContract() {
  return currentTasks.filter(task => task.contract === contract.id);
}

function renderTasks() {
  const tasks = tasksForContract();
  document.querySelector("#task-count-badge").textContent = String(tasks.length);
  document.querySelector("#contract-count").textContent = String(tasks.length);
  taskList.innerHTML = tasks.map(task => {
    const meta = taskTypes[task.type] || taskTypes.other;
    const typeImage = taskTypeImages[task.type];
    const taskIconContent = task.type === "invasive-species"
      ? `<img class="task-icon-image" src="${invasiveSpeciesImageUrl}" alt="">`
      : task.type === "oil-gravel"
        ? '<img class="task-icon-image" src="patching-need-icon.svg" alt="">'
        : task.type === "roadwork"
          ? `<span class="roadwork-sign-icon task-roadwork-sign"><img class="task-icon-image" src="${signImageBaseUrl}${signImageFiles.A11}" alt="A11 – Tietyö"><span class="roadwork-alert" aria-hidden="true">!</span></span>`
          : task.type === "hazardous-tree"
            ? `<span class="roadwork-sign-icon task-roadwork-sign"><img class="task-icon-image" src="${typeImage.src}" alt="${typeImage.alt}"><span class="roadwork-alert" aria-hidden="true">!</span></span>`
          : typeImage
            ? `<img class="task-icon-image" src="${typeImage.src}" alt="">`
            : escapeHtml(meta.icon);
    const signBadge = task.sign ? `<span class="sign-badge">${escapeHtml(task.sign)}</span>` : "";
    const sideLabel = taskSideLabel(task.side);
    const sideBadge = sideLabel ? `<span class="side-badge">Tien puoli: ${sideLabel}</span>` : "";
    const invasiveSpeciesCredit = task.type === "invasive-species"
      ? '<a class="side-badge" href="https://vieraslajit.fi/lajit/MX.38950" target="_blank" rel="noreferrer">Kuvake: Vieraslajit.fi</a>'
      : "";
    const photo = task.photo ? `<img class="task-photo-thumb" src="${task.photo}" alt="Työkohteen kuva">` : "";
    return `<article class="task-card" data-task-card="${escapeHtml(task.id)}">
      <div class="task-icon ${meta.className}">${taskIconContent}</div>
      <div class="task-content">
        <div class="task-type-line"><span class="task-type">${escapeHtml(meta.label)}</span></div>
        ${task.description ? `<h4>${escapeHtml(task.description)}</h4>` : ""}
        <div class="task-location"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 6.8c0 3.2-5 7-5 7s-5-3.8-5-7a5 5 0 1 1 10 0Z"/><circle cx="8" cy="6.5" r="1.5"/></svg>${escapeHtml([roadLabel(task.road), taskRoadAddressText(task)].filter(Boolean).join(" · "))}</div>
        <div class="task-location-secondary">${escapeHtml(task.location)}</div>
        ${task.photo ? `<img class="task-photo" src="${task.photo}" alt="Kuva kohteesta">` : ""}
        ${signBadge || sideBadge || photo || invasiveSpeciesCredit ? `<div class="task-extra">${signBadge}${sideBadge}${invasiveSpeciesCredit}${photo}</div>` : ""}
        <div class="task-actions">
          <span class="task-date">${escapeHtml(task.date || "Juuri lisätty")}</span>
          <div class="task-action-buttons">
            <button class="edit-button" type="button" data-edit="${escapeHtml(task.id)}">Muokkaa</button>
            <button class="complete-button" type="button" data-complete="${escapeHtml(task.id)}">✓ Valmis</button>
          </div>
        </div>
      </div>
    </article>`;
  }).join("");
  emptyState.hidden = tasks.length !== 0;
  taskList.hidden = tasks.length === 0;
  document.querySelector("#panel-add-button").hidden = tasks.length === 0;
  renderMap();
}

function completeTask(taskId) {
  if (!currentTasks.some(task => task.id === taskId)) return;
  currentTasks = currentTasks.filter(task => task.id !== taskId);
  const saved = saveTasks();
  renderTasks();
  showToast(saved ? "Työ kuitattu valmiiksi ja poistettu kartalta." : "Työ poistui näkymästä, mutta tallennus epäonnistui.");
}

function openModal(taskToEdit = null) {
  document.querySelector("#modal-contract-name").textContent = contract.name;
  setRoadDisplay(null);
  resetLocationDisplay();
  form.reset();
  resetSignSearch();
  photoData = "";
  pickedPosition = null;
  if (draftMarker) {
    map.removeLayer(draftMarker);
    draftMarker = null;
  }
  document.querySelector("#photo-copy-title").textContent = "Lisää kuva";
  document.querySelector("#photo-copy-hint").textContent = "PNG, JPG tai HEIC";
  document.querySelector("#photo-preview").innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/></svg>`;
  formError.hidden = true;
  editingTaskId = taskToEdit?.id || null;
  document.querySelector("#modal-eyebrow").textContent = editingTaskId ? "MUOKKAA MERKINTÄÄ" : "UUSI MERKINTÄ KARTALLE";
  document.querySelector("#modal-title").textContent = editingTaskId ? "Muokkaa havaintoa" : "Lisää työ";
  document.querySelector("#save-work-button").innerHTML = editingTaskId
    ? "Tallenna muutokset"
    : "<span>+</span> Lisää työ kartalle";
  setPickingLocation(false);
  if (taskToEdit) {
    typeSelect.value = taskToEdit.type;
    signSelect.value = taskToEdit.sign || "";
    setRoadDisplay(taskToEdit.road);
    sideSelect.value = taskToEdit.side || "";
    document.querySelector("#work-description").value = taskToEdit.description || "";
    pickedPosition = { lat: taskToEdit.lat, lng: taskToEdit.lng };
    const editSnapped = Number.isFinite(taskToEdit.lat) && Number.isFinite(taskToEdit.lng)
      ? nearestPointOnRoad(L.latLng(taskToEdit.lat, taskToEdit.lng), taskToEdit.road)
      : null;
    setLocationDisplay(taskToEdit.road, editSnapped?.roadAddress, L.latLng(taskToEdit.lat, taskToEdit.lng));
    if (Number.isFinite(taskToEdit.lat) && Number.isFinite(taskToEdit.lng)) {
      draftMarker = L.marker([taskToEdit.lat, taskToEdit.lng], { icon: draftIcon, interactive: false }).addTo(map);
    }
    if (taskToEdit.photo) {
      photoData = taskToEdit.photo;
      document.querySelector("#photo-preview").innerHTML = `<img src="${escapeHtml(photoData)}" alt="">`;
      document.querySelector("#photo-copy-title").textContent = "Nykyinen kuva";
      document.querySelector("#photo-copy-hint").textContent = "Säilyy, jos et valitse uutta kuvaa";
    }
  }
  updateTypeFields();
  modalBackdrop.hidden = false;
  document.body.style.overflow = "hidden";
  window.setTimeout(() => (editingTaskId ? document.querySelector("#work-description") : typeSelect).focus(), 30);
}

function setDraftPosition(roadId, latlng, knownPosition = null) {
  const snapped = knownPosition || nearestPointOnRoad(latlng, roadId);
  if (!snapped) return false;
  setRoadDisplay(roadId);
  pickedPosition = { lat: snapped.latlng.lat, lng: snapped.latlng.lng };
  setLocationDisplay(roadId, snapped.roadAddress, snapped.latlng);
  draftMarker = L.marker(snapped.latlng, { icon: draftIcon, interactive: false }).addTo(map);
  return true;
}

function closeModal() {
  modalBackdrop.hidden = true;
  document.body.style.overflow = "";
  setPickingLocation(false);
  if (draftMarker) {
    map.removeLayer(draftMarker);
    draftMarker = null;
  }
  pickedPosition = null;
  editingTaskId = null;
}

function setPickingLocation(value) {
  pickingLocation = value;
  mapCanvas.classList.toggle("picking", value);
  document.querySelector("#pick-location").classList.toggle("active", value);
  if (value) {
    modalBackdrop.hidden = true;
    document.body.style.overflow = "";
    map.invalidateSize();
  } else if (!modalBackdrop.hidden) {
    locationDisplay.focus();
  }
}

function updateTypeFields() {
  const isSign = typeSelect.value === "sign";
  document.querySelector("#sign-fields").hidden = !isSign;
  signSelect.required = isSign;
}

function resetSignSearch() {
  signSearchStatus.textContent = "";
  for (const option of signSelect.options) option.hidden = false;
  for (const group of signSelect.querySelectorAll("optgroup")) group.hidden = false;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2800);
}

function addTask(task) {
  currentTasks.unshift(task);
  const saved = saveTasks();
  closeModal();
  renderTasks();
  showToast(saved ? "Työ lisätty kartalle." : "Työ lisättiin näkymään, mutta tallennus epäonnistui.");
}

contractSelect.innerHTML = `<option value="${contract.id}">${escapeHtml(contract.name)}</option>`;
contractSelect.value = contract.id;
setRoadDisplay(null);

for (const task of seedTasks) {
  const snapped = nearestPointOnRoad(L.latLng(task.lat, task.lng), task.road);
  if (snapped) {
    task.lat = snapped.latlng.lat;
    task.lng = snapped.latlng.lng;
  }
}

renderMapTypeFilters();
renderTasks();
map.whenReady(() => window.setTimeout(() => map.invalidateSize(), 100));

contractSelect.addEventListener("change", () => {
  contractSelect.value = contract.id;
});

document.querySelectorAll("#add-work-button, #panel-add-button, #empty-add-button").forEach(button => button.addEventListener("click", () => openModal()));
document.querySelector("#close-modal").addEventListener("click", closeModal);
document.querySelector("#cancel-modal").addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", event => {
  if (event.target === modalBackdrop) closeModal();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !modalBackdrop.hidden) closeModal();
});

typeSelect.addEventListener("change", updateTypeFields);
document.querySelector("#map-filter-toggle").addEventListener("click", event => {
  const button = event.currentTarget;
  const expanded = button.getAttribute("aria-expanded") !== "true";
  button.setAttribute("aria-expanded", String(expanded));
  document.querySelector("#map-filter-options").hidden = !expanded;
});
document.querySelector("#map-filter-all").addEventListener("change", event => {
  visibleTaskTypes = event.currentTarget.checked ? new Set(Object.keys(taskTypes)) : new Set();
  document.querySelectorAll("#map-filter-list input[type='checkbox']").forEach(input => {
    input.checked = visibleTaskTypes.has(input.value);
  });
  updateMapFilterSummary();
  saveVisibleTaskTypes();
  renderMapMarkers();
});
document.querySelector("#map-filter-list").addEventListener("change", event => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.type !== "checkbox") return;
  if (input.checked) visibleTaskTypes.add(input.value);
  else visibleTaskTypes.delete(input.value);
  updateMapFilterSummary();
  saveVisibleTaskTypes();
  renderMapMarkers();
});
document.querySelector("#sign-search-button").addEventListener("click", () => {
  const query = signSearchQuery.value.trim().toLocaleLowerCase("fi");
  let matches = 0;
  for (const option of signSelect.options) {
    const isPlaceholder = !option.value;
    const isMatch = isPlaceholder || option.textContent.toLocaleLowerCase("fi").includes(query);
    option.hidden = !isMatch;
    if (!isPlaceholder && isMatch) matches += 1;
  }
  for (const group of signSelect.querySelectorAll("optgroup")) {
    group.hidden = !Array.from(group.querySelectorAll("option")).some(option => !option.hidden);
  }
  signSearchStatus.textContent = query
    ? matches ? `${matches} merkkiä löytyi.` : "Merkkiä ei löytynyt. Kokeile Väyläviraston kuvastoa."
    : "Kaikki merkit näytetään.";
});
signSearchQuery.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    document.querySelector("#sign-search-button").click();
  }
});
document.querySelector("#pick-location").addEventListener("click", () => {
  if (draftMarker) map.removeLayer(draftMarker);
  draftMarker = null;
  pickedPosition = null;
  resetLocationDisplay();
  setRoadDisplay(null);
  setPickingLocation(true);
  showToast("Napauta kartalla työn sijaintia.");
});

map.on("click", event => {
  if (pickingLocation) {
    const snapped = nearestPointOnRoad(event.latlng, null);
    if (!snapped || snapped.distance > 100) {
      showToast("Valitse kartalta lähempänä näkyvää urakan tieosuutta.");
      return;
    }
    setDraftPosition(snapped.roadId, snapped.latlng, snapped);
    setPickingLocation(false);
    modalBackdrop.hidden = false;
    document.body.style.overflow = "hidden";
    showToast(`Sijainti kiinnitetty ${roadLabel(snapped.roadId)}-tieosuudelle.`);
    return;
  }

  openModal();
  const closest = nearestPointOnRoad(event.latlng, null);
  if (!closest || closest.distance > 100) {
    showToast("Uusi työ avattu. Valitse kartalta lähempänä urakan tieosuutta oleva sijainti.");
    return;
  }
  setDraftPosition(closest.roadId, closest.latlng, closest);
  showToast(`Uusi työ avattu sijainnista ${roadLabel(closest.roadId)}-tieosuudella.`);
});

taskList.addEventListener("click", event => {
  const editButton = event.target.closest("[data-edit]");
  if (editButton) {
    const task = currentTasks.find(item => item.id === editButton.dataset.edit);
    if (task) openModal(task);
    return;
  }
  const completeButton = event.target.closest("[data-complete]");
  if (completeButton) completeTask(completeButton.dataset.complete);
});

map.on("popupopen", event => {
  const popupElement = event.popup.getElement();
  const editButton = popupElement?.querySelector("[data-map-edit]");
  const completeButton = popupElement?.querySelector("[data-map-complete]");
  editButton?.addEventListener("click", () => {
    const task = currentTasks.find(item => item.id === editButton.dataset.mapEdit);
    map.closePopup();
    if (task) openModal(task);
  }, { once: true });
  completeButton?.addEventListener("click", () => {
    const taskId = completeButton.dataset.mapComplete;
    map.closePopup();
    completeTask(taskId);
  }, { once: true });
});

photoInput.addEventListener("change", () => {
  const file = photoInput.files && photoInput.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    formError.textContent = "Valitse kuvatiedosto.";
    formError.hidden = false;
    photoInput.value = "";
    return;
  }
  if (file.size > 4 * 1024 * 1024) {
    formError.textContent = "Kuvan enimmäiskoko on 4 Mt.";
    formError.hidden = false;
    photoInput.value = "";
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    if (typeof reader.result !== "string") {
      formError.textContent = "Kuvan esikatselua ei voitu lukea.";
      formError.hidden = false;
      return;
    }
    photoData = reader.result;
    document.querySelector("#photo-preview").innerHTML = `<img src="${photoData}" alt="">`;
    document.querySelector("#photo-copy-title").textContent = file.name;
    document.querySelector("#photo-copy-hint").textContent = `${(file.size / 1024).toFixed(0)} kt`;
    formError.hidden = true;
  });
  reader.addEventListener("error", () => {
    formError.textContent = "Kuvan lukeminen epäonnistui. Kokeile toista kuvatiedostoa.";
    formError.hidden = false;
  });
  reader.readAsDataURL(file);
});

form.addEventListener("submit", event => {
  event.preventDefault();
  const description = document.querySelector("#work-description").value.trim();
  if (!pickedPosition || !roadSelect.value || (typeSelect.value === "sign" && !signSelect.value)) {
    formError.textContent = "Valitse sijainti kartalta ja täytä muut pakolliset kentät.";
    formError.hidden = false;
    return;
  }
  const editedTask = editingTaskId ? currentTasks.find(task => task.id === editingTaskId) : null;
  if (editingTaskId && !editedTask) {
    formError.textContent = "Muokattavaa työtä ei enää löydy. Sulje lomake ja yritä uudelleen.";
    formError.hidden = false;
    return;
  }
  const task = {
    ...(editedTask || {}),
    id: editedTask?.id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    contract: contract.id,
    type: typeSelect.value,
    sign: typeSelect.value === "sign" ? signSelect.value : typeSelect.value === "roadwork" ? "A11 – tietyö" : "",
    road: roadSelect.value,
    side: sideSelect.value,
    location: formatCoordinates(L.latLng(pickedPosition.lat, pickedPosition.lng)),
    lat: pickedPosition.lat,
    lng: pickedPosition.lng,
    description,
    photo: photoData,
    date: editedTask?.date || `Tänään, ${new Intl.DateTimeFormat("fi-FI", { hour: "2-digit", minute: "2-digit" }).format(new Date())}`
  };
  if (editedTask) {
    currentTasks = currentTasks.map(existing => existing.id === editedTask.id ? task : existing);
    const saved = saveTasks();
    closeModal();
    renderTasks();
    showToast(saved ? "Työn muutokset tallennettu." : "Muutokset näkyvät, mutta tallennus epäonnistui.");
  } else {
    addTask(task);
  }
});

document.querySelector("#locate-button").addEventListener("click", event => {
  const button = event.currentTarget;
  if (!navigator.geolocation) {
    showToast("Sijainnin määritys ei ole selaimessasi käytettävissä.");
    return;
  }

  button.disabled = true;
  showToast("Haetaan sijaintiasi…");
  navigator.geolocation.getCurrentPosition(position => {
    button.disabled = false;
    const { latitude, longitude, accuracy } = position.coords;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      showToast("Selaimelta saatiin virheellinen sijainti.");
      return;
    }

    const location = L.latLng(latitude, longitude);
    currentLocationLayer.clearLayers();
    if (Number.isFinite(accuracy) && accuracy > 0) {
      L.circle(location, {
        radius: accuracy,
        color: "#2878d0",
        weight: 1,
        fillColor: "#3989e5",
        fillOpacity: 0.12,
        interactive: false
      }).addTo(currentLocationLayer);
    }
    L.circleMarker(location, {
      radius: 8,
      color: "#fff",
      weight: 3,
      fillColor: "#2878d0",
      fillOpacity: 1,
      interactive: false
    }).addTo(currentLocationLayer);
    map.flyTo(location, Math.max(map.getZoom(), 15));
    showToast(Number.isFinite(accuracy) && accuracy > 0
      ? `Oma sijaintisi näkyy kartalla (tarkkuus noin ±${Math.round(accuracy)} m).`
      : "Oma sijaintisi näkyy kartalla.");
  }, error => {
    button.disabled = false;
    const message = {
      1: "Sijaintilupa evättiin. Salli sijainnin käyttö selaimen asetuksista.",
      2: "Sijaintia ei saatu määritettyä. Tarkista laitteen sijaintipalvelut.",
      3: "Sijainnin haku aikakatkaistiin. Yritä uudelleen."
    }[error.code] || "Sijainnin haku epäonnistui.";
    showToast(message);
  }, {
    enableHighAccuracy: true,
    timeout: 30000,
    maximumAge: 0
  });
});

document.querySelector("#layers-button").addEventListener("click", event => {
  const button = event.currentTarget;
  const visible = button.getAttribute("aria-expanded") !== "true";
  button.setAttribute("aria-expanded", String(visible));
  button.classList.toggle("selected", !visible);
  if (visible) {
    roadsLayer.addTo(map);
    markersLayer.addTo(map);
  } else {
    map.removeLayer(roadsLayer);
    map.removeLayer(markersLayer);
  }
  showToast(visible ? "Urakan tieosuudet ja työt näytetään." : "Urakan tieosuudet ja työmerkit piilotettu.");
});

document.querySelector("#zoom-in").addEventListener("click", () => map.zoomIn());
document.querySelector("#zoom-out").addEventListener("click", () => map.zoomOut());
document.querySelectorAll(".map-theme-button").forEach(button => {
  button.addEventListener("click", () => {
    if (button.dataset.mapTheme === "basemap") {
      setMapTheme("basemap");
      showToast("Taustakartta-teema käytössä.");
      return;
    }
    setMapTheme("osm");
    showToast("OpenStreetMap-teema käytössä.");
  });
});
document.querySelectorAll(".map-road-theme-button").forEach(button => {
  button.addEventListener("click", () => {
    if (button.dataset.roadTheme === "mono") {
      setRoadColorTheme("mono");
      showToast("Tiet näytetään yksivärisenä.");
      return;
    }
    setRoadColorTheme("class");
    showToast("Tiet näytetään tieluokan mukaan väritettynä.");
  });
});
document.querySelector("#sort-button").addEventListener("click", () => {
  currentTasks.reverse();
  renderTasks();
  showToast("Työt järjestetty uudelleen.");
});
document.querySelector("#rail-tasks").addEventListener("click", () => document.querySelector("#work-panel").scrollIntoView({ behavior: "smooth", block: "center" }));
