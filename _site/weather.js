function fetchWeatherData() {
    console.log('Fetching weather data...');

    fetch('https://api.open-meteo.com/v1/forecast?latitude=4.6097&longitude=-74.0817&hourly=temperature_2m')
    .then(response => response.json())
    .then(data => {
        console.log('Data parsed successfully:', data);

        const now = new Date();
        const hourIndex = now.getUTCHours(); // Align with the API's hourly data index
        const currentTemperature = Math.round(data.hourly.temperature_2m[hourIndex]);

        const timeString = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Bogota'
        });

        // Updating the webpage's content
        document.getElementById('bogota-weather').textContent = `Bogotá ${currentTemperature}°C, ${timeString}`;
    })
    .catch(error => {
        console.error('Error fetching weather data:', error);
    });
}

// Call the function to fetch weather data
fetchWeatherData();
