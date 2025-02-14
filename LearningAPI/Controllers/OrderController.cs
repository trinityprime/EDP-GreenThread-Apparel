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

        [HttpGet]
        public async Task<IActionResult> GetAllOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var orders = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.Payment)
                .Include(o => o.OrderSummaryItems)
                    .ThenInclude(osi => osi.Product)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            if (!orders.Any())
                return NotFound("No orders found.");

            return Ok(orders);
        }

        [HttpGet("user-orders/{userID}")]
        public async Task<IActionResult> GetUserOrders(int userID, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var userExists = await _context.Users.AnyAsync(u => u.UserID == userID);
            if (!userExists)
                return BadRequest($"User with ID {userID} does not exist.");

            var orders = await _context.Orders
                .Where(o => o.UserID == userID)
                .Include(o => o.Payment)
                .Include(o => o.OrderSummaryItems)
                    .ThenInclude(osi => osi.Product)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            if (!orders.Any())
                return NotFound($"No orders found for user with ID {userID}.");

            return Ok(orders);
        }

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

        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] Order order)
        {
            if (order == null || order.OrderSummaryItems == null || !order.OrderSummaryItems.Any())
                return BadRequest("Invalid order. Ensure JSON format and that at least one item is included.");

            var userExists = await _context.Users.AnyAsync(u => u.UserID == order.UserID);
            if (!userExists)
                return BadRequest($"Invalid UserID: {order.UserID}. User does not exist.");

            var payment = await _context.Payments.FindAsync(order.PaymentID);
            if (payment == null)
                return BadRequest($"Payment with ID {order.PaymentID} not found.");

            if (order.GrandTotal != payment.AmountPaid)
                return BadRequest($"GrandTotal ({order.GrandTotal}) must match Payment AmountPaid ({payment.AmountPaid}).");

            var existingOrder = await _context.Orders.FirstOrDefaultAsync(o => o.PaymentID == order.PaymentID);
            if (existingOrder != null)
                return Conflict(new
                {
                    message = "An order already exists for this payment.",
                    existingOrderID = existingOrder.OrderID
                });

            // Create the order
            order.OrderStatus = OrderStatus.Completed;
            order.OrderDate = DateTime.UtcNow;
            order.CreatedAt = DateTime.UtcNow;
            order.UpdatedAt = DateTime.UtcNow;

            _context.Orders.Add(order);

            // Clear the shopping cart associated with the payment
            var cartItems = await _context.ShoppingCarts
                .Where(c => c.ShoppingCartID == payment.ShoppingCartID)
                .Include(c => c.Product)
                .ToListAsync();

            if (cartItems.Any())
            {
                _context.ShoppingCarts.RemoveRange(cartItems);
            }

            payment.PaymentStatus = PaymentStatus.Completed;

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetOrderById), new { id = order.OrderID }, new
            {
                message = "Order created successfully.",
                orderID = order.OrderID
            });
        }

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
