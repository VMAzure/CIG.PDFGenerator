﻿document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM completamente caricato.");

    const customerKey = "it-azureautomotive";
    const baseUrl = "https://cdn.imagin.studio/getImage";

    // 📌 Dichiarazione degli elementi UI all'inizio
    const marcaDropdown = document.getElementById("marca");
    const modelloDropdown = document.getElementById("modello");
    const versioneDropdown = document.getElementById("versione");
    const zoomTypeDropdown = document.getElementById("zoomType");

    const angleSlider = document.getElementById("angleSlider");
    const zoomSlider = document.getElementById("zoomLevel");
    const verticalSlider = document.getElementById("verticalSlider");

    const generaBtn = document.getElementById("genera");
    const canvas = document.getElementById("imageCanvas");
    const ctx = canvas.getContext("2d");

    if (!marcaDropdown || !modelloDropdown || !versioneDropdown || !zoomTypeDropdown ||
        !angleSlider || !zoomSlider || !verticalSlider || !generaBtn || !canvas) {
        console.error("❌ ERRORE: Uno o più elementi della UI NON sono stati trovati nel DOM.");
        return;
    }

    console.log("✅ Tutti gli elementi della UI sono stati trovati correttamente.");

    let cachedImages = {};
    let marcheCaricate = false;

    // 🎯 Carica solo le marche all'inizio UNA SOLA VOLTA
    function loadMarche() {
        if (marcheCaricate) return;
        marcheCaricate = true;

        marcaDropdown.innerHTML = '<option value="" selected>Caricamento...</option>';
        marcaDropdown.disabled = true;

        fetchDropdownData(`https://cdn.imagin.studio/getCarListing?customer=${customerKey}`, marcaDropdown, "make", () => {
            marcaDropdown.insertAdjacentHTML("afterbegin", '<option value="" selected>Seleziona una marca</option>');
            marcaDropdown.disabled = false;
        });
    }

    // 🔄 Funzione per popolare dropdown
    function fetchDropdownData(endpoint, dropdown, keyName, callback) {
        fetch(endpoint)
            .then(response => response.json())
            .then(data => {
                if (!data.preselect || !data.preselect.options || !data.preselect.options[keyName]) {
                    throw new Error(`❌ La chiave '${keyName}' non esiste nei dati ricevuti.`);
                }

                dropdown.innerHTML = '<option value="" selected>Seleziona un valore</option>';
                data.preselect.options[keyName].forEach(item => {
                    let option = document.createElement("option");
                    option.value = item;
                    option.textContent = item.toUpperCase();
                    dropdown.appendChild(option);
                });

                dropdown.disabled = false;
                if (callback) callback();
            })
            .catch(error => {
                console.error("❌ Errore nel caricamento dei dati:", error);
                dropdown.disabled = false;
            });
    }

    // 🎯 Eventi per i dropdown
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

    // 🎥 Rotazione Auto
    angleSlider.addEventListener("input", function () {
        let angle = angleSlider.value;
        let img = cachedImages[angle];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    });

    // 🎥 Spostamento Verticale Auto
    verticalSlider.addEventListener("input", function () {
        let offsetY = parseInt(verticalSlider.value);
        let img = cachedImages[angleSlider.value];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, offsetY, canvas.width, canvas.height);
    });

    // 🎨 Genera immagine e abilita slider
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

    // 🚀 Collega il bottone "Genera Immagine" SOLO DOPO aver dichiarato la funzione
    generaBtn.addEventListener("click", generateImage);

    // 🚀 Avvia caricamento iniziale delle marche
    loadMarche();

});

