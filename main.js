const map = L.map('map').setView([21.0285, 105.8542], 13);

// Ping map HN giữa trung tâm thôi tôi không biết loại vùng khác kiểu gì
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Tạo bộ geocoder để tìm địa chỉ
L.Control.geocoder({ defaultMarkGeocode: true }).addTo(map);

// Hàm lấy tọa độ từ địa chỉ
async function getCoords(address) {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Hà Nội, Việt Nam')}`);
  const data = await res.json();
  if (data.length === 0) return null;
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

// Cái này ấn tìm đường và nó lấy tọa độ thôi
document.getElementById("findRoute").addEventListener("click", async () => {
  const startAddr = document.getElementById("start").value;
  const endAddr = document.getElementById("end").value;

  const start = await getCoords(startAddr);
  const end = await getCoords(endAddr);

  if (!start || !end) {
    alert("Error không thấy vị trí");
    return;
  }

  // Marker cho điểm đầu & cuối
  L.marker(start).addTo(map).bindPopup("Điểm bắt đầu").openPopup();
  L.marker(end).addTo(map).bindPopup("Điểm đến");

  // API OSRM map HN
  const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true&alternatives=true`;

  const res = await fetch(url);
  const data = await res.json();
  data.routes.forEach((route, index) => {
    const line = L.geoJSON(route.geometry, { 
      color: index === 0 ? 'blue' : index === 1 ? 'green' : 'gray', 
      weight: 5, 
      opacity: 0.7 
    }).addTo(map);
    console.log(`Tuyến ${index+1}: ${Math.round(route.distance/1000)} km, ${Math.round(route.duration/60)} phút`);
  });
  if (data.routes && data.routes.length > 0) {
  const route = data.routes[0];
  const steps = route.legs[0].steps;

  console.log("===== Các đoạn đường =====");
  steps.forEach((step, i) => {
    console.log(`${i+1}. ${step.name || "Ae cố gắng xem map"} — ${step.maneuver.instruction}`);
  });
  const nodes = [];

  steps.forEach((step, i) => {
      const [lon, lat] = step.maneuver.location;
      const name = step.name && step.name.trim() !== "" 
        ? step.name 
        : `(${lat.toFixed(6)}, ${lon.toFixed(6)})`;
      const instruction = step.maneuver.instruction || "Xem map nhé ae";

      // Marker màu đỏ cho từng điểm rẽ
      const marker = L.circleMarker([lat, lon], {
        radius: 5,
        color: "red",
        fillColor: "yellow",
        fillOpacity: 0.9
      }).addTo(map);

      marker.bindPopup(`📍 <b>${instruction}</b><br>Đường: ${name}`);
    });

    console.log("===== Các bước chỉ đường =====");
    steps.forEach((step, i) => {
      console.log(`${i + 1}. ${step.maneuver.instruction} → ${step.name}`);
    });
  } else {
    alert("Không tìm thấy đường đi!");
  }
});

