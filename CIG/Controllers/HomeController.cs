using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Npgsql;

namespace CIG.Controllers
{
    // Modello di Vista per la pagina Index
    public class HomeViewModel
    {
        // Claims dell'utente decodificati dal token JWT
        public Dictionary<string, string> Claims { get; set; } = new Dictionary<string, string>();
        public Dictionary<string, string> Config { get; set; } = new Dictionary<string, string>();
        public List<string> Brands { get; set; } = new List<string>();

    }

    public class HomeController : Controller
    {
        private const string JwtKey = "88fd0837-0bb4-4e4f-9e62-0560ccc7e8fb"; // 🔴 Usa la chiave reale
        private const string JwtIssuer = "https://coreapi-production-ca29.up.railway.app";
        private const string LoginRedirectUrl = "https://corewebapp-azcore.up.railway.app/";

        // Connection string per il database Supabase (configurala con i tuoi dati)
        private readonly string _connectionString = "postgresql://postgres:Azuremilano.2025@db.dvlyhzdnabwdpnziyjma.supabase.co:5432/postgres";


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
                    ValidateIssuer = false, // Il token potrebbe non avere l'issuer
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

            // Ora, recuperiamo i dati da Supabase:
            var configValues = new Dictionary<string, string>();
            var brands = new List<string>();

            using (var conn = new NpgsqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                // Recupera i valori dalla tabella "imagin_config"
                using (var cmd = new NpgsqlCommand("SELECT config_key, config_value FROM imagin_config", conn))
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        configValues.Add(reader.GetString(0), reader.GetString(1));
                    }
                }

                // Recupera la lista dei marchi (Brand) dalla tabella "cars"
                using (var cmd = new NpgsqlCommand("SELECT DISTINCT \"Brand\" FROM cars ORDER BY \"Brand\"", conn))
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        brands.Add(reader.GetString(0));
                    }
                }
            }

            var viewModel = new HomeViewModel
            {
                Claims = claimsDict,
                Config = configValues,
                Brands = brands
            };

            return View(viewModel);
        }
    }
}
