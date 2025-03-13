import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://vqfloobaovtdtcuflqeu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxZmxvb2Jhb3Z0ZHRjdWZscWV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTUzOTUzMCwiZXhwIjoyMDU1MTE1NTMwfQ.Lq-uIgXYZiBJK4ChfF_D7i5qYBDuxMfL2jY5GGKDuVk';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
});

// lascia inalterata la funzione fetchPdf
export async function fetchPdf(payload, token) {
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

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { persistSession: false }
        });

        const { data, error } = await supabase.storage
            .from('nlt-preventivi')
            .upload(fileName, blob, { contentType: 'application/pdf' });

        if (error) {
            console.error('Errore upload Supabase:', error);
            alert('Errore upload file su Supabase.');
        } else {
            const supabaseFileUrl = `${supabaseUrl}/storage/v1/object/private/${data.fullPath}`;
            console.log('File salvato su Supabase:', supabaseFileUrl);
            // Qui puoi successivamente salvare questo URL nel DB.
        }

        // download automatico file
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
