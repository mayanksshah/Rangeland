var map = L.map('map').setView([-22.56,17.06],6);

L.tileLayer(
'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
).addTo(map);

var marker = L.marker([-22.56,17.06]).addTo(map);

let chart;
let globalData = {};

// -----------------------------
// CROP LOGIC
// -----------------------------
function getCrops(rain){
if(rain > 5) return "Spinach, Cabbage, Potatoes";
if(rain > 2) return "Groundnut, Cowpeas, Sorghum";
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

let ndvi = rain.map(r => (r*0.02)+0.2);

globalData = {labels:data.daily.time,rain,temp,ndvi};

let avgRain = rain.reduce((a,b)=>a+b,0)/rain.length;

document.getElementById("crop").innerText = getCrops(avgRain);
document.getElementById("ndviVal").innerText = ndvi[0].toFixed(2);
document.getElementById("yield").innerText = (avgRain*2).toFixed(1);

drawChart();
}

// -----------------------------
// GRAPH ENGINE
// -----------------------------
function drawChart(){

let {labels,rain,temp,ndvi} = globalData;
let type = document.getElementById("graphType").value;

if(chart) chart.destroy();

if(type==="rain"){
chart = new Chart(chartCanvas(),{type:"line",data:{labels,datasets:[{label:"Rainfall",data:rain}]}})
}

if(type==="temp"){
chart = new Chart(chartCanvas(),{type:"line",data:{labels,datasets:[{label:"Temperature",data:temp}]}})
}

if(type==="ndvi"){
chart = new Chart(chartCanvas(),{type:"line",data:{labels,datasets:[{label:"NDVI",data:ndvi}]}})
}

if(type==="combined"){
chart = new Chart(chartCanvas(),{
type:"line",
data:{labels,datasets:[
{label:"Rain",data:rain},
{label:"Temp",data:temp}
]}})
}

if(type==="moving"){
let ma = rain.map((_,i,arr)=> arr.slice(Math.max(0,i-2),i+1).reduce((a,b)=>a+b)/Math.min(i+1,3));
chart = new Chart(chartCanvas(),{type:"line",data:{labels,datasets:[{label:"Moving Avg",data:ma}]}})
}

if(type==="variability"){
let mean = rain.reduce((a,b)=>a+b)/rain.length;
let variance = rain.map(v => Math.pow(v-mean,2));
chart = new Chart(chartCanvas(),{type:"bar",data:{labels,datasets:[{label:"Variability",data:variance}]}})
}

if(type==="cumulative"){
let cum = [];
rain.reduce((a,b,i)=> cum[i]=a+b,0);
chart = new Chart(chartCanvas(),{type:"line",data:{labels,datasets:[{label:"Cumulative Rain",data:cum}]}})
}

if(type==="growth"){
let index = rain.map((r,i)=> (r*0.5 + temp[i]*0.5));
chart = new Chart(chartCanvas(),{type:"line",data:{labels,datasets:[{label:"Growth Index",data:index}]}})
}

}

function chartCanvas(){ return document.getElementById("chart"); }

// -----------------------------
// MAP CLICK
// -----------------------------
map.on('click', function(e){
marker.setLatLng(e.latlng);
loadData(e.latlng.lat,e.latlng.lng);
});

// GRAPH CHANGE
document.getElementById("graphType").addEventListener("change",drawChart);

// -----------------------------
// CHATBOT (SMART)
// -----------------------------
const faq = {
"what crops": "Recommended crops depend on rainfall levels. Low rain: Mahangu. Medium: Groundnut. High: Vegetables.",
"what is ndvi": "NDVI measures vegetation health using satellite data.",
"what is yield": "Yield is estimated based on rainfall and vegetation index."
};

document.getElementById("input").addEventListener("keydown", function(e){

if(e.key==="Enter"){

let q = this.value.toLowerCase();
let chat = document.getElementById("chat");

chat.innerHTML += "<p><b>User:</b>"+q+"</p>";

if(faq[q]){
chat.innerHTML += "<p><b>Bot:</b>"+faq[q]+"</p>";
}
else{
chat.innerHTML += "<p><b>Bot:</b> Based on analysis, crops are "+document.getElementById("crop").innerText+"</p>";
}

this.value="";
}
});
