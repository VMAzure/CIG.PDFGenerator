using Microsoft.AspNetCore.Mvc;
using System.Text;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json; // ✅ IMPORTANTE: Importa questa libreria per ReadFromJsonAsync<T>()
using CIG.Models;



namespace CIG.Controllers
{

    // public class HomeController : Controller
    /*{
       private const string JwtKey = "88fd0837-0bb4-4e4f-9e62-0560ccc7e8fb"; // Usa la chiave reale
        private const string JwtIssuer = "https://coreapi-production-ca29.up.railway.app";
        private const string LoginRedirectUrl = "https://corewebapp-azcore.up.railway.app/";

       
        private static SymmetricSecurityKey GetSigningKey()
        {
            var keyBytes = Encoding.UTF8.GetBytes(JwtKey);
            return new SymmetricSecurityKey(keyBytes);
        }

        [HttpGet]
        public async Task<IActionResult> Index([FromQuery] string token)
        {
            if (string.IsNullOrEmpty(token))
            {
                Console.WriteLine("🔴 Nessun token ricevuto, reindirizzo al login.");
                return Redirect(LoginRedirectUrl);
            }

            Dictionary<string, string> claimsDict;
            try
            {
                var handler = new JwtSecurityTokenHandler();
                Console.WriteLine("🔍 Valore di JwtIssuer: " + JwtIssuer);

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = GetSigningKey(),
                    ValidateIssuer = false,  // Il token potrebbe non avere l'issuer
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                handler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
                var jwtToken = (JwtSecurityToken)validatedToken;
                claimsDict = jwtToken.Claims.ToDictionary(c => c.Type, c => c.Value);

                Console.WriteLine("✅ Token valido per l'utente: " + claimsDict["sub"]);
            }
            catch (SecurityTokenExpiredException)
            {
                Console.WriteLine("🔴 Token SCADUTO, reindirizzo al login.");
                return Redirect(LoginRedirectUrl);
            }
            catch (SecurityTokenException ex)
            {
                Console.WriteLine("🔴 Errore nel token: " + ex.Message);
                return Redirect(LoginRedirectUrl);
            }
            catch (Exception ex)
            {
                Console.WriteLine("🔴 Errore generico: " + ex.Message);
                return Redirect(LoginRedirectUrl);
            }
       */

    [Route("api")]
    [ApiController]
    public class HomeController : Controller
    {
        private readonly string _customerId = "yourCustomerKey"; // 🔹 Sostituisci con il tuo customerId di IMAGIN.Studio
        private readonly HttpClient _httpClient = new HttpClient();

        [HttpGet("api/getBrands")]
        public async Task<List<string>> GetBrands()
        {
            var brands = new List<string>();
            var url = $"https://cdn.imagin.studio/getCarListing?customer={_customerId}";

            try
            {
                var response = await _httpClient.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {
                    brands = await response.Content.ReadFromJsonAsync<List<string>>(); // ✅ SOSTITUITO ReadAsAsync
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Errore in getBrands: {ex.Message}");
            }

            return brands;
        }

        [HttpGet("api/getCarDetails")]
        public async Task<IActionResult> GetCarDetails([FromQuery] string brand, [FromQuery] string model)
        {
            if (string.IsNullOrEmpty(brand) || string.IsNullOrEmpty(model))
                return BadRequest("I parametri 'brand' e 'model' sono obbligatori.");

            var carDetails = new Dictionary<string, List<string>>();
            var url = $"https://cdn.imagin.studio/getCarListing?customer={_customerId}&make={brand}&modelFamily={model}";

            try
            {
                var response = await _httpClient.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {
                    var data = await response.Content.ReadFromJsonAsync<dynamic>(); // ✅ SOSTITUITO ReadAsAsync
                    carDetails["versions"] = data.ContainsKey("Version") ? data["Version"].ToObject<List<string>>() : new List<string>();
                    carDetails["trims"] = data.ContainsKey("Trim") ? data["Trim"].ToObject<List<string>>() : new List<string>();
                    carDetails["bodySizes"] = data.ContainsKey("BodySize") ? data["BodySize"].ToObject<List<string>>() : new List<string>();
                    carDetails["powerTrains"] = data.ContainsKey("PowerTrain") ? data["PowerTrain"].ToObject<List<string>>() : new List<string>();
                    carDetails["modelVariants"] = data.ContainsKey("ModelVariant") ? data["ModelVariant"].ToObject<List<string>>() : new List<string>();
                    carDetails["transmissions"] = data.ContainsKey("Transmission") ? data["Transmission"].ToObject<List<string>>() : new List<string>();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Errore in getCarDetails: {ex.Message}");
                return StatusCode(500, "Errore interno del server");
            }

            return Ok(carDetails);
        }

        [HttpGet("api/getPaints")]
        public async Task<IActionResult> GetPaints([FromQuery] string brand, [FromQuery] string model)
        {
            if (string.IsNullOrEmpty(brand) || string.IsNullOrEmpty(model))
                return BadRequest("I parametri 'brand' e 'model' sono obbligatori.");

            var paints = new List<Dictionary<string, string>>();
            var url = $"https://cdn.imagin.studio/getPaints?customer={_customerId}&target=car&make={brand}&modelFamily={model}";

            try
            {
                var response = await _httpClient.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {
                    var data = await response.Content.ReadFromJsonAsync<dynamic>(); // ✅ SOSTITUITO ReadAsAsync
                    foreach (var paint in data["paintCombinations"])
                    {
                        var paintId = paint.Name;
                        var paintDescription = paint["mapped"].First.First["paintDescription"].ToString();
                        paints.Add(new Dictionary<string, string> { { "paintId", paintId }, { "paintDescription", paintDescription } });
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Errore in getPaints: {ex.Message}");
                return StatusCode(500, "Errore interno del server");
            }

            return Ok(paints);
        }
    }
}





