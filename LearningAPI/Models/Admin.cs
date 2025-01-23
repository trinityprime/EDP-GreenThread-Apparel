using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace LearningAPI.Models
{
	public class Admin
	{
		public int AdminID { get; set; }

		[MaxLength(50)]
		public string Email { get; set; } = string.Empty;

		[MaxLength(100), JsonIgnore]
		public string Password { get; set; } = string.Empty;

		public bool IsDeactivated { get; set; } = false; 

		[Column(TypeName = "datetime")]
		public DateTime CreatedAt { get; set; }

		[Column(TypeName = "datetime")]
		public DateTime UpdatedAt { get; set; }

		public string Role { get; set; } = "Admin"; 
	}
}

