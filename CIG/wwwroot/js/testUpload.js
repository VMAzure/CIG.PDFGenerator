import { supabase } from './supabaseClient.js';

async function testUploadPdf() {
    const fileContent = new Blob(["Test upload Supabase"], { type: "application/pdf" });
    const fileName = "test_upload.pdf";

    const { data, error } = await supabase
        .storage
        .from('nlt-preventivi')
        .upload(fileName, fileContent);

    if (error) {
        console.error("Errore upload file:", error);
    } else {
        console.log("Upload riuscito. Risposta:", data);
    }
}

testUploadPdf();
