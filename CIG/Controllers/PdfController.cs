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
            if (!ModelState.IsValid)
            {
                // 🔴 aggiungi subito questo log per capire l'errore
                return BadRequest(ModelState);
            }

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
                        column.Item().Text($"Admin: {offer.AdminInfo.CompanyName}");

                        if (offer.DealerInfo != null)
                        {
                            column.Item().Text($"Dealer: {offer.DealerInfo.CompanyName}");
                        }

                        column.Item().Image(offer.CarMainImageUrl);
                    });
                });
            }).GeneratePdf();

            return File(pdf, "application/pdf", "Offerta.pdf");
        }
    }
}
