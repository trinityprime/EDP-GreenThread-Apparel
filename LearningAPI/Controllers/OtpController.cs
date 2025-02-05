using LearningAPI.Models;
using LearningAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LearningAPI.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class OtpController : ControllerBase
	{
		private readonly OtpService _otpService;
		private readonly MyDbContext _context;
		private readonly EmailService _emailService; 

		public OtpController(OtpService otpService, MyDbContext context, EmailService emailService)
		{
			_otpService = otpService;
			_context = context;
			_emailService = emailService; 
		}

		// Request OTP for password reset
		[HttpPost("request")]
		public IActionResult RequestOtp([FromBody] OtpRequest otpRequest)
		{
			var user = _context.Users.FirstOrDefault(u => u.Email == otpRequest.Email);
			if (user == null || user.IsDeactivated)
			{
				return NotFound(new { message = "User not found or account deactivated." });
			}

			string otpCode = _otpService.GenerateOtpCode();
			_otpService.StoreOtp(otpRequest.Email, otpCode);

			// Send OTP via email
			string subject = "Your OTP Code";
			string body = $@"
			<h2>Password Reset OTP</h2>
			<p>Your OTP code is: <strong>{otpCode}</strong>.</p>
			<p>This code will expire in 5 minutes.</p>
			<p>If you did not request this OTP, please ignore this email.</p>
			"; _emailService.SendEmail(otpRequest.Email, subject, body);

			return Ok(new { message = "OTP sent successfully." });
		}

		// Verify OTP
		[HttpPost("verify")]
		public IActionResult VerifyOtp([FromBody] OtpRequest otpRequest, [FromQuery] string otpCode)
		{
			var user = _context.Users.FirstOrDefault(u => u.Email == otpRequest.Email);
			if (user == null || user.IsDeactivated)
			{
				return NotFound(new { message = "User not found or account deactivated." });
			}

			bool isValid = _otpService.ValidateOtp(otpRequest.Email, otpCode);
			if (!isValid)
			{
				return BadRequest(new { message = "Invalid or expired OTP." });
			}

			return Ok(new { message = "OTP verified successfully." });
		}
	}
}