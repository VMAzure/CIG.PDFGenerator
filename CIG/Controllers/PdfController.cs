﻿using Microsoft.AspNetCore.Mvc;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using CIG.PDFGenerator.Models;
using Microsoft.AspNetCore.Http;
using QuestPDF;
using QuestPDF.Previewer;
using QuestPDF.Drawing;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using System.Linq;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc.RazorPages;


namespace CIG.PDFGenerator.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PdfController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;
        private readonly IHttpClientFactory _httpClientFactory;

        public PdfController(IWebHostEnvironment environment, IHttpClientFactory httpClientFactory)
        {
            _environment = environment;
            _httpClientFactory = httpClientFactory;
        }

        [HttpPost("GenerateOffer")]
        public async Task<IActionResult> GenerateOffer([FromBody] OfferPdfPage1 offer)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            QuestPDF.Settings.EnableDebugging = true;

            try
            {
                var carImage29 = offer.CarImages?.FirstOrDefault(i => i.Angle == 29);
                var carImage09 = offer.CarImages?.FirstOrDefault(i => i.Angle == 9);

                var img29Bytes = await DownloadImageAsync(carImage29?.Url);
                var img09Bytes = await DownloadImageAsync(carImage09?.Url);
                var carImageBytes = await DownloadImageAsync(offer.CarMainImageUrl);
                var logoUrl = offer.DealerInfo?.LogoUrl ?? offer.AdminInfo.LogoUrl;
                var logoBytes = await DownloadImageAsync(logoUrl);

                var carImagesDetails = await DownloadCarImagesAsync(offer.CarImages);

                RegisterFonts();

                var pdfBytes = Document.Create(container =>
                {
                    CreatePage1(container, offer, carImageBytes, logoBytes);
                    CreatePage2(container, img29Bytes, img09Bytes, offer);
                }).GeneratePdf();

                return File(pdfBytes, "application/pdf", "Offerta.pdf");
            }
            catch (Exception ex)
            {
                Console.WriteLine("🔥 ERRORE PDF GENERATION: " + ex.Message);
                Console.WriteLine(ex.StackTrace);
                return StatusCode(500, new { ex.Message, ex.StackTrace });
            }
        }



        private async Task<byte[]> DownloadImageAsync(string url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return null;

            var client = _httpClientFactory.CreateClient();
            try
            {
                return await client.GetByteArrayAsync(url);
            }
            catch (Exception ex)
            {
                // Log the error using a logging framework
                return null;
            }
        }

        private async Task<List<(byte[] bytes, string color, int angle)>> DownloadCarImagesAsync(List<CarImageDetail> carImages)
        {
            var tasks = carImages?.Select(async img =>
            {
                var bytes = await DownloadImageAsync(img.Url);
                return (bytes, img.Color, img.Angle);
            }).ToList();

            if (tasks != null)
            {
                var results = await Task.WhenAll(tasks);
                return results.ToList();
            }

            return new List<(byte[], string, int)>();
        }

        private void RegisterFonts()
        {
            var regularFontPath = Path.Combine(_environment.WebRootPath, "fonts", "Montserrat-Regular.ttf");
            var boldFontPath = Path.Combine(_environment.WebRootPath, "fonts", "Montserrat-Bold.ttf");

            using var regularFontStream = System.IO.File.OpenRead(regularFontPath);
            FontManager.RegisterFont(regularFontStream);

            using var boldFontStream = System.IO.File.OpenRead(boldFontPath);
            FontManager.RegisterFont(boldFontStream);
        }

        private void CreatePage1(IDocumentContainer container, OfferPdfPage1 offer, byte[] carImageBytes, byte[] logoBytes)
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(0);

                var imagePathPag1 = Path.Combine(_environment.WebRootPath, "images", "offer_pag_1.jpg");
                page.Background().Image(imagePathPag1).FitArea();
                page.DefaultTextStyle(x => x.FontFamily("Montserrat"));

                page.Content().Padding(30).Column(column =>
                {
                    column.Spacing(10);

                    column.Item().Row(row =>
                    {
                        // NON scaricare più l'immagine qui!
                        if (logoBytes != null)
                            row.ConstantItem(200).Image(logoBytes).FitWidth();

                        row.AutoItem().AlignMiddle().PaddingHorizontal(10)
                            .Text("& ").FontSize(30).FontColor("#00213b");

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
        }


        private void CreatePage2(IDocumentContainer container, byte[] img29Bytes, byte[] img09Bytes, OfferPdfPage1 offer)
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(0);

                var imagePathPag2 = Path.Combine(_environment.WebRootPath, "images", "offer_pag_2.jpg");
                page.Background().Image(imagePathPag2).FitArea();
                page.DefaultTextStyle(x => x.FontFamily("Montserrat"));

                page.Content().Padding(20).Row(row =>
                {
                    // Testo (circa 40% larghezza)
                    row.RelativeItem(4).Column(column =>
                    {
                        column.Spacing(10);

                        column.Item().Text(text =>
                        {
                            text.Span("QUICK").FontSize(36).FontColor("#FFFFFF");
                            text.Span("VIEW").FontSize(36).Bold().FontColor("#FF7100");
                        });

                        column.Item().PaddingBottom(50); // 👈 Aggiungi questo

                        column.Item().PaddingTop(10).Text("# 1 - Servizi compresi nell'offerta")
                            .FontSize(16).FontColor("#FFFFFF");

                        var cliente = !string.IsNullOrWhiteSpace(offer.CustomerCompanyName)
                                      ? offer.CustomerCompanyName
                                      : $"{offer.CustomerFirstName} {offer.CustomerLastName}".Trim();

                        column.Item().PaddingTop(15).Text($"# 2 - La nostra proposta per {cliente}")
                            .FontSize(16).FontColor("#FFFFFF");

                        column.Item().PaddingTop(15).Text("# 3 - Prossimi passi")
                            .FontSize(16).FontColor("#FFFFFF");
                    });

                    // Colonna con le immagini - ben ottimizzata
                    row.RelativeItem(6).AlignRight().Column(colImmagini =>
                    {
                        colImmagini.Spacing(5);

                        if (img29Bytes != null)
                        {
                            colImmagini.Item()
                                .Width(380)
                                .Image(img29Bytes)
                                .FitWidth();
                        }

                        if (img09Bytes != null)
                        {
                            colImmagini.Item()
                                .PaddingTop(10)
                                .Width(380)
                                .Image(img09Bytes)
                                .FitWidth();
                        }
                    });
                });
            });
        }

    }
}

