using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using LearningAPI.Models;
using LearningAPI;

namespace LearningAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrderController : ControllerBase
    {
        private readonly MyDbContext _context;

        public OrderController(MyDbContext context)
        {
            _context = context;
        }

        // 📋 Get All Orders
        [HttpGet, Authorize]
        public async Task<IActionResult> GetAllOrders()
        {
            var orders = await _context.Orders
                .Include(o => o.User) // Include user details
                .Include(o => o.Payment) // Include Payment details
                .Include(o => o.OrderSummaryItems) // Include OrderSummaryItems
                    .ThenInclude(osi => osi.Product) // Include product details for OrderSummaryItems
                .ToListAsync();

            if (!orders.Any())
                return NotFound("No orders found.");

            var data = orders.Select(o => new
            {
                o.OrderID,
                o.OrderDate,
                o.OrderStatus,
                o.CreatedAt,
                o.UpdatedAt,
                o.UserID,
                User = o.User == null ? null : new
                {
                    o.User.FirstName,
                    o.User.LastName
                },
                Payment = o.Payment == null ? null : new
                {
                    PaymentID = o.Payment.PaymentID, 
                    PaymentMethod = o.Payment.PaymentMethod,
                    AmountPaid = o.Payment.AmountPaid,
                    PaymentStatus = o.Payment.PaymentStatus.ToString()
                },
                OrderSummaryItems = o.OrderSummaryItems?.Select(osi => new
                {
                    osi.OrderSummaryItemID,
                    Product = osi.Product == null ? null : new
                    {
                        osi.Product.ProductID,
                        osi.Product.ProductName,
                        osi.Product.Price
                    },
                    osi.Quantity,
                    osi.PriceAtPurchase
                }),
                GrandTotal = o.GrandTotal
            });

            return Ok(data);
        }

        // 📌 Get Order by ID
        [HttpGet("{id}"), Authorize]
        public async Task<IActionResult> GetOrderById(int id)
        {
            var order = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.Payment)
                .Include(o => o.OrderSummaryItems)
                    .ThenInclude(osi => osi.Product)
                .FirstOrDefaultAsync(o => o.OrderID == id);

            if (order == null)
                return NotFound($"Order with ID {id} not found.");

            var data = new
            {
                order.OrderID,
                order.OrderDate,
                order.OrderStatus,
                order.CreatedAt,
                order.UpdatedAt,
                order.UserID,
                User = order.User == null ? null : new
                {
                    order.User.FirstName,
                    order.User.LastName
                },
                Payment = order.Payment == null ? null : new
                {
                    order.Payment.PaymentID,
                    order.Payment.PaymentMethod,
                    order.Payment.AmountPaid,
                    PaymentStatus = order.Payment.PaymentStatus.ToString()
                },
                OrderSummaryItems = order.OrderSummaryItems?.Select(osi => new
                {
                    osi.OrderSummaryItemID,
                    Product = osi.Product == null ? null : new
                    {
                        osi.Product.ProductID,
                        osi.Product.ProductName,
                        osi.Product.Price
                    },
                    osi.Quantity,
                    osi.PriceAtPurchase
                }),
                GrandTotal = order.GrandTotal
            };

            return Ok(data);
        }

        // 🔄 Update Order Status
        [HttpPut("{id}"), Authorize]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] Order orderRequest)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound();

            order.OrderStatus = orderRequest.OrderStatus;
            order.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Order ID {id} status updated to {order.OrderStatus}." });
        }

        // 🗑️ Delete an Order
        [HttpDelete("{id}"), Authorize]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound();

            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
