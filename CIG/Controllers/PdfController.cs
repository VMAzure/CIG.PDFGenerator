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
        public async Task<IActionResult> GenerateOffer([FromBody] OfferPdfPage1 offer)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                byte[] imageBytes = null;

                if (!string.IsNullOrWhiteSpace(offer.CarMainImageUrl))
                {
                    using var client = new HttpClient();
                    try
                    {
                        imageBytes = await client.GetByteArrayAsync(offer.CarMainImageUrl);
                    }
                    catch (Exception imgEx)
                    {
                        Console.WriteLine($"Errore caricamento immagine: {imgEx.Message}");
                        // ignora immagine se non disponibile
                    }
                }

                var pdf = QuestPDF.Fluent.Document.Create(document =>
                {
                    document.Page(page =>
                    {
                        page.Margin(30);
                        page.Size(QuestPDF.Helpers.PageSizes.A4);

                        page.Content().Column(column =>
                        {
                            var cliente = $"{offer.CustomerFirstName} {offer.CustomerLastName}".Trim();
                            if (string.IsNullOrWhiteSpace(cliente))
                                cliente = offer.CustomerCompanyName;

                            column.Item().Text($"Cliente: {cliente}");
                            column.Item().Text($"Admin: {offer.AdminInfo?.CompanyName ?? "N/A"}");

                            if (offer.DealerInfo != null)
                                column.Item().Text($"Dealer: {offer.DealerInfo.CompanyName}");

                            if (imageBytes != null)
                                column.Item().Image(imageBytes);
                            else
                                column.Item().Text("⚠️ Immagine auto non disponibile o non raggiungibile.");
                        });
                    });
                }).GeneratePdf();

                return File(pdf, "application/pdf", "Offerta.pdf");
            }
            catch (Exception ex)
            {
                Console.WriteLine("🔥 ERRORE PDF GENERATION: " + ex.Message);
                Console.WriteLine(ex.StackTrace);
                return StatusCode(500, ex.Message);
            }
        }



    }
}
