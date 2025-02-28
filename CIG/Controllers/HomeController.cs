using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System;

namespace CIG.Controllers
{
    public class HomeController : Controller
    {
        private const string JwtKey = "88fd0837-0bb4-4e4f-9e62-0560ccc7e8fb"; // 🔴 Usa la chiave reale
        private const string LoginRedirectUrl = "https://corewebapp-azcore.up.railway.app/";

        private static SymmetricSecurityKey GetSigningKey()
        {
            var keyBytes = Encoding.UTF8.GetBytes(JwtKey);
            return new SymmetricSecurityKey(keyBytes);
        }

        [HttpGet]
        public IActionResult Index([FromQuery] string token)
        {
            if (string.IsNullOrEmpty(token))
            {
                Console.WriteLine("🔴 Nessun token ricevuto, reindirizzo al login.");
                return Redirect(LoginRedirectUrl);
            }

            try
            {
                var handler = new JwtSecurityTokenHandler();
                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = GetSigningKey(),
                    ValidateIssuer = false, // 🔹 Il token non ha "iss"
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                handler.ValidateToken(token, validationParameters, out _);

                Console.WriteLine("✅ Token valido, accesso consentito.");
                return View();
            }
            catch (SecurityTokenExpiredException)
            {
                Console.WriteLine("🔴 Token SCADUTO, reindirizzo al login.");
                return Redirect(LoginRedirectUrl);
            }
            catch (SecurityTokenException)
            {
                Console.WriteLine("🔴 Token non valido, reindirizzo al login.");
                return Redirect(LoginRedirectUrl);
            }
            catch (Exception ex)
            {
                Console.WriteLine("🔴 Errore generico: " + ex.Message);
                return Redirect(LoginRedirectUrl);
            }
        }
    }
}
