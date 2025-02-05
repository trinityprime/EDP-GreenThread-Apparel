using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace LearningAPI.Services
{
	public class EmailService
	{
		private readonly IConfiguration _configuration;
		private readonly ILogger<EmailService> _logger;

		public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
		{
			_configuration = configuration;
			_logger = logger;
		}

		public void SendEmail(string toEmail, string subject, string body)
		{
			var emailSettings = _configuration.GetSection("EmailSettings");
			var smtpServer = emailSettings["SmtpServer"];
			var smtpPort = int.Parse(emailSettings["SmtpPort"]);
			var smtpUsername = emailSettings["SmtpUsername"];
			var smtpPassword = emailSettings["SmtpPassword"];
			var fromEmail = emailSettings["FromEmail"];
			var enableSsl = bool.Parse(emailSettings["EnableSsl"]);

			try
			{
				using (var client = new SmtpClient(smtpServer, smtpPort))
				{
					client.Credentials = new NetworkCredential(smtpUsername, smtpPassword);
					client.EnableSsl = enableSsl;
					client.Timeout = 10000; 

					var mailMessage = new MailMessage
					{
						From = new MailAddress(fromEmail),
						Subject = subject,
						Body = body,
						IsBodyHtml = true
					};
					mailMessage.To.Add(toEmail);

					client.Send(mailMessage);
					_logger.LogInformation($"Email sent successfully to {toEmail}.");
				}
			}
			catch (SmtpException ex)
			{
				_logger.LogError($"SMTP error sending email to {toEmail}: {ex.Message}");
				throw; // Re-throw the exception for the controller to handle
			}
			catch (Exception ex)
			{
				_logger.LogError($"Error sending email to {toEmail}: {ex.Message}");
				throw; // Re-throw the exception for the controller to handle
			}
		}
	}
}