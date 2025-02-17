using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace LearningAPI.Models
{
    public class Refund
    {
        public int RefundID { get; set; }

        [ForeignKey("UserID")]
        public int UserID { get; set; }
        public virtual User? User { get; set; }

        [ForeignKey("OrderID")]
        public int OrderID { get; set; }
        public virtual Order? Order { get; set; }

        [Required]
        public decimal RefundAmount { get; set; }

        [Required]
        public DateTime RefundDate { get; set; }

        [Required]
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public Refund_Status RefundStatus { get; set; }

        [Required]
        [StringLength(500)]
        public string? Reason { get; set; }

        public enum Refund_Status
        {
            Pending,
            Rejected,
            Completed
        }
    }
}
