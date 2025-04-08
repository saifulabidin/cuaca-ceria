// File: js/main.js

const jalurCsv = "city_coordinates.csv";
const petaKota = new Map();
let isCelsius = true; // Track the current temperature unit

$(document).ready(() => {
  tanganiCsv();

  $("#pilihGaya").on("change", function () {
    const kota = $(this).val();
    localStorage.setItem("kotaTerakhir", kota);
    tampilkanData();
  });

  $("#toggleTemp").on("click", () => {
    isCelsius = !isCelsius;
    tampilkanData(); // Refresh data to update temperature unit
  });

  const terakhir = localStorage.getItem("kotaTerakhir");
  if (terakhir) $("#pilihGaya").val(terakhir).trigger("change");
});

async function tanganiCsv() {
  try {
    const response = await fetch(jalurCsv);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const text = await response.text();
    const lines = text.split("\n");

    lines.forEach((line, i) => {
      const kolom = line.split(",").map(x => x.trim());
      if (kolom.length < 4) return;

      const namaKota = `${kolom[2]}, ${kolom[3]}`;
      const koordinat = { lat: kolom[0], long: kolom[1] };
      petaKota.set(namaKota, koordinat);

      $("#pilihGaya").append($('<option>').val(namaKota).text(namaKota));
    });

    if ($.fn.select2) {
      $("#pilihGaya").select2({ placeholder: "Pilih kota...", allowClear: true });
    } else {
      console.warn("Select2 is not loaded");
    }

    const last = localStorage.getItem("kotaTerakhir");
    if (last) $("#pilihGaya").val(last).trigger("change");
  } catch (err) {
    console.error("Gagal memuat CSV:", err);
    alert("Gagal memuat data kota. Silakan coba lagi nanti.");
  }
}

function tampilkanData() {
  const selected = $("#pilihGaya").val();
  const koordinat = petaKota.get(selected);
  const container = document.getElementById("tabelTampilan");
  const loader = document.getElementById("loader");

  if (!koordinat || !container || !loader) return;

  container.innerHTML = "";
  loader.style.display = "block";

  fetch(`https://www.7timer.info/bin/api.pl?lon=${koordinat.lat}&lat=${koordinat.long}&product=civillight&output=json`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (!data.dataseries) throw new Error("Invalid data format");
      const petaCuaca = {
        clear: "Cerah",
        cloudy: "Sangat Berawan",
        fog: "Berkabut",
        humid: "Lembab",
        ishower: "Hujan Ringan Terisolasi",
        lightrain: "Hujan Ringan",
        lightsnow: "Salju Ringan",
        mcloudy: "Berawan",
        oshower: "Hujan Sesekali",
        pcloudy: "Cerah Berawan",
        rain: "Hujan",
        rainsnow: "Campuran Hujan & Salju",
        snow: "Salju",
        ts: "Kemungkinan Petir",
        tsrain: "Petir dan Hujan",
        tstorm: "Kemungkinan Badai Petir",
        windy: "Berangin"
      };

      data.dataseries.forEach((elemen, index) => {
        const tanggalStr = String(elemen.date);
        const date = new Date(`${tanggalStr.slice(0, 4)}-${tanggalStr.slice(4, 6)}-${tanggalStr.slice(6)}`);
        const gambar = `images/${elemen.weather}.png`;
        const kondisi = petaCuaca[elemen.weather] || elemen.weather;
        const kelasCuaca = `cuaca-${elemen.weather}`;
        
        // Extract and validate temperature
        const suhuC = elemen.temp2m?.max || 0; // Use max temperature from temp2m, fallback to 0
        const suhuF = (suhuC * 9) / 5 + 32; // Convert to Fahrenheit
        const suhu = isCelsius ? `${suhuC}°C` : `${suhuF.toFixed(1)}°F`;

        const markup = `
          <li class="kotak ${kelasCuaca}" style="--delay: ${index * 0.1}s">
            <p>${date.toDateString()}</p>
            <img src="${gambar}" alt="${elemen.weather}" onerror="this.src='images/default.png'">
            <p>${kondisi}</p>
            <p>${suhu}</p>
          </li>`;

        container.insertAdjacentHTML("beforeend", markup);
      });
    })
    .catch(err => {
      console.error("Gagal memuat data cuaca:", err);
      alert("Gagal memuat data cuaca. Silakan coba lagi nanti.");
    })
    .finally(() => {
      loader.style.display = "none";
    });
}
