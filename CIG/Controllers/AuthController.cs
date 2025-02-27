using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using System;
using System.Linq;


namespace CIG.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private const string JwtKey = "88fd0837-0bb4-4e4f-9e62-0560ccc7e8fb"; // 🔴 Usa la chiave reale
        private const string LoginRedirectUrl = "https://corewebapp-azcore.up.railway.app/";

        [HttpGet("validate")]
        public IActionResult ValidateToken([FromQuery] string token)
        {
            if (string.IsNullOrEmpty(token))
            {
                return Redirect(LoginRedirectUrl);
            }

            try
            {
                var handler = new JwtSecurityTokenHandler();
                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtKey)),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero // Evita ritardi nella validazione della scadenza
                };

                handler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
                var jwtToken = (JwtSecurityToken)validatedToken;

                var claims = jwtToken.Claims.ToDictionary(c => c.Type, c => c.Value);

                return Ok(new
                {
                    Message = "Token valido",
                    Claims = claims
                });
            }
            catch (SecurityTokenExpiredException)
            {
                return BadRequest(new { Message = "Token scaduto. Effettua nuovamente il login." });
            }
            catch (SecurityTokenException)
            {
                return BadRequest(new { Message = "Token non valido." });
            }
            catch
            {
                return Redirect(LoginRedirectUrl);
            }
        }
    }
}

