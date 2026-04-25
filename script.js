// -----------------------------
// INIT MAP (NAMIBIA SATELLITE)
// -----------------------------
var map = L.map('map').setView([-22.56, 17.06], 6);

L.tileLayer(
'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
).addTo(map);

var marker = L.marker([-22.56, 17.06]).addTo(map);

// -----------------------------
// CROP LOGIC (NAMIBIA SPECIFIC)
// -----------------------------
function getCrops(green, water){

    if(water > 25){
        return ["Spinach", "Cabbage", "Potatoes", "Sweet Potatoes", "Cassava"];
    }

    if(green > 40){
        return ["Groundnut", "Cowpeas", "Sorghum"];
    }

    return ["Mahangu (Pearl Millet)", "Sorghum", "Bambara nuts"];
}

// -----------------------------
// WEATHER API + GRAPH
// -----------------------------
async function loadWeather(lat, lon){

    let url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=2023-01-01&end_date=2023-01-10&daily=precipitation_sum`;

    let res = await fetch(url);
    let data = await res.json();

    let rain = data.daily.precipitation_sum;

    new Chart(document.getElementById("chart"), {
        type: 'line',
        data: {
            labels: data.daily.time,
            datasets: [{
                label: "Rainfall",
                data: rain,
                borderWidth: 2
            }]
        }
    });
}

// -----------------------------
// MAP CLICK EVENT
// -----------------------------
map.on('click', function(e) {

    var lat = e.latlng.lat.toFixed(4);
    var lon = e.latlng.lng.toFixed(4);

    marker.setLatLng(e.latlng);

    document.getElementById("coords").innerText = "Lat: " + lat + " | Lon: " + lon;

    // Namibia realistic values
    let green = Math.floor(Math.random() * 40 + 20);
    let water = Math.floor(Math.random() * 20);

    document.getElementById("green").innerText = green + "%";
    document.getElementById("water").innerText = water + "%";

    let crops = getCrops(green, water);

    document.getElementById("crops").innerText = crops.join(", ");

    // Load real weather
    loadWeather(lat, lon);
});

// -----------------------------
// CHATBOT
// -----------------------------
document.getElementById("input").addEventListener("keydown", function(e){

    if(e.key === "Enter"){

        let val = this.value;
        let chat = document.getElementById("chat");

        chat.innerHTML += "<p><b>User:</b> " + val + "</p>";

        chat.innerHTML += "<p><b>Bot:</b> Based on environmental conditions, suitable crops are: "
            + document.getElementById("crops").innerText + "</p>";

        this.value = "";
    }
});
