using Microsoft.AspNetCore.Mvc;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using CIG.PDFGenerator.Models;
using Microsoft.AspNetCore.Http;
using QuestPDF;
using QuestPDF.Previewer;
using QuestPDF.Drawing;
using System.IO;

namespace CIG.PDFGenerator.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PdfController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;

        // Costruttore aggiornato
        public PdfController(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        [HttpPost("GenerateOffer")]
        public async Task<IActionResult> GenerateOffer([FromBody] OfferPdfPage1 offer)
        {
            Console.WriteLine("CarImages ricevute: " + (offer.CarImages?.Count ?? 0));

            if (offer.CarImages != null)
            {
                foreach (var img in offer.CarImages)
                {
                    Console.WriteLine($"URL: {img.Url} - Colore: {img.Color} - Angolo: {img.Angle}");
                }
            }

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                byte[] carImageBytes = null;
                using var client = new HttpClient();

                if (!string.IsNullOrWhiteSpace(offer.CarMainImageUrl))
                {
                    try
                    {
                        carImageBytes = await client.GetByteArrayAsync(offer.CarMainImageUrl);
                    }
                    catch (Exception imgEx)
                    {
                        Console.WriteLine($"Errore caricamento immagine principale: {imgEx.Message}");
                    }
                }

                // Scarica PRIMA tutte le immagini aggiuntive
                List<(byte[] bytes, string color, int angle)> carImagesDetails = new();

                if (offer.CarImages != null)
                {
                    foreach (var img in offer.CarImages)
                    {
                        try
                        {
                            var bytes = await client.GetByteArrayAsync(img.Url);
                            carImagesDetails.Add((bytes, img.Color, img.Angle));
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Errore caricamento immagine auto: {ex.Message}");
                        }
                    }
                }

                // Registrazione font
                var regularFontPath = Path.Combine(_environment.WebRootPath, "fonts", "Montserrat-Regular.ttf");
                var boldFontPath = Path.Combine(_environment.WebRootPath, "fonts", "Montserrat-Bold.ttf");

                using var regularFontStream = System.IO.File.OpenRead(regularFontPath);
                FontManager.RegisterFont(regularFontStream);

                using var boldFontStream = System.IO.File.OpenRead(boldFontPath);
                FontManager.RegisterFont(boldFontStream);

                // Ora crei UNA SOLA VOLTA il documento PDF
                var pdf = QuestPDF.Fluent.Document.Create(document =>
                {
                    // PAGINA 1
                    document.Page(page =>
                    {
                        page.Size(PageSizes.A4.Landscape());
                        page.Margin(0);

                        var imagePathPag1 = Path.Combine(_environment.WebRootPath, "images", "offer_pag_1.jpg");
                        page.Background().Image(imagePathPag1).FitArea();
                        page.DefaultTextStyle(x => x.FontFamily("Montserrat"));

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
                                    using var logoClient = new HttpClient();
                                    try { logoBytes = logoClient.GetByteArrayAsync(logoUrl).Result; } catch { }
                                }

                                if (logoBytes != null)
                                    row.ConstantItem(200).Image(logoBytes).FitWidth();

                                row.AutoItem().AlignMiddle().PaddingHorizontal(10)
                                    .Text("&").FontSize(30).FontColor("#00213b");

                                var cliente = !string.IsNullOrWhiteSpace(offer.CustomerCompanyName)
                                    ? offer.CustomerCompanyName.ToUpper()
                                    : $"{offer.CustomerFirstName} {offer.CustomerLastName}".Trim().ToUpper();

                                row.RelativeItem().AlignMiddle().Text(cliente)
                                    .FontSize(34).FontColor("#00213b");
                            });

                            if (carImageBytes != null)
                            {
                                column.Item()
                                    .PaddingTop(-50)
                                    .PaddingLeft(140)
                                    .AlignLeft()
                                    .Height(400)
                                    .Image(carImageBytes).FitHeight();
                            }

                            column.Item().PaddingVertical(-40);

                            column.Item().AlignLeft().Text("Offerta economica")
                                .FontSize(28).FontColor("#FFFFFF");

                            column.Item().AlignLeft().Text(text =>
                            {
                                text.Span("NOLEGGIO ").FontSize(36).FontColor("#FFFFFF");
                                text.Span("LUNGO").FontSize(36).FontColor("#FFFFFF").Bold();
                                text.Span("TERMINE").FontSize(36).FontColor("#FF7100").Bold();
                            });

                            column.Item().PaddingVertical(2);

                            var aziendaNome = offer.DealerInfo?.CompanyName ?? offer.AdminInfo.CompanyName;
                            column.Item().AlignLeft().Text(aziendaNome)
                                .FontSize(14).FontColor("#FFFFFF");

                            var specialistaEmail = offer.DealerInfo?.Email ?? offer.AdminInfo.Email;
                            column.Item().AlignLeft().Text(specialistaEmail)
                                .FontSize(12).FontColor("#FFFFFF");
                        });
                    });

                    // PAGINA 2
                    document.Page(page =>
                    {
                        page.Size(PageSizes.A4.Landscape());
                        page.Margin(0);

                        var imagePathPag2 = Path.Combine(_environment.WebRootPath, "images", "offer_pag_2.jpg");
                        page.Background().Image(imagePathPag2).FitArea();

                        page.Content().Padding(30).Column(column =>
                        {
                            column.Spacing(10);

                            column.Item().Row(row =>
                            {
                                foreach (var carImg in carImagesDetails)
                                {
                                    row.RelativeItem().Column(imgColumn =>
                                    {
                                        imgColumn.Item()
                                            .Height(200)
                                            .PaddingHorizontal(5)
                                            .Image(carImg.bytes).FitHeight();

                                        imgColumn.Item()
                                            .AlignCenter()
                                            .Text($"{carImg.color} - Angolo {carImg.angle}")
                                            .FontSize(12).FontColor("#00213b");
                                    });
                                }
                            });
                        });
                    });

                }).GeneratePdf();

                return File(pdf, "application/pdf", "Offerta.pdf");
            }
            catch (Exception ex)
            {
                Console.WriteLine("🔥 ERRORE PDF GENERATION: " + ex.Message);
                return StatusCode(500, ex.Message);
            }
        }


    }
}
