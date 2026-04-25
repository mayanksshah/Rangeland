// -----------------------------
// MAP (NAMIBIA DEFAULT)
// -----------------------------
var map = L.map('map').setView([-22.56, 17.06], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

var marker = L.marker([-22.56, 17.06]).addTo(map);

// CLICK EVENT
map.on('click', function(e) {
    var lat = e.latlng.lat.toFixed(4);
    var lon = e.latlng.lng.toFixed(4);

    marker.setLatLng(e.latlng);

    document.getElementById("coords").innerText = "Lat: " + lat + " | Lon: " + lon;

    // FAKE ANALYSIS (SIMULATION)
    document.getElementById("green").innerText = Math.floor(Math.random()*60) + "%";
    document.getElementById("water").innerText = Math.floor(Math.random()*30) + "%";

    let crops = ["Millet", "Sorghum", "Maize"];
    document.getElementById("crops").innerText = crops[Math.floor(Math.random()*crops.length)];
});

// -----------------------------
// CHART (TIME SERIES)
// -----------------------------
new Chart(document.getElementById("chart"), {
    type: 'line',
    data: {
        labels: ["Jan","Feb","Mar","Apr","May","Jun"],
        datasets: [{
            label: "Rainfall",
            data: [20,40,10,60,30,50],
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
        chat.innerHTML += "<p><b>User:</b> "+val+"</p>";
        chat.innerHTML += "<p><b>Bot:</b> Based on analysis, crops recommended.</p>";

        this.value = "";
    }
});