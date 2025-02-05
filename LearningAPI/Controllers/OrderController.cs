using LearningAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LearningAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrderController : ControllerBase
    {
        private readonly MyDbContext _context;
        private readonly ILogger<OrderController> _logger;

        public OrderController(MyDbContext context, ILogger<OrderController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // 📋 GET All Orders
        [HttpGet]
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

            return Ok(orders);
        }

        // 📌 GET Order by ID
        [HttpGet("{id}")]
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

            return Ok(order);
        }

        // 🛒 POST Create New Order (After Payment)
        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] Order order)
        {
            try
            {
                if (order == null)
                    return BadRequest(new { message = "Invalid request. Check JSON format." });

                // ✅ Check if User exists
                var userExists = await _context.Users.AnyAsync(u => u.UserID == order.UserID);
                if (!userExists)
                    return BadRequest(new { message = $"Invalid UserID: {order.UserID}. User does not exist." });

                // ✅ Check if Payment exists
                var paymentExists = await _context.Payments.AnyAsync(p => p.PaymentID == order.PaymentID);
                if (!paymentExists)
                    return BadRequest(new { message = $"Invalid PaymentID: {order.PaymentID}. Payment does not exist." });

                // ✅ Ensure GrandTotal is correct
                var payment = await _context.Payments.FindAsync(order.PaymentID);
                if (order.GrandTotal != payment.AmountPaid)
                    return BadRequest(new { message = $"GrandTotal must match Payment AmountPaid ({payment.AmountPaid})." });

                // ✅ Save order
                order.OrderStatus = OrderStatus.Completed; // Order completes after payment
                order.OrderDate = DateTime.UtcNow;
                order.CreatedAt = DateTime.UtcNow;
                order.UpdatedAt = DateTime.UtcNow;

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetOrderById), new { id = order.OrderID }, order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating order");
                return StatusCode(500, "Internal Server Error");
            }
        }

        // 🔄 PUT Update Order Status
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] OrderStatus newStatus)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound($"Order with ID {id} not found.");

            order.OrderStatus = newStatus;
            order.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Order ID {id} status updated to {newStatus}." });
        }

        // 🗑️ DELETE Order (Only if Cancelled)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound($"Order with ID {id} not found.");

            if (order.OrderStatus != OrderStatus.Cancelled)
                return BadRequest("Cannot delete an order unless it is cancelled.");

            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
