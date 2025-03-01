document.addEventListener("DOMContentLoaded", function () {
    const customerKey = "it-azureautomotive"; // 🔴 Inserisci la tua chiave API
    const baseUrl = "https://cdn.imagin.studio/getImage";

    // Elementi della UI
    // 🔹 Dichiarazione degli elementi della UI
    const customerKey = "it-azureautomotive";
    const baseUrl = "https://cdn.imagin.studio/getImage";

    const marcaDropdown = document.getElementById("marca");
    const modelloDropdown = document.getElementById("modello");
    const versioneDropdown = document.getElementById("versione");
    const zoomTypeDropdown = document.getElementById("zoomType");

    const angleSlider = document.getElementById("angleSlider");
    const zoomSlider = document.getElementById("zoomLevel");
    const verticalSlider = document.getElementById("verticalSlider"); // ✅ Fix slider verticale

    const angleValue = document.getElementById("angleValue");
    const zoomValue = document.getElementById("zoomValue");

    const generaBtn = document.getElementById("genera");
    const canvas = document.getElementById("imageCanvas");
    const ctx = canvas.getContext("2d");

    // ✅ Ora gli elementi sono dichiarati prima di essere usati!


    // 🎯 Carica solo le marche all'inizio
    let marcheCaricate = false; // Flag per evitare doppie chiamate

    function loadMarche() {
        if (marcheCaricate) return; // ✅ Evita chiamate ripetute
        marcheCaricate = true; // ✅ Imposta il flag per evitare doppie chiamate

        marcaDropdown.innerHTML = '<option value="" selected>Caricamento...</option>';
        marcaDropdown.disabled = true;

        fetchDropdownData(`https://cdn.imagin.studio/getCarListing?customer=${customerKey}`, marcaDropdown, "make", () => {
            marcaDropdown.insertAdjacentHTML("afterbegin", '<option value="" selected>Seleziona una marca</option>');
            marcaDropdown.disabled = false; // ✅ Abilita il dropdown dopo il caricamento
        });
    }


    // 🔄 Funzione per popolare un dropdown con opzione iniziale
    function fetchDropdownData(endpoint, dropdown, keyName, callback) {
        console.log("🔍 Chiamata API a:", endpoint); // Debug

        fetch(endpoint)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Errore API: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("✅ JSON ricevuto:", data); // Debug

                if (!data.preselect || !data.preselect.options || !data.preselect.options[keyName]) {
                    throw new Error(`❌ La chiave '${keyName}' non esiste nei dati ricevuti.`);
                }

                const optionsList = data.preselect.options[keyName];

                dropdown.innerHTML = '<option value="" selected>Seleziona un valore</option>'; // ✅ Opzione iniziale
                optionsList.forEach(item => {
                    let option = document.createElement("option");
                    option.value = item;
                    option.textContent = item.toUpperCase();
                    dropdown.appendChild(option);
                });

                dropdown.disabled = false; // ✅ Assicuriamoci che il dropdown sia sempre abilitato!

                if (callback) callback(); // Esegui callback per il dropdown successivo
            })
            .catch(error => {
                console.error("❌ Errore nel caricamento dei dati:", error);
                dropdown.disabled = false; // ✅ Evita che rimanga bloccato in caso di errore
            });
    }


    // 🎯 Quando cambia la marca, carica i modelli
    marcaDropdown.addEventListener("change", function () {
        let selectedMake = marcaDropdown.value;
        if (!selectedMake) return;

        modelloDropdown.innerHTML = '<option value="" selected>Seleziona un modello</option>';
        versioneDropdown.innerHTML = '<option value="" selected>Seleziona una versione</option>';

        fetchDropdownData(`https://cdn.imagin.studio/getCarListing?customer=${customerKey}&make=${selectedMake}`, modelloDropdown, "modelFamily");
    });

    modelloDropdown.addEventListener("change", function () {
        let selectedMake = marcaDropdown.value;
        let selectedModel = modelloDropdown.value;
        if (!selectedMake || !selectedModel) return;

        versioneDropdown.innerHTML = '<option value="" selected>Seleziona una versione</option>';

        fetchDropdownData(`https://cdn.imagin.studio/getCarListing?customer=${customerKey}&make=${selectedMake}&modelFamily=${selectedModel}`, versioneDropdown, "modelRange");
    });


      // 🚀 Avvia caricamento iniziale delle marche
    loadMarche();

    // 🎨 Genera immagine
    function generateImage() {
        const make = marcaDropdown.value;
        const modelFamily = modelloDropdown.value;
        const modelRange = versioneDropdown.value;
        const paintId = coloreDropdown.value;
        const zoomType = zoomTypeDropdown.value;
        const angle = angleSlider.value;
        const zoomLevel = zoomSlider.value;
        const groundPlaneAdjustment = groundSlider.value;

        if (!make || !modelFamily || !modelRange) {
            alert("Seleziona tutti i campi prima di generare l'immagine!");
            return;
        }

        // 🌍 Costruzione URL API
        // 🌍 Costruzione URL API senza paintId
        const imageUrl = `${baseUrl}?customer=${customerKey}&make=${make}&modelFamily=${modelFamily}&modelRange=${modelRange}&angle=${angle}&zoomType=${zoomType}&zoomLevel=${zoomLevel}&groundPlaneAdjustment=0&fileType=png&safeMode=true&countryCode=IT&billingTag=CIG&steering=lhd`;

        console.log("📸 URL generato:", imageUrl); // Debug

        // 🖼️ Mostra l'immagine nel canvas
        let img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        img.onload = function () {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
    }

    // 🔄 Aggiorna valori slidebar in tempo reale
    angleSlider.oninput = () => { angleValue.textContent = angleSlider.value; };
    zoomSlider.oninput = () => { zoomValue.textContent = zoomSlider.value; };
    groundSlider.oninput = () => { groundValue.textContent = groundSlider.value; };

    // 🚀 Inizializza
    
    let cachedImages = {}; // 🔹 Oggetto per tenere in cache le immagini di ogni angolo

    // 🖼️ Scarica tutte le immagini nella cache locale
    function preloadImages(make, modelFamily, modelRange) {
        for (let angle = 200; angle <= 231; angle++) {
            let img = new Image();
            img.src = `${baseUrl}?customer=${customerKey}&make=${make}&modelFamily=${modelFamily}&modelRange=${modelRange}&angle=${angle}&zoomType=${zoomTypeDropdown.value}&zoomLevel=${zoomSlider.value}&groundPlaneAdjustment=0&fileType=png&safeMode=true&countryCode=IT&billingTag=CIG&steering=lhd`;
            cachedImages[angle] = img;
        }
    }

    // 🎨 Genera immagine iniziale e abilita slider
    function generateImage() {
        const make = marcaDropdown.value;
        const modelFamily = modelloDropdown.value;
        const modelRange = versioneDropdown.value;
        const zoomType = zoomTypeDropdown.value;
        const zoomLevel = zoomSlider.value;

        if (!make || !modelFamily || !modelRange) {
            alert("Seleziona tutti i campi prima di generare l'immagine!");
            return;
        }

        // 📥 Precarica immagini per la rotazione
        preloadImages(make, modelFamily, modelRange);

        // 🖼️ Mostra l'immagine iniziale
        const imageUrl = `${baseUrl}?customer=${customerKey}&make=${make}&modelFamily=${modelFamily}&modelRange=${modelRange}&angle=0&zoomType=${zoomType}&zoomLevel=${zoomLevel}&groundPlaneAdjustment=0&fileType=png&safeMode=true&countryCode=IT&billingTag=CIG&steering=lhd`;

        let img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        img.onload = function () {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            angleSlider.disabled = false; // ✅ Abilita slider dopo il primo caricamento
        };
    }

    // 🎥 Cambia immagine in base allo slider
    angleSlider.addEventListener("input", function () {
        let angle = angleSlider.value;
        let img = cachedImages[angle]; // 🔹 Prende l'immagine dalla cache
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    });

    const verticalSlider = document.getElementById("verticalSlider");

    verticalSlider.addEventListener("input", function () {
        let offsetY = parseInt(verticalSlider.value);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let img = cachedImages[angleSlider.value]; // 🔹 Prende l'immagine attuale dalla cache
        ctx.drawImage(img, 0, offsetY, canvas.width, canvas.height); // 🔹 Sposta l'immagine in verticale
    });


});
