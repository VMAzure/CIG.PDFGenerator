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
                        page.Size(PageSizes.A4.Landscape());
                        page.Margin(0);

                        // Immagine di sfondo
                        var imagePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "offer_pag_1.jpg");
                        page.Background().Image(imagePath).FitArea();

                        page.DefaultTextStyle(x => x.FontFamily("Montserrat"));

                        page.Content().Padding(30).Column(column =>
                        {
                            column.Spacing(10);

                            // Prima riga: Logo + "&" Cliente (Ragione sociale o Nome Cognome)
                            column.Item().Row(row =>
                            {
                                // Logo
                                var logoUrl = offer.DealerInfo?.LogoUrl ?? offer.AdminInfo.LogoUrl;
                                byte[] logoBytes = null;
                                if (!string.IsNullOrEmpty(logoUrl))
                                {
                                    using var client = new HttpClient();
                                    try { logoBytes = client.GetByteArrayAsync(logoUrl).Result; } catch { }
                                }

                                if (logoBytes != null)
                                    row.ConstantItem(250).Image(logoBytes).FitWidth();

                                // Carattere "&"
                                row.AutoItem().AlignMiddle().Text("&")
                                    .FontSize(40).Bold().FontColor("#00213b").PaddingHorizontal(10);

                                // Nome Cliente (Ragione Sociale o Nome e Cognome)
                                var cliente = !string.IsNullOrWhiteSpace(offer.CustomerCompanyName)
                                              ? offer.CustomerCompanyName
                                              : $"{offer.CustomerFirstName} {offer.CustomerLastName}".Trim();

                                row.RelativeItem().AlignMiddle().Text(cliente)
                                    .FontSize(28).Bold().FontColor("#00213b");
                            });

                            // Contenuto della pagina
                            columnSpacing(10);

                            page.Content().Padding(30).Column(column =>
                            {
                                column.Spacing(15);

                                // Seconda riga (immagine auto a destra)
                                if (!string.IsNullOrWhiteSpace(offer.CarMainImageUrl))
                                {
                                    using var client = new HttpClient();
                                    byte[] carImageBytes = null;

                                    try { carImageBytes = client.GetByteArrayAsync(offer.CarMainImageUrl).Result; } catch { }

                                    if (carImageBytes != null)
                                    {
                                        column.Item().AlignRight().Height(400).Image(carImageBytes).FitHeight();
                                    }
                                }

                                // Terza riga vuota (spazio)
                                column.Item().PaddingVertical(10);

                                // Quarta riga (testo "Offerta Noleggio Lungo Termine")
                                column.Item().AlignLeft().Text(text =>
                                {
                                    text.Span("Offerta Noleggio ").FontSize(22).Bold().FontColor("#FFFFFF");
                                    text.Span("Lungo Termine").FontSize(24).Bold().FontColor("#FFFFFF");
                                });

                                // Riga personalizzata come da richiesta
                                column.Item().AlignLeft().Text(text =>
                                {
                                    text.Span("NOLEGGIO ").FontSize(20).FontColor("#FFFFFF").FontWeight(FontWeight.Normal);
                                    text.Span("LUNGO").FontSize(20).FontColor("#FFFFFF").FontWeight(FontWeight.Bold);
                                    text.Span("TERMINE").FontSize(20).FontColor("#FF7100").FontWeight(FontWeight.Bold);
                                });

                                // Doppio spazio
                                column.Item().PaddingVertical(20);

                                // Quinta riga: Nome Admin o Dealer (14px, bianco)
                                var aziendaNome = offer.DealerInfo?.CompanyName ?? offer.AdminInfo.CompanyName;
                                column.Item().AlignLeft().Text(aziendaNome)
                                    .FontSize(14).FontColor("#FFFFFF");

                                // Sesta riga: Email Admin o Dealer (12px, bianco)
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
