import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { salvaPreventivoSuDB } from './savePreventivo.js';

let adminInfo = null;
let dealerInfo = null;

let marcaDropdown, modelloDropdown, versioneDropdown, varianteDropdown, anteprimaAuto, loader, imagePlaceholder, carMainImageUrl, descrizioneVersione, noteAuto;
let carImagesUrls = [];
let customerInput, customerResults, selectedCustomer = {};
let currentStep = 1, totalSteps = 5; // 👈 necessario
let backBtn, nextStepBtn, generatePdfBtn; // 👈 necessario



const supabaseUrl = 'https://vqfloobaovtdtcuflqeu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxZmxvb2Jhb3Z0ZHRjdWZscWV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTUzOTUzMCwiZXhwIjoyMDU1MTE1NTMwfQ.Lq-uIgXYZiBJK4ChfF_D7i5qYBDuxMfL2jY5GGKDuVk';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
});



document.addEventListener("DOMContentLoaded", async () => {
    marcaDropdown = document.getElementById("marca");
    modelloDropdown = document.getElementById("modello");
    versioneDropdown = document.getElementById("versione");
    varianteDropdown = document.getElementById("variante");
    anteprimaAuto = document.getElementById("anteprimaAuto");
    loader = document.getElementById("loader");
    imagePlaceholder = document.getElementById("imagePlaceholder");
    descrizioneVersione = document.getElementById('descrizioneVersione');
    noteAuto = document.getElementById('noteAuto');
    customerInput = document.getElementById('customerInput');
    customerResults = document.getElementById('customerResults');

    adminInfo = await fetchAdminInfo();
    dealerInfo = await fetchDealerInfo();


    fetchDropdown(`https://cdn.imagin.studio/getCarListing?customer=it-azureautomotive`, marcaDropdown, "make");

    marcaDropdown.addEventListener("change", () => {
        modelloDropdown.innerHTML = '';
        versioneDropdown.innerHTML = '';
        varianteDropdown.innerHTML = '';
        anteprimaAuto.src = '';

        if (marcaDropdown.value) {
            fetchDropdown(`https://cdn.imagin.studio/getCarListing?customer=it-azureautomotive&make=${marcaDropdown.value}`, modelloDropdown, "modelFamily");
        }
    });

    modelloDropdown.addEventListener("change", () => {
        versioneDropdown.innerHTML = '';
        varianteDropdown.innerHTML = '';

        if (modelloDropdown.value) {
            fetchDropdown(`https://cdn.imagin.studio/getCarListing?customer=it-azureautomotive&make=${marcaDropdown.value}&modelFamily=${modelloDropdown.value}`, versioneDropdown, "modelRange");
        }

        updateCarPreview(); // 👈 aggiorna subito dopo "modello"
    });

    versioneDropdown.addEventListener("change", () => {
        varianteDropdown.innerHTML = '';

        if (versioneDropdown.value) {
            fetchDropdown(`https://cdn.imagin.studio/getCarListing?customer=it-azureautomotive&make=${marcaDropdown.value}&modelFamily=${modelloDropdown.value}&modelRange=${versioneDropdown.value}`, varianteDropdown, "modelVariant");
        }

        updateCarPreview(); // 👈 aggiorna subito dopo "versione"
    });

    varianteDropdown.addEventListener("change", () => {
        updateCarPreview(); // 👈 aggiorna subito dopo "variante"
    });


   

    // INIZIALIZZA backBtn e bottoni step
    backBtn = document.getElementById('backBtn');
    nextStepBtn = document.getElementById('nextStepBtn');
    generatePdfBtn = document.getElementById('generatePdfBtn');

    nextStepBtn.addEventListener('click', () => {
        if (currentStep < totalSteps) {
            document.getElementById(`step${currentStep}`).style.display = 'none';
            currentStep++;
            document.getElementById(`step${currentStep}`).style.display = 'block';

            // Nascondi bottone 'Avanti' al raggiungimento ultimo step
            nextStepBtn.style.display = (currentStep === totalSteps) ? 'none' : 'inline-block';
            nextStepBtn.textContent = currentStep < totalSteps ? `Step ${currentStep + 1} →` : '';

            backBtn.style.display = currentStep > 1 ? 'inline-block' : 'none';

            if (currentStep === totalSteps) {
                generatePdfBtn.style.display = 'inline-block';
                populateSummary();
            } else {
                generatePdfBtn.style.display = 'none';
            }

            if (currentStep === 2) loadCustomersTable();
            if (currentStep === 3) loadServicesList();
        }
    });

    backBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            // Nascondo step corrente
            document.getElementById(`step${currentStep}`).style.display = 'none';
            currentStep--;

            // Mostro step precedente
            document.getElementById(`step${currentStep}`).style.display = 'block';

            // Riporto visibilità bottoni allo stato corretto
            nextStepBtn.style.display = 'inline-block';
            nextStepBtn.textContent = `Step ${currentStep + 1} →`;
            generatePdfBtn.style.display = 'none';

            // Mostro il backBtn solo se non sono allo step 1
            backBtn.style.display = currentStep > 1 ? 'inline-block' : 'none';
        }
    });


    // Impostazione iniziale dei bottoni (da mettere nel DOMContentLoaded)
    document.addEventListener('DOMContentLoaded', () => {
        currentStep = 1; // 👈 assicurati che questa riga ci sia!
        backBtn.style.display = 'none';
        generatePdfBtn.style.display = 'none';
        nextStepBtn.textContent = 'Step 2 →';
    });

    backBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            document.getElementById(`step${currentStep}`).style.display = 'none';
            currentStep--;
            document.getElementById(`step${currentStep}`).style.display = 'block';
            nextStepBtn.textContent = `Step ${currentStep + 1} →`;
            backBtn.style.display = currentStep > 1 ? 'inline-block' : 'none';
            generatePdfBtn.style.display = 'none';
        }
    });

}); // chiusura DOMContentLoaded






