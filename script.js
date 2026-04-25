var map = L.map('map').setView([-22.56,17.06],6);

L.tileLayer(
'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
).addTo(map);

var marker = L.marker([-22.56,17.06]).addTo(map);

let chart;
let globalData;

// -----------------------------
// REVERSE GEOCODING
// -----------------------------
async function getPlace(lat, lon){
let url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
let res = await fetch(url);
let data = await res.json();
document.getElementById("place").innerText = "📍 " + (data.display_name || "Unknown");
}

// -----------------------------
// CLASSIFICATION LOGIC
// -----------------------------
function classify(ndvi){

if(ndvi < 0.2) return ["Barren Land", "❌ No crops possible"];

if(ndvi < 0.35) return ["Bushy Land", "🐄 Good for grazing"];

if(ndvi < 0.5) return ["Moderate Land", "🌾 Groundnut, Cowpeas"];

return ["Fertile Land", "🌱 Vegetables, Maize"];
}

// -----------------------------
// LOAD DATA
// -----------------------------
async function loadData(lat,lon){

document.getElementById("lat").innerText = lat.toFixed(4);
document.getElementById("lon").innerText = lon.toFixed(4);

getPlace(lat,lon);

let url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=2023-01-01&end_date=2023-01-15&daily=temperature_2m_max,precipitation_sum`;

let res = await fetch(url);
let data = await res.json();

let rain = data.daily.precipitation_sum;
let temp = data.daily.temperature_2m_max;

// NDVI approx
let ndviArr = rain.map(r => (r*0.02)+0.2);
let ndvi = ndviArr[0];

document.getElementById("ndviVal").innerText = ndvi.toFixed(2);

let [land, rec] = classify(ndvi);

document.getElementById("land").innerText = land;
document.getElementById("rec").innerText = rec;

globalData = {labels:data.daily.time,rain,temp,ndvi:ndviArr};

drawChart();
}

// -----------------------------
// GRAPH
// -----------------------------
function drawChart(){

if(!globalData) return;

let type = document.getElementById("graphType").value;
let style = document.getElementById("chartStyle").value;

let {labels,rain,temp,ndvi} = globalData;

if(chart) chart.destroy();

let dataset;

if(type==="rain") dataset = rain;
if(type==="temp") dataset = temp;
if(type==="ndvi") dataset = ndvi;

if(type==="combined"){
chart = new Chart(chartCanvas(),{
type:"line",
data:{
labels,
datasets:[
{label:"Rain",data:rain},
{label:"Temp",data:temp}
]
}
});
return;
}

// Heatmap simulation
if(style==="heat"){
dataset = dataset.map(v => v*10);
style = "bar";
}

if(style==="pie"){
chart = new Chart(chartCanvas(),{
type:"pie",
data:{
labels,
datasets:[{data:dataset}]
}
});
return;
}

chart = new Chart(chartCanvas(),{
type:style,
data:{labels,datasets:[{label:type,data:dataset}]}
});
}

function chartCanvas(){
return document.getElementById("chart");
}

// -----------------------------
// MAP CLICK
// -----------------------------
map.on('click', function(e){
marker.setLatLng(e.latlng);
loadData(e.latlng.lat,e.latlng.lng);
});

// -----------------------------
// MANUAL INPUT
// -----------------------------
function manualLocate(){

let lat = parseFloat(document.getElementById("latInput").value);
let lon = parseFloat(document.getElementById("lonInput").value);

map.setView([lat,lon],6);
marker.setLatLng([lat,lon]);

loadData(lat,lon);
}

// -----------------------------
document.getElementById("graphType").addEventListener("change",drawChart);
document.getElementById("chartStyle").addEventListener("change",drawChart);

// -----------------------------
// LOAD DEFAULT
// -----------------------------
loadData(-22.56,17.06);
