using LearningAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace LearningAPI.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class DeliveryController : ControllerBase
	{
		private readonly MyDbContext _context;

		public DeliveryController(MyDbContext context)
		{
			_context = context;
		}

		// 📋 GET All Deliveries
		[HttpGet]
		public async Task<IActionResult> GetAllDeliveries()
		{
			var deliveries = await _context.Deliveries.ToListAsync();
			return Ok(deliveries);
		}

		// 📌 GET Delivery by ID
		[HttpGet("{id}")]
		public async Task<IActionResult> GetDeliveryById(int id)
		{
			var delivery = await _context.Deliveries.FindAsync(id);

			if (delivery == null)
				return NotFound($"Delivery with ID {id} not found.");

			return Ok(delivery);
		}


        // 📌 GET Deliveries for a Specific Order
        [HttpGet("order/{orderID}")]
        public async Task<IActionResult> GetDeliveriesByOrderId(int orderID)
        {
            Console.WriteLine($"Fetching deliveries for Order ID: {orderID}"); // Debugging log

            var deliveries = await _context.Deliveries
                .Where(d => d.OrderID == orderID)
                .ToListAsync();

            if (!deliveries.Any())
            {
                Console.WriteLine($"No deliveries found for Order ID {orderID}");
                return NotFound($"No deliveries found for Order ID {orderID}.");
            }

            return Ok(deliveries);
        }



        // ➕ POST Create a New Delivery
        [HttpPost]
		public async Task<IActionResult> CreateDelivery([FromBody] Delivery delivery)
		{
			if (delivery == null)
				return BadRequest("Invalid delivery data.");

			// Check if the Order exists
			var orderExists = await _context.Orders.AnyAsync(o => o.OrderID == delivery.OrderID);
			if (!orderExists)
				return BadRequest("Invalid OrderID. Order does not exist.");

			delivery.CreatedAt = DateTime.UtcNow;
			delivery.UpdatedAt = DateTime.UtcNow;

			_context.Deliveries.Add(delivery);
			await _context.SaveChangesAsync();

			return CreatedAtAction(nameof(GetDeliveryById), new { id = delivery.DeliveryID }, delivery);
		}

        // 📝 PUT Update Delivery Address


        // 📝 PUT Update Delivery Address
        [HttpPut("{id}/address")]
        public async Task<IActionResult> UpdateDeliveryAddress(int id, [FromBody] string newAddress)
        {
            var delivery = await _context.Deliveries.FindAsync(id);
            if (delivery == null)
                return NotFound("Delivery not found.");

            // Validate address input
            if (string.IsNullOrWhiteSpace(newAddress) || newAddress.Length > 255)
                return BadRequest("Invalid address. Ensure it is not empty and within 255 characters.");

            delivery.Address = newAddress;
            delivery.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Address updated successfully." });
        }

        public class UpdateDeliveryStatusRequest
        {
            public string NewStatus { get; set; }
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateDeliveryStatus(int id, [FromBody] UpdateDeliveryStatusRequest request)
        {
            var delivery = await _context.Deliveries.FindAsync(id);
            if (delivery == null)
                return NotFound("Delivery not found.");

            if (string.IsNullOrWhiteSpace(request.NewStatus))
                return BadRequest("Delivery status cannot be empty.");

            // Ensure case-insensitive enum parsing
            if (!Enum.TryParse(request.NewStatus, true, out Delivery.Delivery_Status parsedStatus))
                return BadRequest("Invalid delivery status.");

            delivery.DeliveryStatus = parsedStatus;
            delivery.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Delivery status updated to {parsedStatus}." });
        }


        // 🗑️ DELETE Delivery
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDelivery(int id)
        {
            var delivery = await _context.Deliveries.FindAsync(id);
            if (delivery == null)
                return NotFound("Delivery not found.");

            try
            {
                _context.Deliveries.Remove(delivery);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Delivery deleted successfully." });
            }
            catch (DbUpdateException)
            {
                return BadRequest("Cannot delete delivery as it is linked to other records.");
            }
        }

    }
}