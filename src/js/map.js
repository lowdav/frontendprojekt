//importera ikon med Parcel för senare användning som googlemaps-ikon.
import issIcon from "../img/iss.png";

const googleApiKey = "AIzaSyB5d-KsEdbbAlcWWLcjCptAxYjqCLBHUqU";

let lat, lon;

/**
 * Hämta ISS position och ladda kartan. 
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

        lat = parseFloat(location.iss_position.latitude);
        lon = parseFloat(location.iss_position.longitude);

        console.log(lon);
        console.log(lat);

        initMap(lon, lat);

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
async function initMap(lon, lat) {
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

loadPosition();
