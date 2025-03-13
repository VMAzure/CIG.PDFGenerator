import { supabase } from './supabaseClient.js';

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

        // Upload su Supabase
        const { data, error } = await supabase.storage
            .from('nlt-preventivi')
            .upload(fileName, blob, { contentType: 'application/pdf' });

        if (error) {
            console.error('Errore upload Supabase:', error);
            alert('Errore durante il salvataggio del file su Supabase.');
        } else {
            const supabaseFileUrl = `https://vqfloobaovtdtcuflqeu.supabase.co/storage/v1/object/private/${data.fullPath}`;
            console.log('File salvato su Supabase:', supabaseFileUrl);

            // (Successivamente, qui potrai salvare questo URL nella tabella `nlt_preventivi`)
        }

        // 👇 Manteniamo invariato il download automatico del file 👇
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

// La funzione getUniqueFileName() resta invariata
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
