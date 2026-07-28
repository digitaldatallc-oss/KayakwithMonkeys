
(() => {
  const WEATHER_POINT = 'https://api.weather.gov/points/29.216389,-82.057777';
  const WEATHER_ALERTS = 'https://api.weather.gov/alerts/active?point=29.216389,-82.057777';
  const USGS_URL = 'https://waterservices.usgs.gov/nwis/iv/?format=json&sites=02239501&parameterCd=00010,00060,00065&siteStatus=all';

  const byId = (id) => document.getElementById(id);
  const setText = (id, text) => {
    const node = byId(id);
    if (node) node.textContent = text;
  };

  const formatUpdated = (value) => {
    if (!value) return 'Update time unavailable';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Update time unavailable';
    return `Updated ${new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/New_York'
    }).format(date)} ET`;
  };

  async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
      headers: { Accept: 'application/geo+json, application/json' },
      cache: 'no-store',
      ...options
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json();
  }

  async function loadWeather() {
    const point = await fetchJson(WEATHER_POINT);
    const hourlyUrl = point?.properties?.forecastHourly;
    if (!hourlyUrl) throw new Error('NWS hourly forecast URL was not returned.');

    const [hourly, alerts] = await Promise.all([
      fetchJson(hourlyUrl),
      fetchJson(WEATHER_ALERTS).catch(() => ({ features: [] }))
    ]);

    const period = hourly?.properties?.periods?.[0];
    if (!period) throw new Error('No current NWS forecast period was returned.');

    const rain = period?.probabilityOfPrecipitation?.value;
    setText('air-temperature', `${period.temperature}°${period.temperatureUnit || 'F'}`);
    setText('air-temperature-detail', period.name || 'Current hourly forecast');
    setText('wind-speed', period.windSpeed || 'Unavailable');
    setText('wind-direction', period.windDirection ? `From ${period.windDirection}` : 'Direction unavailable');
    setText('rain-chance', rain == null ? 'Not listed' : `${rain}%`);
    setText('weather-summary', period.shortForecast || 'Forecast unavailable');
    setText('weather-period', `Forecast for ${period.name || 'the current hour'}`);
    setText('weather-updated', formatUpdated(hourly?.properties?.updateTime || period.startTime));

    const alertList = Array.isArray(alerts?.features) ? alerts.features : [];
    const alertBox = byId('active-alerts');
    if (alertList.length) {
      const headlines = alertList
        .slice(0, 2)
        .map((item) => item?.properties?.headline || item?.properties?.event)
        .filter(Boolean);
      alertBox.textContent = `Active weather alert${alertList.length > 1 ? 's' : ''}: ${headlines.join(' · ')}`;
      alertBox.classList.add('has-alert');
    } else {
      alertBox.textContent = 'No active National Weather Service alerts are listed for the Silver Springs point.';
      alertBox.classList.remove('has-alert');
    }
  }

  async function loadWater() {
    const data = await fetchJson(USGS_URL, { headers: { Accept: 'application/json' } });
    const series = data?.value?.timeSeries;
    if (!Array.isArray(series) || !series.length) throw new Error('No current USGS measurements were returned.');

    const readings = {};
    series.forEach((item) => {
      const code = item?.variable?.variableCode?.[0]?.value;
      const reading = item?.values?.[0]?.value?.[0];
      if (code && reading) readings[code] = reading;
    });

    const tempC = Number.parseFloat(readings['00010']?.value);
    const flow = Number.parseFloat(readings['00060']?.value);
    const gage = Number.parseFloat(readings['00065']?.value);

    setText(
      'water-temperature',
      Number.isFinite(tempC) ? `${((tempC * 9 / 5) + 32).toFixed(1)}°F` : 'Unavailable'
    );
    setText('river-flow', Number.isFinite(flow) ? `${Math.round(flow).toLocaleString('en-US')} cfs` : 'Unavailable');
    setText('gage-height', Number.isFinite(gage) ? `${gage.toFixed(2)} ft` : 'Unavailable');

    const timestamps = Object.values(readings)
      .map((reading) => reading?.dateTime)
      .filter(Boolean)
      .sort();
    const latest = timestamps[timestamps.length - 1];

    setText('water-updated', formatUpdated(latest));
    setText('water-status', latest ? 'Live USGS station readings received' : 'USGS readings received');
  }

  async function loadConditions() {
    const refresh = byId('conditions-refresh');
    const alert = byId('conditions-alert');
    if (refresh) refresh.disabled = true;
    if (alert) {
      alert.className = 'conditions-alert';
      alert.textContent = 'Loading current weather and river measurements…';
    }

    const results = await Promise.allSettled([loadWeather(), loadWater()]);
    const failures = results.filter((result) => result.status === 'rejected');

    if (alert) {
      if (failures.length === 0) {
        alert.className = 'conditions-alert is-success';
        alert.textContent = 'Live weather and Silver River measurements loaded successfully.';
      } else if (failures.length === 1) {
        alert.className = 'conditions-alert is-warning';
        alert.textContent = 'One live data source is temporarily unavailable. The other readings shown are current.';
      } else {
        alert.className = 'conditions-alert is-warning';
        alert.textContent = 'Live data is temporarily unavailable. Use the official forecast and USGS links below.';
      }
    }

    if (refresh) refresh.disabled = false;
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!byId('conditions')) return;
    byId('conditions-refresh')?.addEventListener('click', loadConditions);
    loadConditions();
    window.setInterval(loadConditions, 15 * 60 * 1000);
  });
})();
