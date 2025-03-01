﻿document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM completamente caricato.");

    const customerKey = "it-azureautomotive";
    const baseUrl = "https://cdn.imagin.studio/getImage";

    // 📌 Dichiarazione degli elementi UI
    const marcaDropdown = document.getElementById("marca");
    const modelloDropdown = document.getElementById("modello");
    const versioneDropdown = document.getElementById("versione");
    const modelVariantDropdown = document.getElementById("modelVariant");
    const angleSlider = document.getElementById("angleSlider");
    const generaBtn = document.getElementById("genera");
    const canvas = document.getElementById("imageCanvas");
    const ctx = canvas.getContext("2d");
    const backgroundVideo = document.getElementById("backgroundVideo");

    if (!marcaDropdown || !modelloDropdown || !versioneDropdown || !modelVariantDropdown ||
        !angleSlider || !generaBtn || !canvas || !backgroundVideo) {
        console.error("❌ ERRORE: Uno o più elementi della UI NON sono stati trovati nel DOM.");
        return;
    }

    console.log("✅ Tutti gli elementi della UI sono stati trovati correttamente.");

    let cachedImages = {}; // Cache locale per immagini degli angoli
    let marcheCaricate = false;

    function loadMarche() {
        if (marcheCaricate) return;
        marcheCaricate = true;

        marcaDropdown.innerHTML = '<option value="" selected>Caricamento...</option>';
        marcaDropdown.disabled = true;

        fetchDropdownData(`https://cdn.imagin.studio/getCarListing?customer=${customerKey}`, marcaDropdown, "make")
            .then(() => {
                marcaDropdown.insertAdjacentHTML("afterbegin", '<option value="" selected>Seleziona una marca</option>');
                marcaDropdown.disabled = false;
            })
            .catch(error => {
                console.error("❌ Errore durante il caricamento delle marche:", error);
            });

    }

    function fetchDropdownData(endpoint, dropdown, keyName) {
        return fetch(endpoint)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`❌ Errore API (${response.status}): ${response.statusText}`);
                }
                return response.json();
            })
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
            })
            .catch(error => {
                console.error("❌ Errore nel caricamento dei dati:", error);
                dropdown.disabled = false;
            });
    }

    // 🎯 Popolamento dinamico dei dropdown
    marcaDropdown.addEventListener("change", function () {
        let selectedMake = marcaDropdown.value;
        if (!selectedMake) return;

        modelloDropdown.innerHTML = '<option value="" selected>Seleziona un modello</option>';
        versioneDropdown.innerHTML = '<option value="" selected>Seleziona una versione</option>';
        modelVariantDropdown.innerHTML = '<option value="" selected>Seleziona una variante</option>';

        fetchDropdownData(`https://cdn.imagin.studio/getCarListing?customer=${customerKey}&make=${selectedMake}`, modelloDropdown, "modelFamily");
    });

    modelloDropdown.addEventListener("change", function () {
        let selectedMake = marcaDropdown.value;
        let selectedModel = modelloDropdown.value;
        if (!selectedMake || !selectedModel) return;

        versioneDropdown.innerHTML = '<option value="" selected>Seleziona una versione</option>';
        modelVariantDropdown.innerHTML = '<option value="" selected>Seleziona una variante</option>';

        fetchDropdownData(`https://cdn.imagin.studio/getCarListing?customer=${customerKey}&make=${selectedMake}&modelFamily=${selectedModel}`, versioneDropdown, "modelRange");
    });

    versioneDropdown.addEventListener("change", function () {
        let selectedMake = marcaDropdown.value;
        let selectedModel = modelloDropdown.value;
        let selectedVersion = versioneDropdown.value;
        if (!selectedMake || !selectedModel || !selectedVersion) return;

        modelVariantDropdown.innerHTML = '<option value="" selected>Seleziona una variante</option>';

        fetchDropdownData(`https://cdn.imagin.studio/getCarListing?customer=${customerKey}&make=${selectedMake}&modelFamily=${selectedModel}&modelRange=${selectedVersion}`, modelVariantDropdown, "modelVariant");
    });

    function preloadImages(make, modelFamily, modelRange, modelVariant) {
        for (let angle = 200; angle <= 231; angle++) {
            let img = new Image();
            img.src = `${baseUrl}?customer=${customerKey}&make=${make}&modelFamily=${modelFamily}&modelRange=${modelRange}&modelVariant=${modelVariant}&angle=${angle}&zoomType=Adaptive&groundPlaneAdjustment=0&fileType=png&safeMode=true&countryCode=IT&billingTag=CIG&steering=lhd&width=1200`;

            img.onload = function () {
                cachedImages[angle] = img;
                console.log(`✅ Immagine caricata in cache: angolo ${angle}`);
            };

            img.onerror = function () {
                console.warn(`⚠️ Errore nel caricamento dell'immagine per angolo ${angle}`);
            };

            cachedImages[angle] = img;
        }
    }

    function generateImage() {
        const make = marcaDropdown.value;
        const modelFamily = modelloDropdown.value;
        const modelRange = versioneDropdown.value;
        const modelVariant = modelVariantDropdown.value;

        if (!make || !modelFamily || !modelRange || !modelVariant) {
            alert("Seleziona tutti i campi prima di generare l'immagine!");
            return;
        }

        preloadImages(make, modelFamily, modelRange, modelVariant);

        const imageUrl = `${baseUrl}?customer=${customerKey}&make=${make}&modelFamily=${modelFamily}&modelRange=${modelRange}&modelVariant=${modelVariant}&angle=0&zoomType=Adaptive&groundPlaneAdjustment=0&fileType=png&safeMode=true&countryCode=IT&billingTag=CIG&steering=lhd&width=1200`;

        let img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        img.onload = function () {
            backgroundVideo.style.display = "block";
            canvas.style.display = "block";

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            angleSlider.disabled = false;
        };
    }

    angleSlider.addEventListener("input", function () {
        let angle = angleSlider.value;

        if (!cachedImages[angle] || !cachedImages[angle].complete) {
            console.warn(`🔄 Immagine per angolo ${angle} non ancora pronta.`);
            return;
        }

        let img = cachedImages[angle];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    });

    generaBtn.addEventListener("click", generateImage);

    loadMarche();
});
