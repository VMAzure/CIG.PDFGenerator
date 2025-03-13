import { supabase } from './supabaseClient.js';

export async function salvaPreventivoSuDB(clienteId, fileUrl, creatoDa) {
    const { data, error } = await supabase.from('nlt_preventivi').insert([
        {
            cliente_id: clienteId,
            file_url: fileUrl,
            creato_da: creatoDa
        }
    ]).select(); // 👈 aggiunto ".select()" per ottenere dati di ritorno

    if (error) {
        console.error('Errore nel salvataggio del preventivo:', error);
        return false;
    }

    if (data && data.length > 0) {
        return data; // successo con dati restituiti
    } else {
        console.warn('Salvataggio effettuato ma senza dati restituiti:', data);
        return true; // comunque avvenuto con successo, ma senza dati restituiti
    }
}