customerInput = document.getElementById('customerInput');
customerResults = document.getElementById('customerResults');
selectedCustomer = {};

customerInput.addEventListener('input', function () {
    const query = customerInput.value.trim();

    if (query.length < 3) {
        customerResults.style.display = 'none';
        customerResults.innerHTML = '';
        return;
    }

    const token = new URLSearchParams(window.location.search).get('token');

    fetch('https://coreapi-production-ca29.up.railway.app/customers/clienti', {
        headers: {
            "Authorization": "Bearer " + token
        }
    })
        .then(res => res.json())
        .then(clienti => {
            customerResults.innerHTML = '';

            const filteredCustomers = clienti.filter(cliente =>
                (cliente.nome && cliente.nome.toLowerCase().includes(query.toLowerCase())) ||
                (cliente.cognome && cliente.cognome.toLowerCase().includes(query.toLowerCase())) ||
                (cliente.ragione_sociale && cliente.ragione_sociale.toLowerCase().includes(query.toLowerCase())) ||
                (cliente.email && cliente.email.toLowerCase().includes(query.toLowerCase())) ||
                (cliente.telefono && cliente.telefono.includes(query))
            );

            if (filteredCustomers.length === 0) {
                customerResults.innerHTML = '<li>Nessun risultato trovato</li>';
            } else {
                filteredCustomers.forEach(cliente => {
                    const li = document.createElement('li');
                    const nomeCompleto = [cliente.nome, cliente.cognome].filter(Boolean).join(' ') || cliente.ragione_sociale;

                    li.textContent = `${nomeCompleto} (${cliente.email})`;

                    li.addEventListener('click', function () {
                        customerInput.value = nomeCompleto;
                        customerResults.style.display = 'none';
                        selectedCustomer = cliente;
                        document.getElementById('nextStepBtn').style.display = 'inline-block';
                    });

                    customerResults.appendChild(li);
                });
            }

            customerResults.style.display = 'block';
        })
        .catch(error => {
            console.error('Errore:', error);
            customerResults.innerHTML = '<li>Errore durante la ricerca.</li>';
            customerResults.style.display = 'block';
        });
});

