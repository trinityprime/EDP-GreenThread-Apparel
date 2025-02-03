using Microsoft.AspNetCore.Authentication.Cookies;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace EDP_API.Models
{
    public class OrderSummaryItem
    {
        public int OrderSummaryItemID { get; set; }


        [ForeignKey("OrderID")]
        public int OrderID { get; set; }
        public virtual Order Order { get; set; } // navigate to Order model


        [ForeignKey("ProductID")]
        public int ProductID { get; set; }
        public virtual Product Product { get; set; } // navigate to Product model


        public int Quantity { get; set; }
        public decimal Subtotal { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

    }
}
