export async function salvaPreventivoSuAPI(file, clienteId, creatoDa, marca, modello, durata, kmTotali, anticipo, canone) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("cliente_id", clienteId);
    formData.append("creato_da", creatoDa);
    formData.append("marca", marca);
    formData.append("modello", modello);
    formData.append("durata", durata);
    formData.append("km_totali", kmTotali);
    formData.append("anticipo", anticipo);
    formData.append("canone", canone);

    try {
        const response = await fetch("https://coreapi-production-ca29.up.railway.app/nlt/salva-preventivo", {
            method: "POST",
            body: formData
        });

        const result = await response.json();
        if (!response.ok) {
            console.error("Errore nell'invio del preventivo:", result.error);
            return false;
        }

        console.log("✅ Preventivo salvato correttamente su API:", result);
        return result;
    } catch (error) {
        console.error("Errore nella richiesta all'API:", error);
        return false;
    }
}
