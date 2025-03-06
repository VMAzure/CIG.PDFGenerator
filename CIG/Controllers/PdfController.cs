using Microsoft.AspNetCore.Mvc;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using CIG.PDFGenerator.Models;


namespace CIG.PDFGenerator.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PdfController : ControllerBase
    {
        [HttpPost("GenerateOffer")]
        public IActionResult GenerateOffer([FromBody] OfferPdfPage1 offer)
        {
            var pdf = Document.Create(document =>
            {
                document.Page(page =>
                {
                    page.Margin(30);
                    page.Size(PageSizes.A4);

                    page.Content().Column(column =>
                    {
                        var cliente = $"{offer.CustomerFirstName} {offer.CustomerLastName}".Trim();
                        if (string.IsNullOrWhiteSpace(cliente))
                            cliente = offer.CustomerCompanyName;

                        column.Item().Text($"Cliente: {cliente}");

                        column.Item().Text($"{offer.Auto.Marca} {offer.Auto.Modello} {offer.Auto.Versione} {offer.Auto.Variante}");

                        column.Item().Text("Servizi selezionati:");
                        foreach (var servizio in offer.Servizi)
                        {
                            column.Item().Text($"{servizio.Id} - Opzione: {servizio.Opzione}");
                        }

                        column.Item().Text("Dati economici:");
                        column.Item().Text($"Durata: {offer.DatiEconomici.Durata} mesi");
                        column.Item().Text($"Km totali: {offer.DatiEconomici.KmTotali}");
                        column.Item().Text($"Anticipo: € {offer.DatiEconomici.Anticipo}");
                        column.Item().Text($"Canone mensile: € {offer.DatiEconomici.Canone}");
                    });
                });
            }).GeneratePdf();

            return File(pdf, "application/pdf", "Offerta.pdf");
        }

    }
}