// Recupera informazioni Admin/Dealer
async function fetchAdminInfo() {
    const token = new URLSearchParams(window.location.search).get('token');
    try {
        const res = await fetch('https://coreapi-production-ca29.up.railway.app/users/me', {
            headers: { "Authorization": "Bearer " + token }
        });

        if (!res.ok) throw new Error('Errore caricamento dati Admin');

        const userData = await res.json();

        // Verifica se è dealer o admin
        const adminSource = userData.admin_info || userData;

        return {
            Id: adminSource.id,
            Email: adminSource.email,
            FirstName: adminSource.nome,
            LastName: adminSource.cognome,
            CompanyName: adminSource.ragione_sociale,
            VatNumber: adminSource.partita_iva,
            Address: adminSource.indirizzo,
            PostalCode: adminSource.cap,
            City: adminSource.citta,
            SDICode: adminSource.codice_sdi,
            MobilePhone: adminSource.cellulare,
            LogoUrl: adminSource.logo_url
        };
    } catch (error) {
        console.error(error);
        alert("Errore caricamento dati Admin.");
        return null;
    }
}
// Aggiunta dati Dealer, SOLO se utente è dealer
async function fetchDealerInfo() {
    const token = new URLSearchParams(window.location.search).get('token');
    try {
        const res = await fetch('https://coreapi-production-ca29.up.railway.app/users/me', {
            headers: { "Authorization": "Bearer " + token }
        });

        if (!res.ok) throw new Error('Errore caricamento dati Dealer');

        const userData = await res.json();

        if (userData.role === 'dealer' && userData.dealer_info) {
            return {
                Id: userData.dealer_info.id,
                Email: userData.dealer_info.email,
                FirstName: userData.dealer_info.nome,
                LastName: userData.dealer_info.cognome,
                CompanyName: userData.dealer_info.ragione_sociale,
                VatNumber: userData.dealer_info.partita_iva,
                Address: userData.dealer_info.indirizzo,
                PostalCode: userData.dealer_info.cap,
                City: userData.dealer_info.citta,
                SDICode: userData.dealer_info.codice_sdi,
                MobilePhone: userData.dealer_info.cellulare,
                LogoUrl: userData.dealer_info.logo_url
            };
        }

        // se non è un dealer, restituisci null
        return null;

    } catch (error) {
        console.error(error);
        alert("Errore caricamento dati Dealer.");
        return null;
    }
}



// Popola dropdown da API
async function fetchDropdown(url, dropdown, keyName) {
    dropdown.disabled = true;
    dropdown.innerHTML = `<option>Caricamento...</option>`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        let items = [];

        if (data[keyName]) {
            items = data[keyName];
        } else if (data.preselect && data.preselect.options && data.preselect.options[keyName]) {
            items = data.preselect.options[keyName];
        }

        if (!items || items.length === 0) {
            // Gestione dropdown opzionale
            console.warn(`⚠️ Nessun dato per "${keyName}"`);
            dropdown.innerHTML = `<option value="">Nessuna opzione disponibile</option>`;
            dropdown.disabled = true;

            // Procedi con il prossimo step/script qui (se necessario)
            return;
        }

        dropdown.innerHTML = `<option value="">Seleziona ${keyName}</option>`;
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item.toUpperCase();
            dropdown.appendChild(option);
        });

        dropdown.disabled = false;

    } catch (error) {
        console.error('Errore caricamento:', error);
        dropdown.innerHTML = `<option value="">Errore caricamento dati</option>`;
        dropdown.disabled = true;
    }
}







