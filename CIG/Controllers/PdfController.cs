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
                return BadRequest(ModelState);

            try
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
                            column.Item().Text($"Admin: {offer.AdminInfo?.CompanyName ?? "N/A"}");

                            if (offer.DealerInfo != null)
                                column.Item().Text($"Dealer: {offer.DealerInfo.CompanyName}");

                            if (!string.IsNullOrWhiteSpace(offer.CarMainImageUrl))
                                column.Item().Image(offer.CarMainImageUrl);
                            else
                                column.Item().Text("Immagine auto non disponibile!");
                        });
                    });
                }).GeneratePdf();

                return File(pdf, "application/pdf", "Offerta.pdf");
            }
            catch (Exception ex)
            {
                // 🔴 LOG ESPERTO ESPLICITO NEI LOG DI RAILWAY
                Console.WriteLine("🔥 ERRORE PDF GENERATION: " + ex.Message);
                Console.WriteLine(ex.StackTrace);

                // Ritorna messaggio dettagliato al frontend
                return StatusCode(500, new { message = ex.Message, detail = ex.StackTrace });
            }
        }


    }
}
