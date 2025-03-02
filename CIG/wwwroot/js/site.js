let make, modelFamily, modelRange, modelVariant;
let selectedColorId = null;  // Colore scelto


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

    const angleSliderContainer = document.getElementById("angleSliderContainer");
    const specialViewContainer = document.getElementById("specialViewContainer");
    const prevSpecial = document.getElementById("prevSpecial");
    const nextSpecial = document.getElementById("nextSpecial");

    document.getElementById("tabSpeciali").click();

    console.log(angleSliderContainer, specialViewContainer, prevSpecial, nextSpecial);

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

    function preloadImages(make, modelFamily, modelRange, modelVariant, selectedColorId = null) {
        cachedImages = {}; // ripulisci la cache precedente

        for (let angle = 200; angle <= 231; angle++) {
            let img = new Image();
            let colorParam = selectedColorId ? `&paintId=${selectedColorId}` : '';

            img.src = `${baseUrl}?customer=${customerKey}&make=${make}&modelFamily=${modelFamily}&modelRange=${modelRange}&modelVariant=${modelVariant}&angle=${angle}${colorParam}&zoomType=Adaptive&groundPlaneAdjustment=0&fileType=png&safeMode=true&countryCode=IT&billingTag=CIG&steering=lhd&width=1200`;

            img.onload = function () {
                cachedImages[angle] = img;
                console.log(`✅ Immagine caricata in cache: angolo ${angle}`);
            };

            img.onerror = function () {
                console.warn(`⚠️ Errore nel caricamento dell'immagine per angolo ${angle}`);
            };
        }
    }


    function generateImage() {
        make = marcaDropdown.value;
        modelFamily = modelloDropdown.value;
        modelRange = versioneDropdown.value;
        modelVariant = modelVariantDropdown.value;

        if (!make || !modelFamily || !modelRange || !modelVariant) {
            alert("Seleziona tutti i campi prima di generare l'immagine!");
            return;
        }

        const loader = document.getElementById("loader");
        loader.style.display = "block";  // mostra il loader

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
            colorCarBtn.disabled = false;
            downloadImageBtn.disabled = false;

            preloadSpecialImages(make, modelFamily, modelRange, modelVariant);

            specialImages[0].onload = function () {
                currentSpecialIndex = 0;
                displaySpecialImage(currentSpecialIndex);
                loader.style.display = "none";

                // Riattiva qui la possibilità di cliccare la tab 360
                document.getElementById("tab360").disabled = false;
            };

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

   
    // 🎨 Recupera e raggruppa i colori disponibili dall'API di IMAGIN
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

                let colorGroups = {}; // Oggetto per raggruppare i colori per famiglia

                Object.keys(data.paintData.paintCombinations).forEach(paintId => {
                    let paint = data.paintData.paintCombinations[paintId];

                    if (!paint.paintSwatch || !paint.paintSwatch.primary) return;

                    let colorHex = paint.paintSwatch.primary.midLight; // Usa la tonalità media per la preview
                    let colorCategory = paint.paintSwatch.primary.colourCluster; // Categoria colore (es: "black", "blue", etc.)
                    let colorDescription = paint.mapped
                        ? Object.values(paint.mapped)[0].paintDescription
                        : "Senza Nome";

                    // Se la categoria di colore non è ancora nel nostro oggetto, la aggiungiamo
                    if (!colorGroups[colorCategory]) {
                        colorGroups[colorCategory] = {
                            id: paintId,
                            color: colorHex,
                            description: colorDescription
                        };
                    }
                });

                // Convertiamo l'oggetto in un array per il color picker
                return Object.values(colorGroups);
            })
            .catch(error => {
                console.error("❌ Errore nel caricamento dei colori:", error);
                return []; // Ritorna un array vuoto per evitare crash
            });
    }

    // ✅ Quando clicchi su "Colora l'Auto", mostra il color picker con i colori disponibili
    colorCarBtn.addEventListener("click", function () {
        make = marcaDropdown.value;
        modelFamily = modelloDropdown.value;
        modelRange = versioneDropdown.value;
        modelVariant = modelVariantDropdown.value;

        if (!make || !modelFamily || !modelRange || !modelVariant) {
            alert("⚠️ Seleziona tutti i parametri prima di colorare l'auto!");
            return;
        }

        fetchAvailableColors(make, modelFamily, modelRange, modelVariant).then(colors => {
            if (colors.length === 0) {
                alert("⚠️ Nessun colore disponibile per questa auto.");
                return;
            }

            // Se esiste già un color picker aperto, rimuovilo
            const existingColorPicker = document.getElementById("colorPickerContainer");
            if (existingColorPicker) {
                existingColorPicker.remove();
            }

            // Creazione dinamica del color picker
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

            colors.forEach(color => {
                let colorButton = document.createElement("button");
                colorButton.style.backgroundColor = color.color;
                colorButton.style.width = "40px";
                colorButton.style.height = "40px";
                colorButton.style.border = "2px solid white";
                colorButton.style.borderRadius = "50%";
                colorButton.style.cursor = "pointer";
                colorButton.title = color.description; // Mostra il nome del colore al passaggio del mouse

                colorButton.addEventListener("click", function () {
                    console.log("Colore cliccato:", color.id);  // Debug rapido

                    updateCarColor(make, modelFamily, modelRange, modelVariant, color.id);
                    colorPickerContainer.remove(); // Chiude il color picker immediatamente
                });

                colorPickerContainer.appendChild(colorButton);
            });

            // Aggiungi il color picker alla pagina
            document.body.appendChild(colorPickerContainer);
        });
    });


    // 🎨 Aggiorna l'immagine con il colore selezionato
    function updateCarColor(make, modelFamily, modelRange, modelVariant, selectedColor) {
        selectedColorId = selectedColor; // salva il colore scelto globalmente

        const loader = document.getElementById("loader");
        loader.style.display = "block"; // ✅ Mostra il loader

        const currentAngle = parseInt(angleSlider.value);
        const imageUrl = `${baseUrl}?customer=${customerKey}&make=${make}&modelFamily=${modelFamily}&modelRange=${modelRange}&modelVariant=${modelVariant}&paintId=${selectedColor}&angle=${currentAngle}&zoomType=Adaptive&groundPlaneAdjustment=0&fileType=png&safeMode=true&countryCode=IT&billingTag=CIG&steering=lhd&width=1200`;

        let img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        img.onload = function () {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            loader.style.display = "none"; // ✅ Nascondi il loader
        };

        img.onerror = function () {
            alert("Errore nel caricamento dell'immagine.");
            loader.style.display = "none"; // Nasconde il loader in caso di errore
        };
    }


    const downloadImageBtn = document.getElementById("downloadImageBtn");
    downloadImageBtn.disabled = true; // Disattivato finché non viene generata un'immagine

    downloadImageBtn.addEventListener("click", handleDownloadImage);



    function handleDownloadImage() {
        if (!canvas) return;

        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");

        // Imposta la stessa dimensione del canvas originale
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;

        // Disegna solo l'immagine dell'auto, escludendo lo sfondo
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(canvas, 0, 0);

        // Crea il file PNG
        const image = tempCanvas.toDataURL("image/png");

        // Crea un link per il download e rimuove eventuali eventi duplicati
        const existingLink = document.getElementById("downloadLink");
        if (existingLink) {
            existingLink.remove();
        }

        const link = document.createElement("a");
        link.id = "downloadLink";
        link.href = image;
        link.download = "Azure_CIG.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    
    document.getElementById("tab360").addEventListener("click", function () {
        this.classList.add('active');
        document.getElementById('tabSpeciali').classList.remove('active');

        angleSliderContainer.style.display = "block";
        specialViewContainer.style.display = "flex";

        const loader = document.getElementById("loader");
        loader.style.display = "block"; // Mostra subito il loader

        angleSlider.disabled = true;

        if (Object.keys(cachedImages).length === 0) {
            preloadImages(make, modelFamily, modelRange, modelVariant, selectedColorId);

            let checkInterval = setInterval(() => {
                if (cachedImages[200] && cachedImages[200].complete) {
                    clearInterval(checkInterval);
                    loader.style.display = "none"; // nasconde il loader
                    angleSlider.disabled = false;
                    angleSlider.dispatchEvent(new Event("input"));
                }
            }, 100);
        } else {
            loader.style.display = "none"; // nasconde subito il loader se già caricato
            angleSlider.disabled = false;
            angleSlider.dispatchEvent(new Event("input"));
        }

        prevSpecial.style.display = "none";
        nextSpecial.style.display = "none";
    });



    document.getElementById("tabSpeciali").addEventListener("click", function () {
        this.classList.add('active');
        document.getElementById('tab360').classList.remove('active');

        angleSliderContainer.style.display = "none";
        specialViewContainer.style.display = "flex";

        prevSpecial.style.display = "block";
        nextSpecial.style.display = "block";
    });



    // Aggiorna canvas con l'angolo speciale cliccato
    function updateCanvasSpecialView(make, modelFamily, modelRange, modelVariant, angle) {
        const specialImageUrl = `${baseUrl}?customer=${customerKey}&make=${make}&modelFamily=${modelFamily}&modelRange=${modelRange}&modelVariant=${modelVariant}&angle=${angle}&zoomType=Adaptive&groundPlaneAdjustment=0&fileType=png&width=1200`;

        let img = new Image();
        img.crossOrigin = "anonymous";
        img.src = specialImageUrl;

        img.onload = function () {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
    }

    let specialAngles = [17, 21, 25, 27, 51, 33];
    let specialImages = [];
    let currentSpecialIndex = 0;

    // Carica le immagini speciali
    function preloadSpecialImages(make, modelFamily, modelRange, modelVariant) {
        specialImages = [];

        specialAngles.forEach(angle => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = `${baseUrl}?customer=${customerKey}&make=${make}&modelFamily=${modelFamily}&modelRange=${modelRange}&modelVariant=${modelVariant}&angle=${angle}&zoomType=Adaptive&groundPlaneAdjustment=0&fileType=png&width=1200`;
            specialImages.push(img);
        });
    }


    // Mostra la vista speciale corrente sul canvas
    function displaySpecialImage(index) {
        const loader = document.getElementById("loader");
        loader.style.display = "block"; // ✅ Mostra loader

        const angle = specialAngles[index];
        const imageUrl = `${baseUrl}?customer=${customerKey}&make=${marcaDropdown.value}&modelFamily=${modelloDropdown.value}&modelRange=${versioneDropdown.value}&modelVariant=${modelVariantDropdown.value}&paintId=${selectedColorId}&angle=${angle}&zoomType=Adaptive&groundPlaneAdjustment=0&fileType=png&width=1200`;

        let img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;

        img.onload = function () {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            loader.style.display = "none"; // ✅ Nascondi loader
        };

        img.onerror = function () {
            alert("Errore nel caricamento dell'immagine speciale.");
            loader.style.display = "none";
        };
    }

    document.getElementById("prevSpecial").style.display = "block";
    document.getElementById("nextSpecial").style.display = "block";

    // Eventi click per i pulsanti di navigazione
    document.getElementById("prevSpecial").addEventListener("click", function () {
        currentSpecialIndex = (currentSpecialIndex - 1 + specialImages.length) % specialImages.length;
        displaySpecialImage(currentSpecialIndex);
    });

    document.getElementById("nextSpecial").addEventListener("click", function () {
        currentSpecialIndex = (currentSpecialIndex + 1) % specialImages.length;
        displaySpecialImage(currentSpecialIndex);
    });

    // Gestione tab viste speciali
    document.getElementById("tabSpeciali").addEventListener("click", function () {
        if (specialImages.length === 0) {
            alert("Genera prima un'immagine in Vista 360°");
            return;
        }

        document.getElementById("angleSliderContainer").style.display = "none";
        document.getElementById("prevSpecial").style.display = "block";
        document.getElementById("nextSpecial").style.display = "block";
        displaySpecialImage(currentSpecialIndex);

        // Gestione attivazione tab
        document.getElementById("tabSpeciali").classList.add("active");
        document.getElementById("tab360").classList.remove("active");
    });

    // Gestione tab vista 360°
    document.getElementById("tab360").addEventListener("click", function () {
        document.getElementById("angleSliderContainer").style.display = "block";
        document.getElementById("prevSpecial").style.display = "none";
        document.getElementById("nextSpecial").style.display = "none";

        angleSlider.dispatchEvent(new Event("input"));

        // Gestione attivazione tab
        document.getElementById("tab360").classList.add("active");
        document.getElementById("tabSpeciali").classList.remove("active");
    });

});