//TABELLA CLIENTI
async function loadCustomersTable() {
    const token = new URLSearchParams(window.location.search).get('token');
    const customerTableBody = document.getElementById('customerTableBody');

    customerTableBody.innerHTML = '<tr><td colspan="4">Caricamento clienti...</td></tr>';

    try {
        const response = await fetch('https://coreapi-production-ca29.up.railway.app/customers/clienti', {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const clienti = await response.json();

        customerTableBody.innerHTML = '';

        clienti.forEach(cliente => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                        <td>${cliente.nome || '-'}</td>
                        <td>${cliente.cognome || cliente.ragione_sociale || '-'}</td>
                        <td>${cliente.email || '-'}</td>
                        <td>${cliente.telefono || '-'}</td>
                    `;

            tr.addEventListener('click', () => {
                console.log("Cliente cliccato:", cliente); // 👈 Aggiungi questo!
                selectedCustomer = cliente;
                customerInput.value = `${cliente.nome || ''} ${cliente.cognome || cliente.ragione_sociale || ''}`.trim();
                customerResults.style.display = 'none';
                document.getElementById('nextStepBtn').style.display = 'inline-block';
            });


            customerTableBody.appendChild(tr);
        });

    } catch (error) {
        console.error('Errore nel caricamento clienti:', error);
        customerTableBody.innerHTML = '<tr><td colspan="4">Errore nel caricamento clienti.</td></tr>';
    }
}

//TABELLA SERVIZI

async function loadServicesList() {
    const token = new URLSearchParams(window.location.search).get('token');
    const servicesList = document.getElementById('servicesList');

    servicesList.innerHTML = 'Caricamento servizi...';

    try {
        const response = await fetch('https://coreapi-production-ca29.up.railway.app/nlt/services', {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!response.ok) throw new Error(`Errore HTTP: ${response.status}`);

        const data = await response.json();

        servicesList.innerHTML = '';

        data.services.forEach(service => {
            const div = document.createElement('div');
            div.classList.add('service-item');

            const options = service.conditions?.options || [];

            let optionsHtml = options.map((option, index) =>
                `<label>
                            <input type="radio" name="option_${service.id}" value="${option}" ${index === 0 ? 'checked' : ''}>
                            ${option}
                        </label>`
            ).join('');


            div.innerHTML = `
                        <strong>${service.name}</strong><br>
                        <span>${service.description || 'Nessuna descrizione disponibile'}</span>
                        <div>${optionsHtml}</div>
                    `;

            servicesList.appendChild(div);
        });

    } catch (error) {
        console.error('Errore caricamento servizi:', error);
        servicesList.innerHTML = 'Errore nel caricamento dei servizi.';
    }
}

//RIEPILOGO

function populateSummary() {
    console.log("Cliente nello step finale:", selectedCustomer); // 👈 AGGIUNGI QUESTO

    const riepilogoOfferta = document.getElementById('riepilogoOfferta');

    const selectedServices = Array.from(document.querySelectorAll('.service-item')).map(serviceItem => {
        const name = serviceItem.querySelector('strong').textContent;
        const option = serviceItem.querySelector('input[type="radio"]:checked')?.value || 'Nessuna';
        return { name, option };
    });

    riepilogoOfferta.innerHTML = `
            <table class="table summary-table">
                <tr><th colspan="2">Dati Auto</th></tr>
                <tr><td>Marca:</td><td>${marcaDropdown.value || '-'}</td></tr>
                <tr><td>Modello:</td><td>${modelloDropdown.value || '-'}</td></tr>
                <tr><td>Versione:</td><td>${versioneDropdown.value || '-'}</td></tr>
                <tr><td>Variante:</td><td>${varianteDropdown.value || '-'}</td></tr>
                <tr><td>Descrizione versione:</td><td>${descrizioneVersione.value || '-'}</td></tr>
                <tr><td>Note:</td><td>${noteAuto.value || '-'}</td></tr>

                <tr><th colspan="2">Dati Cliente</th></tr>
                <tr><td>Nome:</td><td>${selectedCustomer.nome || '-'}</td></tr>
                <tr><td>Cognome / Ragione Sociale:</td><td>${selectedCustomer.cognome || selectedCustomer.ragione_sociale || '-'}</td></tr>
                <tr><td>Email:</td><td>${selectedCustomer.email || '-'}</td></tr>
                <tr><td>Telefono:</td><td>${selectedCustomer.telefono || '-'}</td></tr>

                <tr><th colspan="2">Dati Economici</th></tr>
                <tr><td>Durata (mesi):</td><td>${document.getElementById('durataMesi').value || '-'}</td></tr>
                <tr><td>Km totali:</td><td>${document.getElementById('kmTotali').value || '-'}</td></tr>
                <tr><td>Anticipo (€):</td><td>${document.getElementById('anticipo').value || '-'}</td></tr>
                <tr><td>Canone Mensile (€):</td><td>${document.getElementById('canone').value || '-'}</td></tr>

                <tr><th colspan="2">Servizi Selezionati</th></tr>
                ${selectedServices.map(service => `
                    <tr><td>${service.name}</td><td>${service.option}</td></tr>
                `).join('')}
            </table>
            `;
}


// QUI GENERO IL PDF
document.addEventListener('click', async function (event) {
    if (event.target && event.target.id === 'generatePdfBtn') {

        const pdfLoader = document.getElementById('pdfLoader');
        const generatePdfBtn = document.getElementById('generatePdfBtn');

        pdfLoader.style.display = 'block';
        generatePdfBtn.style.display = 'none';

        const token = new URLSearchParams(window.location.search).get("token");

        console.log({
            selectedCustomer,
            carMainImageUrl,
            adminInfo,
            carImagesUrls
        });


        if (!selectedCustomer || !carMainImageUrl || !adminInfo || !carImagesUrls.length) {
            alert("Alcuni dati obbligatori mancano.");
            pdfLoader.style.display = 'none';
            generatePdfBtn.style.display = 'inline-block';
            return;
        }

        const tipoCliente = selectedCustomer.tipo_cliente || "privato";

        const payload = {
            CustomerFirstName: selectedCustomer.nome || "",
            CustomerLastName: selectedCustomer.cognome || "",
            CustomerCompanyName: selectedCustomer.ragione_sociale || "",
            CustomerIcon: selectedCustomer.icon || "default.png",
            TipoCliente: tipoCliente,
            DocumentiNecessari: [],
            CarImages: carImagesUrls,
            CarMainImageUrl: carMainImageUrl,
            Auto: {
                Marca: marcaDropdown.value || "",
                Modello: modelloDropdown.value || "",
                Versione: versioneDropdown.value || "",
                Variante: varianteDropdown.value || "",
                DescrizioneVersione: descrizioneVersione.value || "",
                Note: noteAuto.value || ""
            },
            Servizi: Array.from(document.querySelectorAll('.service-item')).map(serviceItem => ({
                Nome: serviceItem.querySelector('strong').textContent,
                Opzione: serviceItem.querySelector('input[type="radio"]:checked')?.value || "Nessuna"
            })),
            DatiEconomici: {
                Durata: parseInt(document.getElementById('durataMesi').value) || 0,
                KmTotali: parseInt(document.getElementById('kmTotali').value) || 0,
                Anticipo: parseFloat(document.getElementById('anticipo').value) || 0,
                Canone: parseFloat(document.getElementById('canone').value) || 0
            },
            AdminInfo: adminInfo,
            DealerInfo: dealerInfo, // aggiunto solo se presente, altrimenti sarà null
            NoteAuto: noteAuto.value || ""
        };

        try {
            const response = await fetch(`https://coreapi-production-ca29.up.railway.app/nlt/documenti-richiesti/${tipoCliente}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            const data = await response.json();

            payload.DocumentiNecessari = data.documenti || [];

            console.log("🚨 Payload finale inviato a fetchPdf:", JSON.stringify(payload, null, 2));


            fetchPdf(payload, token);

        } catch (error) {
            alert("Errore recupero documenti necessari.");
            console.error(error);
            pdfLoader.style.display = 'none';
            generatePdfBtn.style.display = 'inline-block';
        }
    }
});


console.log("Cliente selezionato:", selectedCustomer);

// Funzione per mostrare/nascondere loader
function pdfLoading(show) {
    document.getElementById('pdfLoader').style.display = show ? 'block' : 'none';
    document.getElementById('generatePdfBtn').style.display = show ? 'none' : 'inline-block';
}

// lascia inalterata la funzione fetchPdf
async function fetchPdf(payload, token) {
    document.getElementById('generatePdfBtn').style.display = 'none';
    document.getElementById('pdfLoader').style.display = 'block';

    try {
        const response = await fetch('/api/Pdf/GenerateOffer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Errore HTTP: ${response.status}`);
        }

        const blob = await response.blob();
        const fileName = getUniqueFileName();
        let risultatoSalvataggio;  // 👈 devi dichiararla prima di usarla

        const { data, error } = await supabase.storage
            .from('nlt-preventivi')
            .upload(fileName, blob, { contentType: 'application/pdf' });

        if (error) {
            console.error('Errore upload Supabase:', error);
            alert('Errore upload Supabase');
        } else {
            const supabaseFileUrl = `https://vqfloobaovtdtcuflqeu.supabase.co/storage/v1/object/private/${data.fullPath}`;
            console.log('File salvato su Supabase:', supabaseFileUrl);
            console.log('Parametri per salvaPreventivoSuDB:', {
                clienteId: selectedCustomer.id,
                fileUrl: supabaseFileUrl,
                creatoDa: adminInfo.Id
            });

            risultatoSalvataggio = await salvaPreventivoSuDB(selectedCustomer.id, supabaseFileUrl, adminInfo.Id);

            if (risultatoSalvataggio) {
                console.log('Risultato salvataggio:', risultatoSalvataggio);
            } else {
                console.error('Salvataggio fallito!');
            }

        }

        // 👇 Mantieni invariato il download automatico del file 👇
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (error) {
        alert('Errore nella generazione del PDF.');
        console.error(error);
    } finally {
        document.getElementById('pdfLoader').style.display = 'none';
        document.getElementById('generatePdfBtn').style.display = 'inline-block';
    }
}

// Funzione originale invariata
function getUniqueFileName() {
    const now = new Date();
    const dateTimeString = now.getFullYear().toString() +
        ('0' + (now.getMonth() + 1)).slice(-2) +
        ('0' + now.getDate()).slice(-2) + '_' +
        ('0' + now.getHours()).slice(-2) +
        ('0' + now.getMinutes()).slice(-2) +
        ('0' + now.getSeconds()).slice(-2);

    return `NLT_Offer_${dateTimeString}.pdf`;
}

const angles = [203, 29, 17, 9, 21, 13];
const colors = ["White", "Grey", "Red", "Yellow", "Azure"];

function getRandomColor() {
    return colors[Math.floor(Math.random() * colors.length)];
}

function updateCarPreview() {
    if (!marcaDropdown.value || !modelloDropdown.value) {
        imagePlaceholder.textContent = "Seleziona almeno marca e modello per visualizzare l'anteprima";
        imagePlaceholder.style.display = "flex";
        anteprimaAuto.src = '';
        carMainImageUrl = null;
        carImagesUrls = [];
        return;
    }

    loader.style.display = "block";
    anteprimaAuto.style.display = "none";
    imagePlaceholder.style.display = "none";

    carImagesUrls = angles.map(angle => {
        return {
            url: `https://cdn.imagin.studio/getImage?customer=it-azureautomotive&make=${marcaDropdown.value}&modelFamily=${modelloDropdown.value}${versioneDropdown.value ? `&modelRange=${versioneDropdown.value}` : ''}${varianteDropdown.value ? `&modelVariant=${varianteDropdown.value}` : ''}&angle=${angle}&paintDescription=${getRandomColor()}&zoomType=FullScreen&groundPlaneAdjustment=0&fileType=png&width=800`,
            angle: angle
        };
    });

    carMainImageUrl = carImagesUrls[0].url; // 👈 importantissimo!

    anteprimaAuto.src = carMainImageUrl;

    anteprimaAuto.onload = function () {
        loader.style.display = "none";
        anteprimaAuto.style.display = "block";
    };

    anteprimaAuto.onerror = function () {
        loader.style.display = "none";
        imagePlaceholder.textContent = "Anteprima non disponibile";
        imagePlaceholder.style.display = "flex";
        carMainImageUrl = null;
        carImagesUrls = [];
    };
}


// 👇 Esposizione globale della funzione (se necessaria)
window.fetchPdf = fetchPdf;
