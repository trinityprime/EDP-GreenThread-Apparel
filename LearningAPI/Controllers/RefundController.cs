using LearningAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace LearningAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RefundController : ControllerBase
    {
        private readonly MyDbContext _context;

        public RefundController(MyDbContext context)
        {
            _context = context;
        }

        // 📋 GET All Refund Requests (Admin Only)
        [HttpGet, Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllRefunds()
        {
            var refunds = await _context.Refunds
                .Include(r => r.User)
                .Include(r => r.Order)
                .OrderByDescending(r => r.RefundDate)
                .ToListAsync();

            return Ok(refunds);
        }

        // 📌 GET Refund by ID (User or Admin)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetRefundById(int id)
        {
            var refund = await _context.Refunds
                .Include(r => r.User)
                .Include(r => r.Order)
                .FirstOrDefaultAsync(r => r.RefundID == id);

            if (refund == null)
                return NotFound("Refund not found.");

            return Ok(refund);
        }

        // ➕ POST Request a Refund (User)
        [HttpPost, Authorize]
        public async Task<IActionResult> CreateRefund([FromBody] Refund refundRequest)
        {
            int userId = GetUserId();

            var order = await _context.Orders.FindAsync(refundRequest.OrderID);
            if (order == null)
                return BadRequest("Invalid OrderID. Order does not exist.");

            // Ensure only the user who placed the order can request a refund
            if (order.UserID != userId)
                return Forbid("You are not authorized to refund this order.");

            // Check if a refund already exists for the order
            var existingRefund = await _context.Refunds.FirstOrDefaultAsync(r => r.OrderID == refundRequest.OrderID);
            if (existingRefund != null)
                return BadRequest("A refund has already been requested for this order.");

            // Refund Amount = Order Total
            var newRefund = new Refund
            {
                UserID = userId,
                OrderID = refundRequest.OrderID,
                RefundAmount = order.GrandTotal,
                RefundDate = DateTime.UtcNow,
                RefundStatus = Refund.Refund_Status.Pending
            };

            _context.Refunds.Add(newRefund);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetRefundById), new { id = newRefund.RefundID }, newRefund);
        }

        // 🔄 PUT Approve or Reject Refund (Admin Only)
        [HttpPut("{id}/status"), Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateRefundStatus(int id, [FromBody] Refund.Refund_Status newStatus)
        {
            var refund = await _context.Refunds.FindAsync(id);
            if (refund == null)
                return NotFound("Refund not found.");

            if (!Enum.IsDefined(typeof(Refund.Refund_Status), newStatus))
                return BadRequest("Invalid refund status.");

            refund.RefundStatus = newStatus;
            refund.RefundDate = DateTime.UtcNow;

            // ✅ Auto-cancel order if refund is completed
            if (newStatus == Refund.Refund_Status.Completed)
            {
                var order = await _context.Orders.FindAsync(refund.OrderID);
                if (order != null)
                {
                    order.OrderStatus = OrderStatus.Cancelled;
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Refund status updated to {newStatus}." });
        }

        // 🗑️ DELETE Refund (Only If Pending)
        [HttpDelete("{id}"), Authorize]
        public async Task<IActionResult> DeleteRefund(int id)
        {
            var refund = await _context.Refunds.FindAsync(id);
            if (refund == null) return NotFound();

            int userId = GetUserId();
            if (refund.UserID != userId) return Forbid();

            if (refund.RefundStatus != Refund.Refund_Status.Pending)
                return BadRequest("Only pending refunds can be deleted.");

            _context.Refunds.Remove(refund);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // 🔍 Helper method to get the current user's ID safely
        private int GetUserId()
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out int userId) ? userId : 0;
        }
    }
}
