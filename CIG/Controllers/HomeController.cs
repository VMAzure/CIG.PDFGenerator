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

        public IActionResult Error404()
        {
            return View();
        }


        // API per ottenere i modelli in base alla marca selezionata
        [HttpGet("api/getModels")]
        public async Task<IActionResult> GetModels([FromQuery] string brand)
        {
            if (string.IsNullOrEmpty(brand))
                return BadRequest("Il parametro 'brand' è obbligatorio.");

            var models = new List<string>();

            using (var conn = new NpgsqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (var cmd = new NpgsqlCommand("SELECT DISTINCT \"Gamma\" FROM cars WHERE \"Brand\" = @brand ORDER BY \"Gamma\"", conn))
                {
                    cmd.Parameters.AddWithValue("@brand", brand);
                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            models.Add(reader.GetString(0));
                        }
                    }
                }
            }
            return Ok(models);
        }

        // API per ottenere le versioni in base alla marca e al modello selezionati
        [HttpGet("api/getVersions")]
        public async Task<IActionResult> GetVersions([FromQuery] string brand, [FromQuery] string model)
        {
            if (string.IsNullOrEmpty(brand) || string.IsNullOrEmpty(model))
                return BadRequest("I parametri 'brand' e 'model' sono obbligatori.");

            var versions = new List<string>();

            using (var conn = new NpgsqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (var cmd = new NpgsqlCommand("SELECT DISTINCT \"Versione\" FROM cars WHERE \"Brand\" = @brand AND \"Gamma\" = @model ORDER BY \"Versione\"", conn))
                {
                    cmd.Parameters.AddWithValue("@brand", brand);
                    cmd.Parameters.AddWithValue("@model", model);
                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            versions.Add(reader.GetString(0));
                        }
                    }
                }
            }
            return Ok(versions);
        }

        // API per ottenere gli allestimenti in base a marca, modello e versione selezionati
        [HttpGet("api/getAllestimenti")]
        public async Task<IActionResult> GetAllestimenti([FromQuery] string brand, [FromQuery] string model, [FromQuery] string version)
        {
            if (string.IsNullOrEmpty(brand) || string.IsNullOrEmpty(model) || string.IsNullOrEmpty(version))
                return BadRequest("I parametri 'brand', 'model' e 'version' sono obbligatori.");

            var allestimenti = new List<string>();

            using (var conn = new NpgsqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (var cmd = new NpgsqlCommand("SELECT DISTINCT \"Allestimento\" FROM cars WHERE \"Brand\" = @brand AND \"Gamma\" = @model AND \"Versione\" = @version ORDER BY \"Allestimento\"", conn))
                {
                    cmd.Parameters.AddWithValue("@brand", brand);
                    cmd.Parameters.AddWithValue("@model", model);
                    cmd.Parameters.AddWithValue("@version", version);
                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            allestimenti.Add(reader.GetString(0));
                        }
                    }
                }
            }
            return Ok(allestimenti);
        }


        [HttpGet("Error404")]
            public IActionResult Error404()
            {
                return View();
            }
        }
    }


    
