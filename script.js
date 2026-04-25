// -----------------------------
// INIT MAP
// -----------------------------
var map = L.map('map').setView([-22.56,17.06],6);

L.tileLayer(
'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
).addTo(map);

var marker = L.marker([-22.56,17.06]).addTo(map);

let chart = null;
let globalData = null;

// -----------------------------
// SAFE CROP LOGIC
// -----------------------------
function getCrops(rain){
if(rain > 5) return "Spinach, Cabbage, Potatoes";
if(rain > 2) return "Groundnut, Cowpeas, Sorghum";
return "Mahangu, Bambara nuts";
}

// -----------------------------
// LOAD DATA
// -----------------------------
async function loadData(lat,lon){

try{

let url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=2023-01-01&end_date=2023-01-15&daily=temperature_2m_max,precipitation_sum`;

let res = await fetch(url);
let data = await res.json();

if(!data.daily){
alert("Weather API failed");
return;
}

let rain = data.daily.precipitation_sum;
let temp = data.daily.temperature_2m_max;

let ndvi = rain.map(r => (r*0.02)+0.2);

globalData = {
labels:data.daily.time,
rain,
temp,
ndvi
};

// Results
let avgRain = rain.reduce((a,b)=>a+b,0)/rain.length;

document.getElementById("crop").innerText = getCrops(avgRain);
document.getElementById("ndviVal").innerText = ndvi[0].toFixed(2);
document.getElementById("yield").innerText = (avgRain*2).toFixed(1);

drawChart();

}catch(err){
console.error(err);
alert("Error loading data");
}
}

// -----------------------------
// DRAW GRAPH
// -----------------------------
function drawChart(){

if(!globalData) return;

let {labels,rain,temp,ndvi} = globalData;
let type = document.getElementById("graphType").value;

// Destroy old chart
if(chart){
chart.destroy();
chart = null;
}

let config = {type:"line",data:{labels,datasets:[]}}

if(type==="rain"){
config.data.datasets = [{label:"Rainfall",data:rain}]
}

else if(type==="temp"){
config.data.datasets = [{label:"Temperature",data:temp}]
}

else if(type==="ndvi"){
config.data.datasets = [{label:"NDVI",data:ndvi}]
}

else if(type==="combined"){
config.data.datasets = [
{label:"Rain",data:rain},
{label:"Temp",data:temp}
]
}

else if(type==="moving"){
let ma = rain.map((_,i,arr)=>{
let slice = arr.slice(Math.max(0,i-2),i+1);
return slice.reduce((a,b)=>a+b)/slice.length;
});
config.data.datasets = [{label:"Moving Avg",data:ma}]
}

else if(type==="variability"){
let mean = rain.reduce((a,b)=>a+b)/rain.length;
let variance = rain.map(v => (v-mean)**2);
config.type="bar";
config.data.datasets = [{label:"Variability",data:variance}]
}

else if(type==="cumulative"){
let cum = [];
rain.reduce((a,b,i)=>{
cum[i] = a + b;
return cum[i];
},0);
config.data.datasets = [{label:"Cumulative",data:cum}]
}

else if(type==="growth"){
let index = rain.map((r,i)=> (r*0.5 + temp[i]*0.5));
config.data.datasets = [{label:"Growth Index",data:index}]
}

// Create chart
chart = new Chart(document.getElementById("chart"), config);
}

// -----------------------------
// MAP CLICK
// -----------------------------
map.on('click', function(e){
marker.setLatLng(e.latlng);
loadData(e.latlng.lat,e.latlng.lng);
});

// -----------------------------
// GRAPH CHANGE
// -----------------------------
document.getElementById("graphType").addEventListener("change",drawChart);

// -----------------------------
// CHATBOT (FIXED)
// -----------------------------
const faq = {
"crops": "Crops depend on rainfall levels: low → Mahangu, medium → Groundnut, high → vegetables.",
"ndvi": "NDVI indicates vegetation health. Higher values mean more greenery.",
"yield": "Yield is estimated using rainfall and vegetation index."
};

document.getElementById("input").addEventListener("keydown",function(e){

if(e.key==="Enter"){

let q = this.value.toLowerCase();
let chat = document.getElementById("chat");

chat.innerHTML += "<p><b>User:</b> "+q+"</p>";

let answered = false;

for(let key in faq){
if(q.includes(key)){
chat.innerHTML += "<p><b>Bot:</b> "+faq[key]+"</p>";
answered = true;
break;
}
}

if(!answered){
chat.innerHTML += "<p><b>Bot:</b> Based on current analysis, crops are "+document.getElementById("crop").innerText+"</p>";
}

this.value="";
}
});

// -----------------------------
// LOAD DEFAULT DATA (IMPORTANT FIX)
// -----------------------------
loadData(-22.56,17.06);
