namespace CIG.PDFGenerator.Models
{
    public class OfferPdfPage1
    {
        // Cliente finale
        public string CustomerFirstName { get; set; }
        public string CustomerLastName { get; set; }
        public string CustomerCompanyName { get; set; }

        public string CustomerIcon { get; set; }

        // Immagini auto
        public string CarMainImageUrl { get; set; }
        public string CarThumbnailUrl { get; set; }

        // Dati Admin (sempre presenti)
        public AdminDealerData AdminInfo { get; set; }

        // Dati Dealer (se diverso dall'Admin)
        public AdminDealerData? DealerInfo { get; set; }

        // 🔴 AGGIUNGI SUBITO QUESTE PROPRIETÀ
        public Auto Auto { get; set; }
        public List<Servizio> Servizi { get; set; }
        public DatiEconomici DatiEconomici { get; set; }
    }

    // 🔴 Aggiungi subito anche queste classi di supporto mancanti:
    public class Auto
    {
        public string Marca { get; set; }
        public string Modello { get; set; }
        public string Versione { get; set; }
        public string Variante { get; set; }
        public string DescrizioneVersione { get; set; } 
        public string Note { get; set; }               
    }

    public class Servizio
    {
        public string Id { get; set; }
        public string Nome { get; set; } 

        public string Opzione { get; set; }
    }

    public class DatiEconomici
    {
        public int Durata { get; set; }
        public int KmTotali { get; set; }
        public decimal Anticipo { get; set; }
        public decimal Canone { get; set; }
    }

    public class AdminDealerData
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string CompanyName { get; set; }
        public string VatNumber { get; set; }
        public string Address { get; set; }
        public string PostalCode { get; set; }
        public string City { get; set; }
        public string SDICode { get; set; }
        public string MobilePhone { get; set; }
        public string LogoUrl { get; set; }
    }
}
