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
                    }
                }

                var pdf = QuestPDF.Fluent.Document.Create(document =>
                {
                    document.Page(page =>
                    {
                        page.Margin(30);
                        page.Size(PageSizes.A4.Landscape());

                        page.DefaultTextStyle(x => x.FontFamily("Montserrat"));

                        page.Header()
                            .Row(row =>
                            {
                                // Logo Admin o Dealer
                                var logoUrl = offer.DealerInfo?.LogoUrl ?? offer.AdminInfo.LogoUrl;

                                byte[] logoBytes = null;
                                if (!string.IsNullOrEmpty(logoUrl))
                                {
                                    using var client = new HttpClient();
                                    try
                                    {
                                        logoBytes = client.GetByteArrayAsync(logoUrl).Result;
                                    }
                                    catch { }
                                }

                                if (logoBytes != null)
                                {
                                    row.ConstantItem(100).Image(logoBytes, ImageScaling.FitWidth);
                                }

                                var aziendaNome = offer.DealerInfo?.CompanyName ?? offer.AdminInfo.CompanyName;
                                var specialistaNome = $"{offer.DealerInfo?.FirstName ?? offer.AdminInfo.FirstName} {offer.DealerInfo?.LastName ?? offer.AdminInfo.LastName}";
                                var specialistaEmail = offer.DealerInfo?.Email ?? offer.AdminInfo.Email;

                                row.RelativeItem().Column(col =>
                                {
                                    col.Item().AlignRight().Text(aziendaNome)
                                        .FontSize(16).Bold().FontColor("#00213b");

                                    col.Item().AlignRight().Text("Offerta Noleggio a Lungo Termine")
                                        .FontSize(14).Bold().FontColor("#FF7100");

                                    col.Item().AlignRight().Text($"{specialistaNome} – NLT Specialist")
                                        .FontSize(10).FontColor("#00213b");

                                    col.Item().AlignRight().Text(specialistaEmail)
                                        .FontSize(10).FontColor("#00213b");
                                });
                            });

                        page.Content().Column(column =>
                        {
                            var cliente = $"{offer.CustomerFirstName} {offer.CustomerLastName}".Trim();
                            if (string.IsNullOrWhiteSpace(cliente))
                                cliente = offer.CustomerCompanyName;

                            column.Item().Text($"Cliente: {cliente}")
                                .FontSize(12).Bold();

                            // Resto del contenuto successivamente...
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
