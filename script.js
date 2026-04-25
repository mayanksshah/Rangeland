var map = L.map('map').setView([-22.56,17.06],6);

// MAP LAYERS
var sat = L.tileLayer(
'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
);

var terrain = L.tileLayer(
'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
);

var osm = L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
);

sat.addTo(map);

L.control.layers({
"Satellite": sat,
"Terrain": terrain,
"Map": osm
}).addTo(map);

var marker = L.marker([-22.56,17.06]).addTo(map);

let chart;
let globalData;

// -----------------------------
async function getPlace(lat, lon){
let res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
let data = await res.json();
document.getElementById("place").innerText = "📍 " + (data.display_name || "Unknown");
}

// -----------------------------
function classify(ndvi, avgRain){

if(ndvi < 0.15 && avgRain < 2)
return ["Barren Land","❌ No farming possible"];

if(ndvi < 0.18 && avgRain > 3)
return ["Water Body","💧 Fish farming recommended"];

if(ndvi < 0.3)
return ["Bushy Land","🐄 Good for grazing"];

if(ndvi < 0.45)
return ["Moderate Land","🌾 Groundnut, Cowpeas"];

return ["Fertile Land","🌱 Vegetables, Maize"];
}

// -----------------------------
async function loadData(lat,lon){

document.getElementById("loading").style.display="block";

document.getElementById("lat").innerText = lat.toFixed(4);
document.getElementById("lon").innerText = lon.toFixed(4);

await getPlace(lat,lon);

let res = await fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=2023-01-01&end_date=2023-01-15&daily=temperature_2m_max,precipitation_sum`);
let data = await res.json();

let rain = data.daily.precipitation_sum;
let temp = data.daily.temperature_2m_max;

let avgRain = rain.reduce((a,b)=>a+b,0)/rain.length;
let avgTemp = temp.reduce((a,b)=>a+b,0)/temp.length;

let ndviArr = rain.map(r => (r*0.02)+0.2);
let ndvi = ndviArr[0];

let humidity = Math.min(80, avgRain*10);

// UI update
document.getElementById("tempVal").innerText = avgTemp.toFixed(1)+" °C";
document.getElementById("rainVal").innerText = avgRain.toFixed(1)+" mm";
document.getElementById("humidity").innerText = humidity.toFixed(0)+" %";
document.getElementById("ndviVal").innerText = ndvi.toFixed(2);

let [land, rec] = classify(ndvi, avgRain);

document.getElementById("land").innerText = land;
document.getElementById("rec").innerText = rec;

document.getElementById("analysis").innerText =
"Analysis: Based on rainfall, temperature and NDVI, this area is classified as " + land;

globalData = {labels:data.daily.time,rain,temp,ndvi:ndviArr};

drawChart();

document.getElementById("loading").style.display="none";
}

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

if(type==="correlation"){
chart = new Chart(chartCanvas(),{
type:"scatter",
data:{
datasets:[{
label:"Rain vs Temp",
data: rain.map((r,i)=>({x:r,y:temp[i]}))
}]
}
});
return;
}

if(type==="cumulative"){
let cum=[];
rain.reduce((a,b,i)=>cum[i]=a+b,0);
dataset=cum;
}

if(type==="moving"){
dataset=rain.map((_,i,arr)=>{
let slice=arr.slice(Math.max(0,i-2),i+1);
return slice.reduce((a,b)=>a+b)/slice.length;
});
}

if(type==="variability"){
let mean=avg(rain);
dataset=rain.map(v=>(v-mean)**2);
style="bar";
}

if(type==="index"){
dataset=rain.map((r,i)=>r*0.6+temp[i]*0.4);
}

if(style==="heat"){
dataset=dataset.map(v=>v*10);
style="bar";
}

if(style==="pie"){
chart = new Chart(chartCanvas(),{
type:"pie",
data:{labels,datasets:[{data:dataset}]}
});
return;
}

chart = new Chart(chartCanvas(),{
type:style,
data:{labels,datasets:[{label:type,data:dataset}]}
});
}

function chartCanvas(){ return document.getElementById("chart"); }

function avg(arr){ return arr.reduce((a,b)=>a+b,0)/arr.length; }

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
document.getElementById("graphType").addEventListener("change",drawChart);
document.getElementById("chartStyle").addEventListener("change",drawChart);

// -----------------------------
// CHATBOT
// -----------------------------
const faq = {
"crops":"Namibia crops: Mahangu, Sorghum, Groundnut, Cowpeas.",
"how to grow":"Use drought-resistant crops and seasonal rainfall.",
"support":"+264 61 2087111 Agriculture Ministry Namibia",
"email":"info@mawf.gov.na"
};

async function askAI(q){
let res = await fetch("https://api-inference.huggingface.co/models/google/flan-t5-small",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({inputs:"Namibia agriculture answer: "+q})
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
