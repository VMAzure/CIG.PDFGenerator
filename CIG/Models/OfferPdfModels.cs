using System.Text.Json.Serialization;

namespace CIG.PDFGenerator.Models
{
    public class OfferPdfPage1
    {
        // Cliente finale
        public string? CustomerFirstName { get; set; }
        public string? CustomerLastName { get; set; }
        public string? CustomerCompanyName { get; set; }
        public string? CustomerIcon { get; set; }
        public string? TipoCliente { get; set; }
        public List<string> DocumentiNecessari { get; set; } = new();


        // Immagini auto
        public string? CarMainImageUrl { get; set; }
        public string? CarThumbnailUrl { get; set; }

        // Dati Admin (sempre presenti)
        public AdminDealerData AdminInfo { get; set; }

        // Dati Dealer (se diverso dall'Admin)
        public AdminDealerData? DealerInfo { get; set; }

        // Proprietà aggiornate correttamente
        public Auto Auto { get; set; }
        public List<Servizio> Servizi { get; set; }
        public DatiEconomici DatiEconomici { get; set; }

        // NUOVA PROPRIETÀ PER LE IMMAGINI AUTO
        public List<CarImageDetail> CarImages { get; set; } = new();
    }

    // Classe supporto immagini auto
    public class CarImageDetail
    {
        public string Url { get; set; }
        public string Color { get; set; }
        public int Angle { get; set; }
    }

    // Classe supporto auto
    public class Auto
    {
        public string? Marca { get; set; }
        public string? Modello { get; set; }
        public string? Versione { get; set; }
        public string? Variante { get; set; }
        public string? DescrizioneVersione { get; set; }
        public string? Note { get; set; }
    }

    // Classe supporto servizi
    public class Servizio
    {
        public string? Id { get; set; }
        public string? Nome { get; set; }
        public string? Opzione { get; set; }
    }

    // Classe supporto dati economici
    public class DatiEconomici
    {
        public int Durata { get; set; }
        public int KmTotali { get; set; }
        public decimal Anticipo { get; set; }
        public decimal Canone { get; set; }
    }
public class AdminDealerData
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("email")]
        public string? Email { get; set; }

        [JsonPropertyName("nome")]
        public string? FirstName { get; set; }

        [JsonPropertyName("cognome")]
        public string? LastName { get; set; }

        [JsonPropertyName("ragione_sociale")]
        public string? CompanyName { get; set; }

        [JsonPropertyName("partita_iva")]
        public string? VatNumber { get; set; }

        [JsonPropertyName("indirizzo")]
        public string? Address { get; set; }

        [JsonPropertyName("cap")]
        public string? PostalCode { get; set; }

        [JsonPropertyName("citta")]
        public string? City { get; set; }

        [JsonPropertyName("codice_sdi")]
        public string? SDICode { get; set; }

        [JsonPropertyName("cellulare")]
        public string? MobilePhone { get; set; }

        [JsonPropertyName("logo_url")]
        public string? LogoUrl { get; set; }
    }

}




