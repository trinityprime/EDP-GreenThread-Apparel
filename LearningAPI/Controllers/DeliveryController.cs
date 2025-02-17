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


        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateDeliveryStatus(int id, [FromBody] string newStatus)
        {
            var delivery = await _context.Deliveries.FindAsync(id);
            if (delivery == null)
                return NotFound("Delivery not found.");

            // Validate if the status exists in the enum
            if (!Enum.TryParse(newStatus, out Delivery.Delivery_Status parsedStatus))
                return BadRequest("Invalid delivery status.");

            delivery.DeliveryStatus = parsedStatus;
            delivery.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Delivery status updated to {parsedStatus}." });
        }



        // 🔄 PUT Update Delivery Status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateDeliveryStatus(int id, [FromBody] dynamic payload)
        {
            var delivery = await _context.Deliveries.FindAsync(id);
            if (delivery == null)
                return NotFound("Delivery not found.");

            // Extract deliveryStatus from JSON payload
            string statusString = payload.deliveryStatus?.ToString();

            // Validate that the status exists in the enum
            if (!Enum.TryParse(statusString, out Delivery.Delivery_Status newStatus))
                return BadRequest("Invalid delivery status.");

            delivery.DeliveryStatus = newStatus;
            delivery.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Delivery status updated to {newStatus}." });
        }


        // 🗑️ DELETE Delivery
        [HttpDelete("{id}")]
		public async Task<IActionResult> DeleteDelivery(int id)
		{
			var delivery = await _context.Deliveries.FindAsync(id);
			if (delivery == null)
				return NotFound("Delivery not found.");

			_context.Deliveries.Remove(delivery);
			await _context.SaveChangesAsync();
			return NoContent();
		}
	}
}