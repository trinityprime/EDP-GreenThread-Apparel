using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace EDP_API.Models
{
    public class Refund
    {
        public int RefundID { get; set; }

        [ForeignKey("UserID")]
        public int UserID { get; set; }
        public virtual User? User { get; set; } // navigate to User model

        [ForeignKey("OrderID")]
        public int OrderID { get; set; }
        public virtual Order? Order { get; set; } // navigate to Order model

        [Required]
        public decimal RefundAmount { get; set; }

        [Required]
        public DateTime RefundDate { get; set; }

        [Required]
        [JsonConverter(typeof(JsonStringEnumConverter))] // serialized as a string
        public Refund_Status RefundStatus { get; set; }

        // Enum for Refund Status
        public enum Refund_Status
        {
            Pending,
            Rejected,
            Completed
        }
    }
}
