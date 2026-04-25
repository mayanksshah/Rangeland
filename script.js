// -----------------------------
// MAP (NAMIBIA DEFAULT)
// -----------------------------
var map = L.map('map').setView([-22.56, 17.06], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

var marker = L.marker([-22.56, 17.06]).addTo(map);

// -----------------------------
// SMART CROP LOGIC
// -----------------------------
function getCrops(green, water){

    // Irrigation crops
    if(water > 25){
        return ["Spinach", "Cabbage", "Potatoes", "Sweet Potatoes", "Cassava"];
    }

    // Moderate vegetation
    if(green > 40){
        return ["Groundnut", "Cowpeas", "Sorghum"];
    }

    // Dry Namibia land
    return ["Mahangu (Pearl Millet)", "Sorghum", "Bambara nuts"];
}

// -----------------------------
// MAP CLICK EVENT
// -----------------------------
map.on('click', function(e) {

    var lat = e.latlng.lat.toFixed(4);
    var lon = e.latlng.lng.toFixed(4);

    marker.setLatLng(e.latlng);

    document.getElementById("coords").innerText = "Lat: " + lat + " | Lon: " + lon;

    // Simulated values
    let green = Math.floor(Math.random() * 60);
    let water = Math.floor(Math.random() * 30);

    document.getElementById("green").innerText = green + "%";
    document.getElementById("water").innerText = water + "%";

    let crops = getCrops(green, water);

    document.getElementById("crops").innerText = crops.join(", ");
});

// -----------------------------
// TIME SERIES GRAPH
// -----------------------------
new Chart(document.getElementById("chart"), {
    type: 'line',
    data: {
        labels: ["Jan","Feb","Mar","Apr","May","Jun"],
        datasets: [{
            label: "Rainfall",
            data: [20, 40, 10, 60, 30, 50],
            borderWidth: 2
        }]
    }
});

// -----------------------------
// CHATBOT
// -----------------------------
document.getElementById("input").addEventListener("keydown", function(e){

    if(e.key === "Enter"){

        let val = this.value;
        let chat = document.getElementById("chat");

        chat.innerHTML += "<p><b>User:</b> " + val + "</p>";

        chat.innerHTML += "<p><b>Bot:</b> Recommended crops are: " 
            + document.getElementById("crops").innerText + "</p>";

        this.value = "";
    }
});
