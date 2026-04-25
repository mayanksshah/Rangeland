// -----------------------------
// MAP
// -----------------------------
var map = L.map('map').setView([-22.56,17.06],6);

// Satellite
var sat = L.tileLayer(
'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
);

// NDVI-like layer (Sentinel visual)
var ndviLayer = L.tileLayer(
'https://tiles.maps.eox.at/wms?service=WMS&request=GetMap&layers=s2cloudless-2023&format=image/png&width=256&height=256&srs=EPSG:3857&bbox={bbox-epsg-3857}'
);

sat.addTo(map);

var marker = L.marker([-22.56,17.06]).addTo(map);

let chart;

// -----------------------------
// LAYER SWITCH
// -----------------------------
document.getElementById("layerToggle").addEventListener("change", function(){

map.removeLayer(sat);
map.removeLayer(ndviLayer);

if(this.value==="sat") sat.addTo(map);
else ndviLayer.addTo(map);

});

// -----------------------------
// CROP LOGIC
// -----------------------------
function getCrops(rain){

if(rain > 5){
return "Spinach, Cabbage, Potatoes";
}

if(rain > 2){
return "Groundnut, Cowpeas, Sorghum";
}

return "Mahangu, Bambara nuts";
}

// -----------------------------
// WEATHER
// -----------------------------
async function loadData(lat,lon){

let url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=2023-01-01&end_date=2023-01-15&daily=temperature_2m_max,precipitation_sum`;

let res = await fetch(url);
let data = await res.json();

let rain = data.daily.precipitation_sum;
let temp = data.daily.temperature_2m_max;

// NDVI approximation
let ndvi = rain.map(r => (r*0.02)+0.2);

let avgRain = rain.reduce((a,b)=>a+b,0)/rain.length;

document.getElementById("crop").innerText = getCrops(avgRain);
document.getElementById("ndviVal").innerText = ndvi[0].toFixed(2);
document.getElementById("yield").innerText = (avgRain*2).toFixed(1);

drawChart(data.daily.time,rain,temp,ndvi);
}

// -----------------------------
// GRAPH
// -----------------------------
function drawChart(labels,rain,temp,ndvi){

let type = document.getElementById("graphType").value;

if(chart) chart.destroy();

if(type==="rain"){
chart = new Chart(chartCanvas(),{
type:"line",
data:{labels,datasets:[{label:"Rainfall",data:rain}]}
});
}

if(type==="temp"){
chart = new Chart(chartCanvas(),{
type:"line",
data:{labels,datasets:[{label:"Temperature",data:temp}]}
});
}

if(type==="ndvi"){
chart = new Chart(chartCanvas(),{
type:"line",
data:{labels,datasets:[{label:"NDVI",data:ndvi}]}
});
}

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
}

if(type==="trend"){
let trend = rain.map((v,i)=> i);
chart = new Chart(chartCanvas(),{
type:"line",
data:{labels,datasets:[{label:"Trend",data:trend}]}
});
}
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
// DOWNLOAD
// -----------------------------
function downloadImage(){
let url = document.getElementById("chart").toDataURL();
let a=document.createElement("a");
a.href=url;a.download="chart.jpg";a.click();
}

function downloadPDF(){
window.print();
}
