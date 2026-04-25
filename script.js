// MAP
var map = L.map('map').setView([-22.56,17.06],6);

var sat = L.tileLayer(
'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
);

var terrain = L.tileLayer(
'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
);

sat.addTo(map);

L.control.layers({
"Satellite": sat,
"Terrain": terrain
}).addTo(map);

var marker = L.marker([-22.56,17.06]).addTo(map);

let chart = null;
let globalData = null;

// CROP INFO
const cropInfo = {
"Mahangu": "Drought resistant staple crop in Namibia.",
"Sorghum": "Heat tolerant crop.",
"Groundnut": "Needs moderate rainfall.",
"cowpeas": "Low water crop."
};

// GET PLACE
async function getPlace(lat, lon){
let res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
let data = await res.json();

let name = data.display_name || "";

if(!name.includes("Namibia")){
alert("Select location inside Namibia");
return false;
}

document.getElementById("place").innerText = name;
return true;
}

// CLASSIFICATION
function classify(ndvi, rain){

if(ndvi < 0.15 && rain < 2) return ["Barren","No farming"];
if(ndvi < 0.2 && rain > 3) return ["Water","Fish farming"];
if(ndvi < 0.3) return ["Bush","Grazing"];
if(ndvi < 0.5) return ["Moderate","Groundnut, Cowpeas"];
return ["Fertile","Mahangu, Sorghum"];
}

// LOAD DATA
async function loadData(lat,lon){

document.getElementById("loading").style.display="block";

let ok = await getPlace(lat,lon);
if(!ok) return;

let res = await fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=2023-01-01&end_date=2023-01-10&daily=temperature_2m_max,precipitation_sum`);

let data = await res.json();

let rain = data.daily.precipitation_sum;
let temp = data.daily.temperature_2m_max;

let avgRain = rain.reduce((a,b)=>a+b,0)/rain.length;
let avgTemp = temp.reduce((a,b)=>a+b,0)/temp.length;

let ndvi = Math.min(0.8, avgRain/20);

// UI
document.getElementById("tempVal").innerText = avgTemp.toFixed(1)+" °C";
document.getElementById("rainVal").innerText = avgRain.toFixed(1)+" mm";
document.getElementById("ndviVal").innerText = ndvi.toFixed(2);

let [land, rec] = classify(ndvi, avgRain);

document.getElementById("land").innerText = land;
document.getElementById("rec").innerText = rec;

// Crop details
let html="";
Object.keys(cropInfo).forEach(c=>{
if(rec.toLowerCase().includes(c.toLowerCase())){
html += `<p><b>${c}:</b> ${cropInfo[c]}</p>`;
}
});
document.getElementById("cropDetails").innerHTML = html;

// Save data
globalData = {labels:data.daily.time,rain,temp};

drawChart();

document.getElementById("loading").style.display="none";
}

// GRAPH
function drawChart(){

let type = document.getElementById("graphType").value;

if(chart) chart.destroy();

if(type==="rain"){
chart = new Chart(chartCanvas(),{
type:"line",
data:{labels:globalData.labels,datasets:[{label:"Rainfall",data:globalData.rain}]}
});
}

if(type==="temp"){
chart = new Chart(chartCanvas(),{
type:"line",
data:{labels:globalData.labels,datasets:[{label:"Temperature",data:globalData.temp}]}
});
}

if(type==="ndvi"){
let ndvi = globalData.rain.map(r=>Math.min(0.8,r/20));
chart = new Chart(chartCanvas(),{
type:"line",
data:{labels:globalData.labels,datasets:[{label:"NDVI",data:ndvi}]}
});
}

if(type==="combined"){
chart = new Chart(chartCanvas(),{
type:"line",
data:{
labels:globalData.labels,
datasets:[
{label:"Rain",data:globalData.rain},
{label:"Temp",data:globalData.temp}
]
}
});
}
}

function chartCanvas(){
return document.getElementById("chart");
}

// DOWNLOAD
function downloadImage(){
let url = document.getElementById("chart").toDataURL("image/png");
let a=document.createElement("a");
a.href=url;
a.download="chart.png";
a.click();
}

function downloadPDF(){
window.print();
}

// MAP CLICK
map.on('click', function(e){
marker.setLatLng(e.latlng);
loadData(e.latlng.lat,e.latlng.lng);
});

// MANUAL
function manualLocate(){
let lat=parseFloat(latInput.value);
let lon=parseFloat(lonInput.value);
map.setView([lat,lon],6);
marker.setLatLng([lat,lon]);
loadData(lat,lon);
}

// CHATBOT
document.getElementById("input").addEventListener("keydown",function(e){

if(e.key==="Enter"){

let q=this.value.toLowerCase();
let chat=document.getElementById("chat");

chat.innerHTML += "<p><b>You:</b> "+q+"</p>";

if(q.includes("mahangu")){
chat.innerHTML += "<p><b>Bot:</b>"+cropInfo["Mahangu"]+"</p>";
}
else if(q.includes("namibia agriculture")){
chat.innerHTML += "<p><b>Bot:</b> Namibia agriculture depends on rainfall and drought crops.</p>";
}
else{
chat.innerHTML += "<p><b>Bot:</b> Recommended: "+document.getElementById("rec").innerText+"</p>";
}

this.value="";
}
});

// INIT
loadData(-22.56,17.06);
