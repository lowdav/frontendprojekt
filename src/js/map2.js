//importera ikon med Parcel för senare användning som googlemaps-ikon.
import issIcon from "../img/iss.png";

const googleApiKey = "AIzaSyB5d-KsEdbbAlcWWLcjCptAxYjqCLBHUqU";

let lat, lon, temperature, locationName, altitude, velocity, visibility, timestamp;

/**
 * Eventlyssnare för att lyssna efter klick på ikonen och starta
 * animering av ikonen. startMap anropas med tid som den ska fördröjas 
 * så att ikonen hinner rotera klart.
 */
document.getElementById("icon").addEventListener("click", () => {
    console.log("Klick på ikonen registrerat");
    icon.classList.add("rotate");
    startMap(3000);
});


/**
 * Fördröjning av inhämtning av data samt döljer introsidan och 
 * tar fram kartan. 
 * @param {number} delay antal millisekunder fördröjningen ska vara. 
 */
function startMap(delay) {
    setTimeout(() => {
        document.getElementById("wrapper").style.display = "none"; 
        document.getElementById("map-container").style.display = "block";
        getISSData();
    }, delay);
}

/**
 * Hämta data om ISS
 * Dokumentation https://wheretheiss.at/w/developer
 */
async function getISSData() {
    const url = "https://api.wheretheiss.at/v1/satellites/25544";

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Testar att hämta från annan källa!");
        }

        const data = await response.json();
        console.log("ISS Data:", data);

        lat = data.latitude;
        lon = data.longitude;
        altitude = Math.floor(data.altitude); 
        velocity = Math.floor(data.velocity); 
        visibility = data.visibility;

        const date = new Date(data.timestamp * 1000);
        timestamp = date.toLocaleString("sv-SE", { timeZone: "Europe/Stockholm" });




        if (visibility === "daylight") {
            visibility = "ISS är synlig från jorden";
        } else {
            visibility = "ISS kan just nu inte ses från jorden";
        }
        console.log(`Höjd ${altitude}`);
        console.log(`Hastighet ${velocity}`);
        console.log(visibility);
        console.log(timestamp);

        await Promise.all([
            initMap(lat, lon),
            getLocationInfo(lat, lon),
            getTemperature(lat, lon),
        ]);

        printInfo();

    } catch (error) {
        console.error("Fel vid hämtning av ISS-data:", error);
        loadPosition();
    }
}

/**
 * Fallback-lösning för att hämta ISS position och anropar övriga funktioner med hämtade koordinaterna.
 * Hämtar bara lat och lon.
 * Dokumentation http://open-notify.org
 */
async function loadPosition() {
    try {
        const response = await fetch ("http://api.open-notify.org/iss-now.json");
        if(!response.ok) {
            throw new Error("Hämtning av data fungerade inte");
            //Glöm inte - lägg till användarinfo om detta händer
        }
        const location = await response.json();
        console.log(location);

        // OBS att open-notify skikar svar som sträng, inte nummer, så man måste använda parseFloat.
        lat = parseFloat(location.iss_position.latitude);
        lon = parseFloat(location.iss_position.longitude);

        console.log(lat);
        console.log(lon);

        await Promise.all([
            initMap(lat, lon),
            getLocationInfo(lat, lon),
            getTemperature(lat, lon),
        ]);

        printInfo();

    } catch(error) {
        console.error(error);
    }
}

/**
 * Kod direkt hämtad från Google maps.
 * Dokumentation: https://developers.google.com/maps/documentation/javascript/adding-a-google-map
 */
(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
    key: googleApiKey,
    v: "weekly",
  });

// Initiera och lägg till kartan
let map;

/**
 * Kod hämtad från Google maps API dokumentation, men jag har ersatt statiskt exempel med variabler för
 * latitiud och longitud.
 * @param {number} lat för platsen
 * @param {number} lon för platsen
 */
async function initMap(lat, lon) {
  // Position att visa
  const position = { lat: lat, lng: lon };

  // Importera bibliotek
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

  // Kartan, centrerad på vald position med vald zoom
  map = new Map(document.getElementById("map"), {
    zoom: 3,
    center: position,
    mapId: "DEMO_MAP_ID",
    mapTypeId: "satellite",
  });

// Skapa en anpassad markör för ISS

const iconWrapper = document.createElement("div");
iconWrapper.innerHTML = `<img src="${issIcon}" width="50" height="50">`;

const marker = new AdvancedMarkerElement({
    map: map,
    position: position,
    title: "Space Station ISS",
    content: iconWrapper,
}); 
}

/**
 * Hämtar information om platsen som motsvarar koordinaterna
 * Dokumentation https://developers.google.com/maps/documentation/geocoding/requests-reverse-geocoding
 * @param {number} lat 
 * @param {number} lon 
 */
async function getLocationInfo(lat, lon) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${googleApiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(data);

        if (data.status === "OK" && data.results.length > 0) {
            locationName = null;

            // Försök hitta ett land
            for (let result of data.results) {
                if (result.types.includes("country")) {
                    locationName = result.formatted_address;
                    console.log(locationName);
                    break;
                }
            }

            // Om inget land hittas, leta efter annan info (stad, region, hav)
            if (!locationName) {
                for (let result of data.results) {
                    if (result.types.includes("natural_feature") || result.types.includes("locality") || result.types.includes("administrative_area_level_1")) {
                        locationName = result.formatted_address;
                        console.log(locationName);
                        break;
                    }
                }
            }
            // Om inget finns lagra fallback-meddelande
            if (!locationName) {
            locationName = "Okänd plats - ISS befinner sig troligen över hav";
            console.log(locationName);
        }
        } else {
            console.log("Ingen plats hittades.");
        }

    } catch (error) {
        console.error("Ett fel uppstod:", error);
    }}

/**
 * Hämtar aktuell temperatur från angivnia koordinater
 * Dokumentation https://open-meteo.com/en/docs
 * @param {number} lat 
 * @param {number} lon 
 */
    async function getTemperature(lat, lon) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&timezone=auto`;
    
        try {
            const response = await fetch(url);
            const data = await response.json();
    
            if (data.current && data.current.temperature_2m !== undefined) {
                console.log(`Temperatur vid (${lat}, ${lon}): ${data.current.temperature_2m}°C`);
                temperature = data.current.temperature_2m;
            } else {
                console.log("Kunde inte hämta väderdata.");
                temperature = "Hittade ingen väderdata för platsen";
            }
        } catch (error) {
            console.error("Ett fel uppstod:", error);
        }
    }

/**
 * Skriver ut hämtad information till DOM
 */
    function printInfo() {
        const container = document.getElementById("info-container");
        container.innerHTML = "";

        /**
         * 
         * @param {string} value Värdet som ska skrivas ut.
         */
        function addInfo (value) {
            if (value) {
                const div = document.createElement("div");
                div.classList.add("card");
                div.innerHTML = `<p>${value}</p>`;
                container.appendChild(div);
            }
        }

        addInfo(`Lat ${lat}`);
        addInfo(`Lon ${lon}`);
        addInfo(locationName);
        addInfo(`${temperature} celsius vid platsen`);
        addInfo(`${altitude} km över jorden`); 
        addInfo(`${velocity} km/h`);
        addInfo(visibility);
        addInfo(timestamp);
        addInfo("Klicka på valfri textruta för att uppdatera sidan");
    
        document.querySelectorAll(".card").forEach(card => {
            card.addEventListener("click", () => {
                console.log("Klick på kort registrerat");
                getISSData(); 
            });
        });
    }