using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace LearningAPI.Models
{
	public class Delivery
	{
		[Key] // Primary Key
		public int DeliveryID { get; set; }

		[Required] // Foreign Key for Order
		public int OrderID { get; set; } // Foreign Key for Order

		[JsonIgnore] // Prevent serializing the Order property
		public virtual Order? Order { get; set; } // Single Order reference

		[Required] // Address is required
		[MaxLength(255, ErrorMessage = "Address cannot exceed 255 characters.")]
		public string Address { get; set; }

		[Required] // DeliveryStatus is required
		[JsonConverter(typeof(JsonStringEnumConverter))]
		public Delivery_Status DeliveryStatus { get; set; }

		[Required] // CreatedAt is required
		[Column(TypeName = "datetime")]
		public DateTime CreatedAt { get; set; }

		[Required] // UpdatedAt is required
		[Column(TypeName = "datetime")]
		public DateTime UpdatedAt { get; set; }

		// Enum for delivery status
		public enum Delivery_Status
		{
			Pending,
			In_Transit,
			Delivered,
			Cancelled
		}
	}
}