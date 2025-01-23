using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace LearningAPI.Models
{
	public class User
	{
		public int UserID { get; set; }

		[MaxLength(50)]
		public string FirstName { get; set; } = string.Empty;

		[MaxLength(50)]
		public string LastName { get; set; } = string.Empty;

		[MaxLength(50)]
		public string Email { get; set; } = string.Empty;

		[MaxLength(100), JsonIgnore]
		public string Password { get; set; } = string.Empty;

		[RegularExpression(@"^\d{6}$")]
		public string PostalCode { get; set; } = string.Empty;

		public bool IsDeactivated { get; set; } = false;

		[Column(TypeName = "datetime")]
		public DateTime CreatedAt { get; set; }

		[Column(TypeName = "datetime")]
		public DateTime UpdatedAt { get; set; }

		public string Role { get; set; } = "User"; 

		// This is a self-referencing navigation property
		[ForeignKey("UserID")] // Specify that this collection will reference the UserID property
		public virtual ICollection<User> Users { get; set; } = new List<User>();
	}
}
