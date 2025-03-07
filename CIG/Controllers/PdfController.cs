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

                            // Dati Auto
                            column.Item().PaddingTop(10).Text("Dati Auto:").FontSize(14).Bold();
                            column.Item().PaddingLeft(10).Column(auto =>
                            {
                                auto.Item().Text($"• Marca: {offer.Auto.Marca}");
                                auto.Item().Text($"• Modello: {offer.Auto.Modello}");
                                auto.Item().Text($"• Versione: {offer.Auto.Versione}");
                                auto.Item().Text($"• Variante: {offer.Auto.Variante}");
                                auto.Item().Text($"• Descrizione Versione: {offer.Auto.DescrizioneVersione}");
                                auto.Item().Text($"• Note: {offer.Auto.Note}");
                            });


                            // Servizi selezionati
                            column.Item().PaddingTop(10).Text("Servizi selezionati:").Bold();

                            if (offer.Servizi != null && offer.Servizi.Any())
                            {
                                column.Item().PaddingLeft(10).Column(servizi =>
                                {
                                    foreach (var servizio in offer.Servizi)
                                    {
                                        servizi.Item().Text($"• Servizio: {servizio.Id} - Opzione scelta: {servizio.Opzione}");
                                    }
                                });
                            }
                            else
                            {
                                column.Item().Text("Nessun servizio selezionato.");
                            }

                            // Dati Economici
                            column.Item().PaddingTop(10).Text("Dati economici:").Bold();
                            column.Item().PaddingLeft(10).Column(dati =>
                            {
                                dati.Item().Text($"• Durata: {offer.DatiEconomici.Durata} mesi");
                                dati.Item().Text($"• Km totali: {offer.DatiEconomici.KmTotali}");
                                dati.Item().Text($"• Anticipo: € {offer.DatiEconomici.Anticipo}");
                                dati.Item().Text($"• Canone mensile: € {offer.DatiEconomici.Canone}");
                            });
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
