namespace CIG.PDFGenerator.Models
{
    public class OfferPdfPage1
    {
        // Cliente finale
        public string CustomerFirstName { get; set; } // Null se società
        public string CustomerLastName { get; set; }  // Null se società
        public string CustomerCompanyName { get; set; } // Null se privato o professionista

        // Icona cliente (selezionata dalla gallery)
        public string CustomerIcon { get; set; }

        // Immagini auto
        public string CarMainImageUrl { get; set; }
        public string CarThumbnailUrl { get; set; }

        // Dati Admin (sempre presenti)
        public AdminDealerData AdminInfo { get; set; }

        // Dati Dealer (se diverso dall'Admin, altrimenti null)
        public AdminDealerData DealerInfo { get; set; } // può essere null
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
