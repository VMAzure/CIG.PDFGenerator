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
                byte[] carImageBytes = null;
                if (!string.IsNullOrWhiteSpace(offer.CarMainImageUrl))
                {
                    using var client = new HttpClient();
                    try
                    {
                        carImageBytes = await client.GetByteArrayAsync(offer.CarMainImageUrl);
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
                        page.Size(PageSizes.A4.Landscape());
                        page.Margin(0);

                        // Sfondo
                        var imagePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "offer_pag_1.jpg");
                        page.Background().Image(imagePath).FitArea();

                        page.DefaultTextStyle(x => x.FontFamily("Montserrat"));

                        // Un solo Content() per pagina!
                        page.Content().Padding(30).Column(column =>
                        {
                            column.Spacing(10);

                            // Prima riga: Logo + "&" + Cliente
                            column.Item().Row(row =>
                            {
                                var logoUrl = offer.DealerInfo?.LogoUrl ?? offer.AdminInfo.LogoUrl;
                                byte[] logoBytes = null;

                                if (!string.IsNullOrEmpty(logoUrl))
                                {
                                    using var client = new HttpClient();
                                    try { logoBytes = client.GetByteArrayAsync(logoUrl).Result; } catch { }
                                }

                                if (logoBytes != null)
                                    row.ConstantItem(200).Image(logoBytes).FitWidth();

                                row.AutoItem().AlignMiddle().PaddingHorizontal(10)
                                .Text("&").FontSize(30).Bold().FontColor("#00213b");


                                var cliente = !string.IsNullOrWhiteSpace(offer.CustomerCompanyName)
                                              ? offer.CustomerCompanyName
                                              : $"{offer.CustomerFirstName} {offer.CustomerLastName}".Trim();

                                row.RelativeItem().AlignMiddle().Text(cliente)
                                    .FontSize(34).Bold().FontColor("#00213b");
                            });

                            // Seconda riga: Immagine auto a destra
                            if (carImageBytes != null)
                            {
                                column.Item()
                                    .PaddingTop(-50) // sposta in alto (aumenta per più vicinanza)
                                    .PaddingLeft(140) // sposta a destra (aumenta o diminuisci per posizione)
                                    .AlignLeft()
                                    .Height(400)
                                    .Image(carImageBytes).FitHeight();
                            }

                            // Spazio verticale
                            column.Item().PaddingVertical(-30);

                            // Terza riga: Titolo offerta economica
                            column.Item().AlignLeft().Text("Offerta economica")
                                .FontSize(28).FontColor("#FFFFFF");

                            // Quarta riga: "NOLEGGIO LUNGOTERMINE" formattato
                            column.Item().AlignLeft().Text(text =>
                            {
                                text.Span("NOLEGGIO ").FontSize(36).FontColor("#FFFFFF");
                                text.Span("LUNGO").FontSize(36).FontColor("#FFFFFF").Bold();
                                text.Span("TERMINE").FontSize(36).FontColor("#FF7100").Bold();

                            });

                            // Doppio spazio
                            column.Item().PaddingVertical(0);

                            // Quinta riga: Nome Admin o Dealer (14px bianco)
                            var aziendaNome = offer.DealerInfo?.CompanyName ?? offer.AdminInfo.CompanyName;
                            column.Item().AlignLeft().Text(aziendaNome)
                                .FontSize(14).FontColor("#FFFFFF");

                            // Sesta riga: Email Admin o Dealer (12px bianco)
                            var specialistaEmail = offer.DealerInfo?.Email ?? offer.AdminInfo.Email;
                            column.Item().AlignLeft().Text(specialistaEmail)
                                .FontSize(12).FontColor("#FFFFFF");
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
