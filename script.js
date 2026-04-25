// MAP
var map = L.map('map').setView([-22.56,17.06],6);

L.tileLayer(
'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
).addTo(map);

var marker = L.marker([-22.56,17.06]).addTo(map);

let chart;

// CROP LOGIC BASED ON RAIN
function getCrops(rain){

if(rain > 5){
return ["Spinach","Cabbage","Potatoes","Cassava"];
}

if(rain > 2){
return ["Groundnut","Cowpeas","Sorghum"];
}

return ["Mahangu","Bambara nuts"];
}

// LOAD WEATHER
async function loadWeather(lat,lon){

let url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=2023-01-01&end_date=2023-01-10&daily=temperature_2m_max,precipitation_sum`;

let res = await fetch(url);
let data = await res.json();

let rain = data.daily.precipitation_sum;
let temp = data.daily.temperature_2m_max;

let avgRain = rain.reduce((a,b)=>a+b,0)/rain.length;

document.getElementById("green").innerText = (avgRain*10).toFixed(0)+"%";
document.getElementById("water").innerText = avgRain.toFixed(1);

let crops = getCrops(avgRain);
document.getElementById("crops").innerText = crops.join(", ");

drawChart(data.daily.time,rain,temp);
}

// DRAW GRAPH
function drawChart(labels,rain,temp){

let type = document.getElementById("graphType").value;

if(chart) chart.destroy();

if(type==="rain"){
chart = new Chart(document.getElementById("chart"),{
type:"line",
data:{labels,datasets:[{label:"Rainfall",data:rain}]}
});
}

if(type==="temp"){
chart = new Chart(document.getElementById("chart"),{
type:"line",
data:{labels,datasets:[{label:"Temperature",data:temp}]}
});
}

if(type==="combined"){
chart = new Chart(document.getElementById("chart"),{
type:"line",
data:{
labels,
datasets:[
{label:"Rainfall",data:rain},
{label:"Temperature",data:temp}
]
}
});
}
}

// MAP CLICK
map.on('click', function(e){

let lat = e.latlng.lat;
let lon = e.latlng.lng;

marker.setLatLng(e.latlng);

document.getElementById("coords").innerText =
"Lat: "+lat.toFixed(3)+" Lon: "+lon.toFixed(3);

loadWeather(lat,lon);

});

// GRAPH SWITCH
document.getElementById("graphType").addEventListener("change",()=>{
loadWeather(marker.getLatLng().lat, marker.getLatLng().lng);
});

// DOWNLOAD JPG
function downloadImage(){
let url = document.getElementById("chart").toDataURL("image/jpeg");
let a = document.createElement("a");
a.href = url;
a.download = "chart.jpg";
a.click();
}

// DOWNLOAD PDF
function downloadPDF(){
let img = document.getElementById("chart").toDataURL("image/jpeg");

let win = window.open("");
win.document.write("<img src='"+img+"'/>");
win.print();
}

// CHATBOT
document.getElementById("input").addEventListener("keydown",function(e){
if(e.key==="Enter"){
let chat = document.getElementById("chat");
chat.innerHTML += "<p><b>User:</b>"+this.value+"</p>";
chat.innerHTML += "<p><b>Bot:</b> Crops: "+document.getElementById("crops").innerText+"</p>";
this.value="";
}
});
