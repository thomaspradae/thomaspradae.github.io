function pad2(n) { return String(n).padStart(2, '0'); }
function tzStr(d) {
    const off = -d.getTimezoneOffset();
    const s = off >= 0 ? '+' : '-';
    const a = Math.abs(off);
    return 'UTC' + s + pad2(Math.floor(a / 60)) + pad2(a % 60);
}

function fetchWeatherData() {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=4.6097&longitude=-74.0817&hourly=temperature_2m')
    .then(response => response.json())
    .then(data => {
        const now = new Date();
        const hourIndex = now.getUTCHours();
        const currentTemperature = Math.round(data.hourly.temperature_2m[hourIndex]);

        const weatherEl = document.getElementById('bogota-weather');
        if (weatherEl) weatherEl.textContent = `Bogotá ${currentTemperature}°`;

        tickFooterHud();
        setInterval(tickFooterHud, 250);
    })
    .catch(() => {
        const weatherEl = document.getElementById('bogota-weather');
        if (weatherEl) weatherEl.textContent = 'Bogotá —°';
        tickFooterHud();
        setInterval(tickFooterHud, 250);
    });
}

function tickFooterHud() {
    const d = new Date();
    const timeEl = document.getElementById('footer-hud-time');
    const tzEl = document.getElementById('footer-hud-tz');
    if (timeEl) timeEl.textContent = pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
    if (tzEl) tzEl.textContent = tzStr(d);
}

fetchWeatherData();
