var map = L.map('map').setView([-22.56,17.06],6);

L.tileLayer(
'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
).addTo(map);

var marker = L.marker([-22.56,17.06]).addTo(map);

let chart, globalData;

// -----------------------------
// REVERSE GEOCODING
// -----------------------------
async function getPlace(lat, lon){
let url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
let res = await fetch(url);
let data = await res.json();

let name = data.display_name || "Unknown";
document.getElementById("place").innerText = "📍 " + name;
}

// -----------------------------
// CLASSIFICATION
// -----------------------------
function classify(ndvi){

if(ndvi < 0.15) return ["Barren Land","❌ No farming possible"];
if(ndvi < 0.3) return ["Bushy Land","🐄 Suitable for grazing"];
if(ndvi < 0.45) return ["Moderate Land","🌾 Groundnut, Cowpeas"];
return ["Fertile Land","🌱 Vegetables, Maize"];
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

let {labels,rain,temp,ndvi} = globalData;
let type = document.getElementById("graphType").value;
let style = document.getElementById("chartStyle").value;

if(chart) chart.destroy();

let dataset = rain;

if(type==="temp") dataset=temp;
if(type==="ndvi") dataset=ndvi;

if(style==="pie"){
chart = new Chart(chartCanvas(),{
type:"pie",
data:{labels,datasets:[{data:dataset}]}
});
return;
}

if(style==="heat"){
dataset = dataset.map(v=>v*10);
style="bar";
}

chart = new Chart(chartCanvas(),{
type:style,
data:{labels,datasets:[{label:type,data:dataset}]}
});
}

function chartCanvas(){ return document.getElementById("chart"); }

// -----------------------------
// MAP
// -----------------------------
map.on('click', function(e){
marker.setLatLng(e.latlng);
loadData(e.latlng.lat,e.latlng.lng);
});

function manualLocate(){
let lat=parseFloat(latInput.value);
let lon=parseFloat(lonInput.value);
map.setView([lat,lon],6);
marker.setLatLng([lat,lon]);
loadData(lat,lon);
}

// -----------------------------
// CHATBOT (FINAL)
// -----------------------------
const faq = {
"crops":"Main Namibia crops: Mahangu, Sorghum, Groundnut, Cowpeas.",
"how to grow mahangu":"Mahangu requires low rainfall, sandy soil, and is drought resistant.",
"agriculture in namibia":"Namibia agriculture is mainly rain-fed and focuses on drought-resistant crops.",
"support":"Ministry of Agriculture Namibia: +264 61 2087111",
"email":"info@mawf.gov.na"
};

async function askAI(q){
let res = await fetch("https://api-inference.huggingface.co/models/google/flan-t5-small",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({inputs:"Answer for Namibia agriculture: "+q})
});
let data = await res.json();
return data[0]?.generated_text || "No response";
}

document.getElementById("input").addEventListener("keydown", async function(e){

if(e.key==="Enter"){

let q=this.value.toLowerCase();
let chat=document.getElementById("chat");

chat.innerHTML+="<p><b>User:</b>"+q+"</p>";

let answered=false;

for(let key in faq){
if(q.includes(key)){
chat.innerHTML+="<p><b>Bot:</b>"+faq[key]+"</p>";
answered=true;
break;
}
}

if(!answered){
let reply=await askAI(q);
chat.innerHTML+="<p><b>Bot:</b>"+reply+"</p>";
}

this.value="";
}
});

// -----------------------------
loadData(-22.56,17.06);
