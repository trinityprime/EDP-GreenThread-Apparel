using System.ComponentModel.DataAnnotations;

namespace LearningAPI.Models
{
	public class OtpRequest
	{
		[Required]
		[EmailAddress]
		public string Email { get; set; } = string.Empty;
	}
}
