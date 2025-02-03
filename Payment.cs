using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace EDP_API.Models
{
    public class Payment
    {
        [Key]
        public int PaymentID { get; set; }

        [ForeignKey("UserID")]
        public int UserID { get; set; }
        public virtual User? User { get; set; } // navigate to User model


        [ForeignKey("OrderID")]
        public int OrderID { get; set; }
        public virtual Order? Order { get; set; } // navigate to Order model

        [Required(ErrorMessage = "Address is required.")]
        [StringLength(250, ErrorMessage = "Address cannot exceed 250 characters.")]
        public string Address { get; set; }

        [Required(ErrorMessage = "Phone number is required.")]
        [StringLength(15, ErrorMessage = "Phone number cannot exceed 15 characters.")]
        public string PhoneNumber { get; set; }

        [Required(ErrorMessage = "Payment method is required.")]
        [StringLength(50, ErrorMessage = "Payment method cannot exceed 50 characters.")]
        public string PaymentMethod { get; set; }

        // Enum for Payment Status
        [Required(ErrorMessage = "Payment status is required.")]
        [JsonConverter(typeof(JsonStringEnumConverter))] 
        public Payment_Status PaymentStatus { get; set; }

        public enum Payment_Status
        {
            Pending,
            Completed,
            Failed,
            Cancelled
        }
    }
}
