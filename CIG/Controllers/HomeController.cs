using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Npgsql;
using CIG.Models;

namespace CIG.Controllers
{
    // Definizione del modello di vista. Se hai già questo file in CIG\Models, elimina questa definizione.
    public class HomeViewModel
    {
        // Claims dell'utente decodificati dal token JWT
        public Dictionary<string, string> Claims { get; set; } = new Dictionary<string, string>();
        public Dictionary<string, string> Config { get; set; } = new Dictionary<string, string>();

        public List<string> Brands { get; set; } = new List<string>();

        // Nuove liste per i dropdown
        public List<string> Gammas { get; set; } = new List<string>();          // Modelli / Gamma
        public List<string> ModelYears { get; set; } = new List<string>();        // Anno modello
        public List<string> Versiones { get; set; } = new List<string>();         // Versione
        public List<string> Allestimentos { get; set; } = new List<string>();       // Allestimento
        public List<string> TipoAlimentaziones { get; set; } = new List<string>();  // Tipo alimentazione
    }

    public class HomeController : Controller
    {
        private const string JwtKey = "88fd0837-0bb4-4e4f-9e62-0560ccc7e8fb"; // Usa la chiave reale
        private const string JwtIssuer = "https://coreapi-production-ca29.up.railway.app";
        private const string LoginRedirectUrl = "https://corewebapp-azcore.up.railway.app/";

        // Connection string per il database Supabase (pooler IPv4 + SSL)
        private readonly string _connectionString =
            "Host=aws-0-eu-central-1.pooler.supabase.com;" +
            "Port=6543;" +
            "Database=postgres;" +
            "Username=postgres.dvlyhzdnabwdpnziyjma;" +
            "Password=Azuremilano.2025;" +
            "SSL Mode=Require;" +
            "Trust Server Certificate=true;";

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

            // Recupera i dati da Supabase:
            var configValues = new Dictionary<string, string>();
            var brands = new List<string>();

            // Nuove liste per i dropdown
            var gammas = new List<string>();
            var modelYears = new List<string>();
            var versiones = new List<string>();
            var allestimentos = new List<string>();
            var tipoAlimentaziones = new List<string>();

            using (var conn = new NpgsqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                // Recupera i valori dalla tabella "imagin_config"
                using (var cmd = new NpgsqlCommand("SELECT config_key, config_value FROM imagin_config", conn))
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        configValues.Add(reader.IsDBNull(0) ? "" : reader.GetString(0), reader.GetString(1));
                    }
                }

                // Recupera la lista dei marchi (Brand)
                using (var cmd = new NpgsqlCommand("SELECT DISTINCT \"Brand\" FROM cars ORDER BY \"Brand\"", conn))
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        brands.Add(reader.IsDBNull(0) ? "" : reader.GetString(0));
                    }
                }

                // Recupera i modelli (Gamma)
                using (var cmd = new NpgsqlCommand("SELECT DISTINCT \"Gamma\" FROM cars ORDER BY \"Gamma\"", conn))
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        gammas.Add(reader.IsDBNull(0) ? "" : reader.GetString(0));
                    }
                }

                // Recupera gli anni dei modelli (non null)
                using (var cmd = new NpgsqlCommand("SELECT DISTINCT \"ModelYear\" FROM cars WHERE \"ModelYear\" IS NOT NULL ORDER BY \"ModelYear\"", conn))
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        modelYears.Add(reader.IsDBNull(0) ? "" : reader.GetInt32(0).ToString());
                    }
                }

                // Recupera le versioni
                using (var cmd = new NpgsqlCommand("SELECT DISTINCT \"Versione\" FROM cars ORDER BY \"Versione\"", conn))
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        versiones.Add(reader.IsDBNull(0) ? "" : reader.GetString(0));
                    }
                }

                // Recupera gli allestimenti
                using (var cmd = new NpgsqlCommand("SELECT DISTINCT \"Allestimento\" FROM cars ORDER BY \"Allestimento\"", conn))
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        allestimentos.Add(reader.IsDBNull(0) ? "" : reader.GetString(0));
                    }
                }

                // Recupera i tipi di alimentazione
                using (var cmd = new NpgsqlCommand("SELECT DISTINCT \"TipoAlimentazione\" FROM cars ORDER BY \"TipoAlimentazione\"", conn))
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        tipoAlimentaziones.Add(reader.IsDBNull(0) ? "" : reader.GetString(0));
                    }
                }
            }

            var viewModel = new HomeViewModel
            {
                Claims = claimsDict,
                Config = configValues,
                Brands = brands,
                Gammas = gammas,
                ModelYears = modelYears,
                Versiones = versiones,
                Allestimentos = allestimentos,
                TipoAlimentaziones = tipoAlimentaziones
            };

            return View(viewModel);
        }
    }
}
