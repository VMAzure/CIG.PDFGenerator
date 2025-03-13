import { supabase } from './supabaseClient.js';

export async function salvaPreventivoSuDB(clienteId, fileUrl, creatoDa) {
    const { data, error } = await supabase
        .from('nlt_preventivi')
        .insert([
            {
                cliente_id: clienteId,
                file_url: fileUrl,
                creato_da: creatoDa
            }
        ]);

    if (error) {
        console.error('Errore nel salvataggio del preventivo:', error);
        return false;
    }

    return data;
}
