document.addEventListener("DOMContentLoaded", function () {
    const customerKey = "it-azureautomotive";
    const baseUrl = "https://cdn.imagin.studio/getImage";

    // Elementi della UI
    const marcaDropdown = document.getElementById("marca");
    const modelloDropdown = document.getElementById("modello");
    const versioneDropdown = document.getElementById("versione");
    const zoomTypeDropdown = document.getElementById("zoomType");

    const angleSlider = document.getElementById("angleSlider");
    const zoomSlider = document.getElementById("zoomLevel");
    const verticalSlider = document.getElementById("verticalSlider");

    const angleValue = document.getElementById("angleValue");
    const zoomValue = document.getElementById("zoomValue");

    const generaBtn = document.getElementById("genera");
    const canvas = document.getElementById("imageCanvas");
    const ctx = canvas ? canvas.getContext("2d") : null;

    let cachedImages = {}; // Cache per le immagini dei vari angoli

    if (!marcaDropdown || !modelloDropdown || !versioneDropdown || !zoomTypeDropdown || !angleSlider || !zoomSlider || !verticalSlider || !generaBtn || !canvas) {
        console.error("❌ Errore: Uno o più elementi della UI non sono stati trovati nel DOM.");
        return;
    }

    // 🎯 Carica solo le marche all'inizio UNA SOLA VOLTA
    function loadMarche() {
        fetchDropdownData(`https://cdn.imagin.studio/getCarListing?customer=${customerKey}`, marcaDropdown, "make");
    }

    // 🔄 Funzione per popolare un dropdown con opzione iniziale
    function fetchDropdownData(endpoint, dropdown, keyName, callback) {
        fetch(endpoint)
            .then(response => response.json())
            .then(data => {
                if (!data.preselect || !data.preselect.options || !data.preselect.options[keyName]) {
                    throw new Error(`❌ La chiave '${keyName}' non esiste nei dati ricevuti.`);
                }

                const optionsList = data.preselect.options[keyName];
                dropdown.innerHTML = '<option value="" selected>Seleziona un valore</option>';
                optionsList.forEach(item => {
                    let option = document.createElement("option");
                    option.value = item;
                    option.textContent = item.toUpperCase();
                    dropdown.appendChild(option);
                });

                dropdown.disabled = false;
                if (callback) callback();
            })
            .catch(error => console.error("❌ Errore nel caricamento dei dati:", error));
    }

    // 🎯 Quando cambia la marca, carica i modelli
    marcaDropdown.addEventListener("change", function () {
        let selectedMake = marcaDropdown.value;
        if (!selectedMake) return;

        modelloDropdown.innerHTML = '<option value="" selected>Seleziona un modello</option>';
        versioneDropdown.innerHTML = '<option value="" selected>Seleziona una versione</option>';

        fetchDropdownData(`https://cdn.imagin.studio/getCarListing?customer=${customerKey}&make=${selectedMake}`, modelloDropdown, "modelFamily");
    });

    // 🎯 Quando cambia il modello, carica le versioni
    modelloDropdown.addEventListener("change", function () {
        let selectedMake = marcaDropdown.value;
        let selectedModel = modelloDropdown.value;
        if (!selectedMake || !selectedModel) return;

        versioneDropdown.innerHTML = '<option value="" selected>Seleziona una versione</option>';
        fetchDropdownData(`https://cdn.imagin.studio/getCarListing?customer=${customerKey}&make=${selectedMake}&modelFamily=${selectedModel}`, versioneDropdown, "modelRange");
    });

    // 🖼️ Scarica tutte le immagini nella cache locale per rotazione
    function preloadImages(make, modelFamily, modelRange) {
        for (let angle = 0; angle <= 231; angle++) {
            let img = new Image();
            img.src = `${baseUrl}?customer=${customerKey}&make=${make}&modelFamily=${modelFamily}&modelRange=${modelRange}&angle=${angle}&zoomType=${zoomTypeDropdown.value}&zoomLevel=${zoomSlider.value}&groundPlaneAdjustment=0&fileType=png&safeMode=true&countryCode=IT&billingTag=CIG&steering=lhd`;
            cachedImages[angle] = img;
        }
    }

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
            angleSlider.disabled = false;
        };
    }

    // 🎥 Cambia immagine in base allo slider di rotazione
    angleSlider.addEventListener("input", function () {
        let angle = angleSlider.value;
        let img = cachedImages[angle];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    });

    // 🎥 Sposta l'immagine verticalmente nel canvas
    verticalSlider.addEventListener("input", function () {
        let offsetY = parseInt(verticalSlider.value);
        let img = cachedImages[angleSlider.value];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, offsetY, canvas.width, canvas.height);
    });

    // 🚀 Assicura che il bottone sia collegato correttamente
    if (generaBtn) {
        generaBtn.addEventListener("click", generateImage);
    } else {
        console.error("❌ Errore: `generaBtn` non trovato nel DOM.");
    }

    // 🚀 Avvia caricamento iniziale delle marche
    loadMarche();
});
