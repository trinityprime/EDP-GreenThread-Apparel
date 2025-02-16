using LearningAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

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

        // Get all orders
        [HttpGet]
        public async Task<IActionResult> GetAllOrders()
        {
            try
            {
                var orders = await _context.Orders
                    .Include(o => o.User)
                    .Include(o => o.Payment)
                    .Include(o => o.OrderItems)
                    .ToListAsync();

                if (!orders.Any())
                    return NotFound("No orders found.");

                var result = orders.Select(o => new
                {
                    o.OrderID,
                    o.OrderDate,
                    o.GrandTotal,
                    o.OrderStatus,
                    User = o.User == null ? null : new
                    {
                        o.User.FirstName,
                        o.User.LastName,
                        o.User.Email // Ensure this is included in the response
                    },
                    Payment = new
                    {
                        o.Payment.PaymentMethod,
                        o.Payment.AmountPaid,
                        o.Payment.Address,
                        o.Payment.PhoneNumber
                    },
                    Items = o.OrderItems.Select(i => new
                    {
                        i.ProductName,
                        i.Quantity,
                        i.Price,
                        DiscountPercentage = i.DiscountPercentage,
                        i.Total
                    })
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving orders");
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        // Get orders by user ID
        [HttpGet("user-orders/{userID}")]
        public async Task<IActionResult> GetUserOrders(int userID)
        {
            _logger.LogInformation($"Fetching orders for UserID: {userID}");

            if (userID <= 0)
            {
                _logger.LogError("Invalid UserID provided.");
                return BadRequest("Invalid UserID.");
            }

            var userExists = await _context.Users.AnyAsync(u => u.UserID == userID);
            if (!userExists)
            {
                _logger.LogError($"User with ID {userID} not found.");
                return NotFound($"User with ID {userID} not found.");
            }

            try
            {
                var orders = await _context.Orders
                    .Where(o => o.UserID == userID)
                    .Include(o => o.User) // Include the User entity
                    .Include(o => o.Payment)
                    .Include(o => o.OrderItems)
                    .ToListAsync();

                if (!orders.Any())
                {
                    _logger.LogWarning($"No orders found for UserID: {userID}");
                    return NotFound($"No orders found for user with ID {userID}.");
                }

                var result = orders.Select(o => new
                {
                    o.OrderID,
                    o.OrderDate,
                    o.GrandTotal,
                    o.OrderStatus,
                    User = o.User == null ? null : new
                    {
                        o.User.FirstName,
                        o.User.LastName,
                        o.User.Email // Ensure this is included in the response
                    },
                    Payment = new
                    {
                        o.Payment.PaymentMethod,
                        o.Payment.AmountPaid,
                        o.Payment.Address,
                        o.Payment.PhoneNumber
                    },
                    Items = o.OrderItems.Select(i => new
                    {
                        i.ProductName,
                        i.Quantity,
                        i.Price,
                        DiscountPercentage = i.DiscountPercentage,
                        i.Total
                    })
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving orders for UserID: {userID}");
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest orderRequest)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _logger.LogInformation($"Starting order creation for UserID: {orderRequest.UserID}, PaymentID: {orderRequest.PaymentID}");

                // Validate Payment
                var payment = await _context.Payments
                    .Include(p => p.ShoppingCart)
                        .ThenInclude(sc => sc.ShoppingCartItems)
                            .ThenInclude(sci => sci.Product)
                    .FirstOrDefaultAsync(p => p.PaymentID == orderRequest.PaymentID);

                if (payment == null)
                {
                    _logger.LogError($"Payment not found for PaymentID: {orderRequest.PaymentID}");
                    return BadRequest("Payment not found.");
                }

                _logger.LogInformation($"Payment found. PaymentID: {payment.PaymentID}, ShoppingCartID: {payment.ShoppingCartID}");

                if (payment.PaymentStatus != PaymentStatus.Completed)
                {
                    _logger.LogError($"Payment not completed for PaymentID: {orderRequest.PaymentID}");
                    return BadRequest("Payment has not been completed.");
                }

                // Validate Shopping Cart
                var shoppingCart = await _context.ShoppingCarts
                    .Include(sc => sc.ShoppingCartItems)
                    .FirstOrDefaultAsync(sc => sc.ShoppingCartID == payment.ShoppingCartID);

                if (shoppingCart == null)
                {
                    _logger.LogError($"Shopping cart not found for ShoppingCartID: {payment.ShoppingCartID}");
                    return BadRequest("Shopping cart does not exist.");
                }

                _logger.LogInformation($"ShoppingCartID: {shoppingCart.ShoppingCartID} retrieved successfully with {shoppingCart.ShoppingCartItems.Count} items.");

                // Validate User
                var user = await _context.Users.FindAsync(orderRequest.UserID);
                if (user == null)
                {
                    _logger.LogError($"User not found for UserID: {orderRequest.UserID}");
                    return BadRequest("User not found.");
                }

                _logger.LogInformation($"User validated. UserID: {user.UserID}");

                // Calculate Grand Total
                var grandTotal = payment.AmountPaid;
                _logger.LogInformation($"Calculated GrandTotal: {grandTotal}");

                // Create Order
                var newOrder = new Order
                {
                    UserID = orderRequest.UserID,
                    PaymentID = orderRequest.PaymentID,
                    ShoppingCartID = shoppingCart.ShoppingCartID,
                    OrderDate = DateTime.UtcNow,
                    GrandTotal = grandTotal,
                    OrderStatus = OrderStatus.Pending,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    OrderItems = shoppingCart.ShoppingCartItems.Select(cartItem => new OrderItem
                    {
                        ProductName = cartItem.Product.ProductName,
                        Price = cartItem.Product.Price,
                        Quantity = cartItem.Quantity,
                        DiscountPercentage = cartItem.Product.DiscountPercentage,
                        Total = cartItem.Quantity * (cartItem.Product.Price * (1 - cartItem.Product.DiscountPercentage / 100)),
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }).ToList()
                };

                _context.Orders.Add(newOrder);
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Order created successfully. OrderID: {newOrder.OrderID}");

                // Remove the Shopping Cart
                _context.ShoppingCarts.Remove(shoppingCart);
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Shopping cart cleared for UserID: {orderRequest.UserID}");

                await transaction.CommitAsync();

                return CreatedAtAction(nameof(GetOrderById), new { id = newOrder.OrderID }, newOrder);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating order");
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        // dto for creating an order
        public class CreateOrderRequest
        {
            [Required]
            public int UserID { get; set; }

            [Required]
            public int PaymentID { get; set; }
            public int ShoppingCartID { get; set; }
        }



        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrderById(int id)
        {
            try
            {
                var order = await _context.Orders
                    .Include(o => o.User)
                    .Include(o => o.Payment)
                    .Include(o => o.OrderItems) // Include OrderItems
                    .FirstOrDefaultAsync(o => o.OrderID == id);


                if (order == null)
                    return NotFound($"Order with ID {id} not found.");


                var result = new
                {
                    order.OrderID,
                    order.OrderDate,
                    order.GrandTotal,
                    order.OrderStatus,
                    User = order.User == null ? null : new
                    {
                        order.User.FirstName,
                        order.User.LastName,
                        order.User.Email // Include the email in the response
                    },
                    Payment = new
                    {
                        order.Payment.PaymentMethod,
                        order.Payment.AmountPaid,
                        order.Payment.Address,
                        order.Payment.PhoneNumber
                    },
                    Items = order.OrderItems.Select(i => new
                    {
                        i.ProductName,
                        i.Price,
                        i.Quantity,
                        DiscountPercentage = i.DiscountPercentage,
                        i.Total
                    })
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving order with ID {id}");
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }



        // Update order status
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] OrderStatus newStatus)
        {
            try
            {
                var order = await _context.Orders.FindAsync(id);
                if (order == null)
                    return NotFound($"Order with ID {id} not found.");

                order.OrderStatus = newStatus;
                order.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return Ok(new { message = $"Order ID {id} status updated to {newStatus}." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating order status");
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        // Delete an order
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            try
            {
                // Retrieve the order to ensure it exists
                var order = await _context.Orders
                    .Include(o => o.Payment) // Include Payment for logging/debugging purposes
                    .FirstOrDefaultAsync(o => o.OrderID == id);

                if (order == null)
                    return NotFound($"Order with ID {id} not found.");

                // Ensure the order is in a deletable state, e.g., canceled
                if (order.OrderStatus != OrderStatus.Cancelled)
                {
                    return BadRequest("Only canceled orders can be deleted.");
                }

                // Remove the order; the associated payment will also be deleted due to cascade delete
                _context.Orders.Remove(order);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Order and associated payment deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting order");
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }
    }
}
