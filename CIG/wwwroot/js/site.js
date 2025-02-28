document.addEventListener("DOMContentLoaded", function () {
    const customerKey = "it-azureautomotive"; // 🔴 Inserisci la tua chiave API
    const baseUrl = "https://cdn.imagin.studio/getImage";

    // Elementi della UI
    const marcaDropdown = document.getElementById("marca");
    const modelloDropdown = document.getElementById("modello");
    const versioneDropdown = document.getElementById("versione");
    const coloreDropdown = document.getElementById("colore");
    const zoomTypeDropdown = document.getElementById("zoomType");

    const angleSlider = document.getElementById("angle");
    const zoomSlider = document.getElementById("zoomLevel");
    const groundSlider = document.getElementById("groundPlane");

    const angleValue = document.getElementById("angleValue");
    const zoomValue = document.getElementById("zoomValue");
    const groundValue = document.getElementById("groundValue");

    const generaBtn = document.getElementById("genera");
    const canvas = document.getElementById("imageCanvas");
    const ctx = canvas.getContext("2d");

    // 🔄 Funzione per popolare dropdown
    function fetchDropdownData(endpoint, dropdown, keyName, callback) {
        console.log("🔍 Chiamata API a:", endpoint); // Debug dell'endpoint usato

        fetch(endpoint)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Errore API: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("✅ JSON ricevuto:", data); // Debug JSON ricevuto

                // 🔹 Controlla se esiste "preselect.options" per estrarre i dati
                if (!data.preselect || !data.preselect.options || !data.preselect.options[keyName]) {
                    throw new Error(`❌ La chiave '${keyName}' non esiste nei dati ricevuti.`);
                }

                const optionsList = data.preselect.options[keyName];

                dropdown.innerHTML = ""; // Pulisce il dropdown
                optionsList.forEach(item => {
                    let option = document.createElement("option");
                    option.value = item;
                    option.textContent = item.toUpperCase();
                    dropdown.appendChild(option);
                });

                if (callback) callback(); // Esegui callback per il dropdown successivo
            })
            .catch(error => console.error("❌ Errore nel caricamento dei dati:", error));
    }




    // 📥 Popola dropdown dinamici
    function loadDropdowns() {

        // ✅ Corretto endpoint per ottenere le marche
        fetchDropdownData(`https://cdn.imagin.studio/getCarListing?customer=${customerKey}`, marcaDropdown, "make", () => {
            // ✅ Corretto endpoint per ottenere i modelli di una marca specifica
            fetchDropdownData(`https://cdn.imagin.studio/getCarListing?customer=${customerKey}&make=${marcaDropdown.value}`, modelloDropdown, "modelFamily", () => {
                // ✅ Corretto endpoint per ottenere le versioni di un modello
                fetchDropdownData(`https://cdn.imagin.studio/getCarListing?customer=${customerKey}&make=${marcaDropdown.value}&modelFamily=${modelloDropdown.value}`, versioneDropdown, "modelRange");
            });
        });

        // ✅ Corretto endpoint per ottenere i colori disponibili
        fetchDropdownData(`https://cdn.imagin.studio/getPaints?customer=${customerKey}&target=make&make=${marcaDropdown.value}`, coloreDropdown, "paintId");
    }

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
        const imageUrl = `${baseUrl}?customer=${customerKey}&make=${make}&modelFamily=${modelFamily}&modelRange=${modelRange}&paintId=${paintId}&angle=${angle}&zoomType=${zoomType}&zoomLevel=${zoomLevel}&groundPlaneAdjustment=${groundPlaneAdjustment}&fileType=png&safeMode=true&countryCode=IT&billingTag=CIG&steering=lhd`;

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
    loadDropdowns();
    generaBtn.addEventListener("click", generateImage);
});
