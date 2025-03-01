document.addEventListener("DOMContentLoaded", function () {
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

    // 🎯 Popolamento dinamico dei dropdown con aggiornamento del titolo
    marcaDropdown.addEventListener("change", function () {
        let selectedMake = marcaDropdown.value;
        if (!selectedMake) return;

        // ✅ Aggiorna il titolo con la Marca selezionata
        document.getElementById("selectedMake").textContent = selectedMake.toUpperCase();

        modelloDropdown.innerHTML = '<option value="" selected>Seleziona un modello</option>';
        versioneDropdown.innerHTML = '<option value="" selected>Seleziona una versione</option>';
        modelVariantDropdown.innerHTML = '<option value="" selected>Seleziona una variante</option>';

        fetchDropdownData(`https://cdn.imagin.studio/getCarListing?customer=${customerKey}&make=${selectedMake}`, modelloDropdown, "modelFamily");
    });

    modelloDropdown.addEventListener("change", function () {
        let selectedMake = marcaDropdown.value;
        let selectedModel = modelloDropdown.value;
        if (!selectedMake || !selectedModel) return;

        // ✅ Aggiorna il titolo con il Modello selezionato
        document.getElementById("selectedModel").textContent = selectedModel;

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

            angleSlider.disabled = false;  // ✅ Abilita slider rotazione
            colorCarBtn.disabled = false;  // ✅ Abilita il bottone "Colora l'Auto"
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

    const colorCarBtn = document.getElementById("colorCarBtn");
    const colorPicker = document.getElementById("colorPicker");

    colorCarBtn.disabled = true; // Disattivato finché non viene generata un'immagine

    // ✅ Abilita il bottone dopo la generazione dell'immagine
    function enableColorButton() {
        colorCarBtn.disabled = false;
    }

    // 🎨 Recupera i colori disponibili dall'API di IMAGIN
    // 🎨 Recupera i colori disponibili dall'API di IMAGIN
    function fetchAvailableColors(make, modelFamily, modelRange, modelVariant) {
        const colorApiUrl = `https://cdn.imagin.studio/getPaints?customer=${customerKey}&target=make&make=${make}&modelFamily=${modelFamily}&modelRange=${modelRange}&modelVariant=${modelVariant}`;

        console.log(`📡 Chiamata API per i colori: ${colorApiUrl}`); // Debug URL

        return fetch(colorApiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`❌ Errore API (${response.status}): ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("📥 Risposta API colori:", data); // Debug JSON ricevuto

                if (!data.paintData || !data.paintData.paintCombinations) {
                    throw new Error("⚠️ Nessun colore disponibile per questa auto.");
                }

                // Estrarre gli ID dei colori disponibili
                let colorOptions = Object.keys(data.paintData.paintCombinations).map(paintId => ({
                    id: paintId,
                    color: data.paintData.paintCombinations[paintId].paintSwatch.primary.midLight, // Usa la tonalità media per la preview
                    description: data.paintData.paintCombinations[paintId].mapped
                        ? Object.values(data.paintData.paintCombinations[paintId].mapped)[0].paintDescription
                        : "Senza Nome"
                }));

                return colorOptions;
            })
            .catch(error => {
                console.error("❌ Errore nel caricamento dei colori:", error);
                return []; // Ritorna un array vuoto per evitare crash
            });
    }


    // ✅ Quando clicchi su "Colora l'Auto", mostra il color picker
    // ✅ Quando clicchi su "Colora l'Auto", mostra un color picker con i colori disponibili
    colorCarBtn.addEventListener("click", function () {
        const make = marcaDropdown.value;
        const modelFamily = modelloDropdown.value;
        const modelRange = versioneDropdown.value;
        const modelVariant = modelVariantDropdown.value;

        if (!make || !modelFamily || !modelRange || !modelVariant) {
            alert("⚠️ Seleziona tutti i parametri prima di colorare l'auto!");
            return;
        }

        fetchAvailableColors(make, modelFamily, modelRange, modelVariant).then(colors => {
            if (colors.length === 0) {
                alert("⚠️ Nessun colore disponibile per questa auto.");
                return;
            }

            // Creazione dinamica di un color-picker visivo
            let colorPickerContainer = document.createElement("div");
            colorPickerContainer.id = "colorPickerContainer";
            colorPickerContainer.style.position = "absolute";
            colorPickerContainer.style.top = "50px";
            colorPickerContainer.style.left = "50%";
            colorPickerContainer.style.transform = "translateX(-50%)";
            colorPickerContainer.style.background = "#333";
            colorPickerContainer.style.padding = "10px";
            colorPickerContainer.style.borderRadius = "5px";
            colorPickerContainer.style.display = "flex";
            colorPickerContainer.style.flexWrap = "wrap";
            colorPickerContainer.style.justifyContent = "center";
            colorPickerContainer.style.gap = "10px";
            colorPickerContainer.style.zIndex = "1000";

            // Aggiungi ogni colore come bottone selezionabile
            colors.forEach(color => {
                let colorButton = document.createElement("button");
                colorButton.style.backgroundColor = color.color;
                colorButton.style.width = "30px";
                colorButton.style.height = "30px";
                colorButton.style.border = "2px solid white";
                colorButton.style.borderRadius = "50%";
                colorButton.style.cursor = "pointer";
                colorButton.title = color.description;

                colorButton.addEventListener("click", function () {
                    document.body.removeChild(colorPickerContainer); // Chiudi il picker dopo la selezione
                    updateCarColor(make, modelFamily, modelRange, modelVariant, color.id);
                });

                colorPickerContainer.appendChild(colorButton);
            });

            // Aggiungi il color picker alla pagina
            document.body.appendChild(colorPickerContainer);
        });
    });


    // 🎨 Aggiorna l'immagine con il colore selezionato
    function updateCarColor(make, modelFamily, modelRange, modelVariant, selectedColor) {
        const currentAngle = parseInt(angleSlider.value); // Usa l'angolo attuale della slidebar
        const imageUrl = `${baseUrl}?customer=${customerKey}&make=${make}&modelFamily=${modelFamily}&modelRange=${modelRange}&modelVariant=${modelVariant}&paintId=${selectedColor}&angle=${currentAngle}&zoomType=Adaptive&groundPlaneAdjustment=0&fileType=png&safeMode=true&countryCode=IT&billingTag=CIG&steering=lhd&width=1200`;

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

});
